const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cron = require('cron').CronJob;
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const { createLogger, ConsoleTransport, RotatingFileTransport } = require('@boost/log');

const { mkdir, readdir, readFile, rename, writeFile } = require('fs').promises;

const app = express();
const httpServer = http.createServer(app);
const io = require('socket.io')(httpServer, {});

const { PASSWORD } = JSON.parse(fs.readFileSync('./config.json'));
process.env.PASSWORD = PASSWORD;

const port = 13370;

const pathClient = '../client';
const pathConfig = '../config.json';
const pathServerLog = './log.txt';
const pathSnapshotGeneration = '../snapshot_gen';
const pathBase = `${pathSnapshotGeneration}/base.jpg`;
const pathSnapshots = '../../snapshots';
const pathSnapshotsLog = `${pathSnapshotGeneration}/nohup.out`;
const pathGraveyard = '../../graveyard';

const jobs = [];

const logger = createLogger({
  name: 'logger',
  transports: [
    new ConsoleTransport(),
    new RotatingFileTransport({
      levels: ['debug'],
      path: pathServerLog,
      rotation: 'hourly',
    }),
  ]
});

function log(msg, req = {}) {
  const { cid } = req;

  const cidStr = cid ? `[cid:${cid}] ` : ' ';

  logger.debug(`${cidStr}${msg}`);
}

async function getFileNames(path) {
  return await readdir(path)
    .then(files => files.sort((a, b) => a < b ? 1 : a > b ? -1 : 0));
}

log('Serving starting');

function rawBody(req, res, next) {
  req.setEncoding('utf8');
  req.rawBody = '';
  req.on('data', function(chunk) {
    req.rawBody += chunk;
  });
  req.on('end', function(){
    try { if(req.rawBody) req.body = JSON.parse(req.rawBody) } catch(e) { console.error(e) }
    
    next();
  });
}

app.use(rawBody);

app.use((req, res, next) => {
  req.cid = uuidv4().toUpperCase();

  log(`${req.ip} -> ${req.method} ${req.originalUrl}`, req);
  
  res.removeHeader('X-Powered-By');
  
  next();
});

app.use((req, res, next) => {
  const { ip, method, originalUrl } = req;
  
  const isClientLocal = ip.match(/192\.168\.1/);

  if (isClientLocal) { 
    res.set('X-Authenticated', 'true')
    res.set('Access-Control-Allow-Headers', '*');
    res.set('Access-Control-Allow-Origin', '*');
    req.isAuthenticated = true;
  } else {
    const pass = req.header('pass');
    req.isAuthenticated = pass === PASSWORD;
  }
  
  switch(method.toUpperCase()) {
    case 'POST':
    case 'PATCH':
    case 'DELETE':
      if (isClientLocal) {
        next();
      } else {
        return res.status(404).send();
      }
      break;
    default:
      next();
  }
});

app.use((req, res, next) => {
  const authPatterns = [
    '/api/snapshots/*'
  ];

  const { isAuthenticated, originalUrl } = req;

  if (authPatterns.some(pattern => new RegExp(pattern).exec(originalUrl)) && !isAuthenticated) {
    return res.status(404).send();
  }

  next();
});

app.use(express.static(pathClient));

app.get('/api/snapshots/base', (req, res) => {
	res.sendFile(path.join(__dirname, pathBase));
});

app.get('/api/snapshots/log', (req, res) => {
  res.set('Content-Type', 'text/plain');
	res.sendFile(path.join(__dirname, pathSnapshotsLog));
});

app.get('/api/snapshots/:idx', async (req, res) => {
  let { idx } = req.params;
  
  const contentType = req.get('Content-Type');
  const json = contentType === 'application/json';
  const relevantPath = pathSnapshots;

  const fileName = (await getFileNames(relevantPath))[idx];
  
  if (json) {
    const data = await readFile(`${relevantPath}/${fileName}`, { encoding: 'base64' });

    const info = JSON.stringify({
      data,
      name: fileName,
    });

    res.set('Content-Type', 'application/json');
    res.send(info);
  } else {
    res.sendFile(path.join(__dirname, `${relevantPath}/${fileName}`));
  }
});

app.delete('/api/snapshots/:idx', async (req, res) => {  
  let { idx } = req.params;

  const relevantPath = pathSnapshots;
  
  const fileName = (await getFileNames(relevantPath))[idx];
  
  if (!fileName) return res.status(400).send();
  
  log(`${fileName} exists`, req);
  
  try {
    await readdir(pathGraveyard);
  } catch {
    await mkdir(pathGraveyard);
    log(`Created nonexistent dir '${pathGraveyard}'`, req);
  }

  await rename(`${pathSnapshots}/${fileName}`, `${pathGraveyard}/${fileName}`);

  log('emitting', req);
  io.emit('deleted', idx);
  log('emitted', req);

  res.status(200).send();
});

app.get('/api/graveyard/:idx', async (req, res) => {
  let { idx } = req.params;
  
  const contentType = req.get('Content-Type');
  const json = contentType === 'application/json';
  const relevantPath = pathGraveyard;
  
  const fileName = (await getFileNames(relevantPath))[idx];
  
  if (json) {
    const data = await readFile(`${relevantPath}/${fileName}`, { encoding: 'base64' });

    const info = JSON.stringify({
      data,
      name: fileName,
    });

    res.set('Content-Type', 'application/json');
    res.send(info);
  } else {
    res.sendFile(path.join(__dirname, `${relevantPath}/${fileName}`));
  }
});

app.post('/api/graveyard/:idx/restore', async (req, res) => {  
  let { idx } = req.params;

  const relevantPath = pathGraveyard;
  
  const fileName = (await getFileNames(relevantPath))[idx];
  
  if (!fileName) return res.status(400).send();
  
  log(`${fileName} exists`, req);

  await rename(`${relevantPath}/${fileName}`, `${pathSnapshots}/${fileName}`);

  log('emitting', req);
  io.emit('deleted', idx);
  log('emitted', req);

  res.status(200).send();
});

app.get('/api/server/log', (req, res) => {
  res.set('Content-Type', 'text/plain');
	res.sendFile(path.join(__dirname, pathServerLog));
});

app.get('/api/config*', async (req, res) => {
  const data = await readFile(pathConfig, { encoding: 'utf8' });

  const json = JSON.parse(data);
  let result = json;
  
  if (req.params[0]) {
    const paths = req.params[0]
      .split('/')
      .reduce((acc, cur) => { if (cur) acc.push(cur); return acc; }, []);
    
    for (const path of paths) {
      result = result[path];
    }
  }
  
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify(result, null, '  '));
});

app.patch('/api/config*', async (req, res) => {
  const data = await readFile(pathConfig);

  const json = JSON.parse(data);
  const paths = req.params[0].split('/').reduce((acc, cur) => { if (cur) acc.push(cur); return acc; }, []);
  let result = json;
  
  const { rawBody } = req;
  let inputValue = parseFloat(rawBody);
  if (isNaN(inputValue)) {
    switch(rawBody) {
      case 'true':
        inputValue = true;
        break;
      case 'false':
        inputValue = false;
        break;
      default:
        inputValue = rawBody;
        break;
    }
  }
  
  if (paths.length === 1) {
    json[paths[0]] = inputValue;
  } else if (paths.length > 1) {
    let cur = json;
    
    for (i = 0; i < paths.length - 1; i++){
      const path = paths[i];
      cur = cur[path];
    }
    
    cur[paths[paths.length - 1]] = inputValue;
  }
  
  result = JSON.stringify(json, null, '  ');
  
  await writeFile(pathConfig, result, { encoding: 'utf8' });

  res.set('Content-Type', 'application/json');
  res.send(result);
});

app.delete('/api/config*', async (req, res) => {
  const data = await readFile(pathConfig, { encoding: 'utf8' });

  const json = JSON.parse(data);
  const paths = req.params[0].split('/').reduce((acc, cur) => { if (cur) acc.push(cur); return acc; }, []);
  let result = json;
  
  if (paths.length === 1) {
    delete json[paths[0]];
  } else if (paths.length > 1) {
    let cur = json;
    
    for (i = 0; i < paths.length - 1; i++){
      const path = paths[i];
      cur = cur[path];
    }
    
    delete cur[paths[paths.length - 1]];
  }
  
  result = JSON.stringify(json, null, '  ');
  
  res.send(result);
  
  await writeFile(pathConfig, result, { encoding: 'utf8' });

  res.set('Content-Type', 'application/json');
  res.send(result);
});

app.post('/api/bash', (req, res) => {
  console.log(req.body);
  
  const { body: { command } } = req;
  
  if (!command) {
    res.status(400);
    return res.send('Missing command');
  }
  
  exec(command, (err, stdout, stderr) => {
    if (stderr) {
      res.status(500);
      return res.send(stderr);
    }
    
    return res.send(stdout);
  });
});

app.get('/api/stop', (req, res) => {
	res.send();
  
  shutdown();
});

app.get('/api/client/build', (req, res) => {
	exec(
    'yarn build',
    { cwd: pathClient },
    (err, stdout, stderr) => {
      res.set('Content-Type', 'text/plain');
      res.send(stdout);
    },
  );
});

app.get('*', (req, res) => {
  log(`Default handler hit for '${req.originalUrl}'`, req);

  res.sendFile(path.join(__dirname, `${pathClient}/index.html`));
});

const sockets = [];
io.on('connection', socket => {
  log(`[socketId:${socket.id}] Connected`);
  
  sockets.push(socket);
  
  socket.on('disconnecting', reason => {
    log(`[socketId:${socket.id}] Disconnected with reason: ${reason}`);
  });
});

let latestFile = null;

jobs.push(
  new cron('*/5 * * * * *', async () => {
    const relevantPath = pathSnapshots;

    const cur = String((await getFileNames(relevantPath))[0]);

    if (latestFile !== null && latestFile !== cur) {
      io.emit('latestFile', cur);
    }
    
    latestFile = cur;
  }, null, true, 'America/New_York')
);

jobs.forEach(job => job.start());

log(`Server running`);

function shutdown() {
  jobs.forEach(job => job.stop());

  sockets.forEach(socket => socket.destroy?.());
  
  log('Closing down server');
  httpServer.close();
  
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

httpServer.listen(port);