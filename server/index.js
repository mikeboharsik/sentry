const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const cron = require('cron').CronJob;
const http = require('http');
const { mkdir, readdir, readFile, rename, writeFile } = require('fs').promises;

const app = express();
const httpServer = http.createServer(app);
const io = require('socket.io')(httpServer, {});

const { log } = require('./util/logger');

const { 
  PATH_BASE,
  PATH_CLIENT,
  PATH_CONFIG,
  PATH_GRAVEYARD,
  PATH_SNAPSHOTS_LOG,
  PATH_SNAPSHOTS,
 } = require('./util/consts');

 const { applyMiddleware } = require('./util/middleware');
 const { registerRoutes } = require('./controllers');

(async () => {  
  const port = 13370;
  
  const jobs = [];
  
  async function getFileNames(path) {
    return await readdir(path)
      .then(files => files.sort((a, b) => a < b ? 1 : a > b ? -1 : 0));
  }
  
  log('Configuring server');

  applyMiddleware(app);
  registerRoutes(app);

  app.get('/api/snapshots/base', (req, res) => {
    res.sendFile(path.join(PATH_BASE));
  });
  
  app.get('/api/snapshots/log', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.sendFile(path.join(PATH_SNAPSHOTS_LOG));
  });
  
  app.get('/api/snapshots/:idx', async (req, res) => {
    let { idx } = req.params;
    
    const contentType = req.get('Content-Type');
    const json = contentType === 'application/json';
    const relevantPath = PATH_SNAPSHOTS;
  
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
      res.sendFile(`${relevantPath}/${fileName}`);
    }
  });
  
  app.delete('/api/snapshots/:idx', async (req, res) => {  
    let { idx } = req.params;
  
    const relevantPath = PATH_SNAPSHOTS;
    
    const fileName = (await getFileNames(relevantPath))[idx];
    
    if (!fileName) return res.status(400).send();
    
    log(`${fileName} exists`, req);
    
    try {
      await readdir(PATH_GRAVEYARD);
    } catch {
      await mkdir(PATH_GRAVEYARD);
      log(`Created nonexistent dir '${PATH_GRAVEYARD}'`, req);
    }
  
    await rename(`${PATH_SNAPSHOTS}/${fileName}`, `${PATH_GRAVEYARD}/${fileName}`);
  
    log('emitting', req);
    io.emit('deleted', idx);
    log('emitted', req);
  
    res.status(200).send();
  });
  
  app.get('/api/graveyard/:idx', async (req, res) => {
    let { idx } = req.params;
    
    const contentType = req.get('Content-Type');
    const json = contentType === 'application/json';
    const relevantPath = PATH_GRAVEYARD;
    
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
      res.sendFile(`${relevantPath}/${fileName}`);
    }
  });
  
  app.post('/api/graveyard/:idx/restore', async (req, res) => {  
    let { idx } = req.params;
  
    const relevantPath = PATH_GRAVEYARD;
    
    const fileName = (await getFileNames(relevantPath))[idx];
    
    if (!fileName) return res.status(400).send();
    
    log(`${fileName} exists`, req);
  
    await rename(`${relevantPath}/${fileName}`, `${PATH_SNAPSHOTS}/${fileName}`);
  
    log('emitting', req);
    io.emit('deleted', idx);
    log('emitted', req);
  
    res.status(200).send();
  });
  
  app.get('/api/config*', async (req, res) => {
    const data = await readFile(PATH_CONFIG, { encoding: 'utf8' });
  
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
    const data = await readFile(PATH_CONFIG);
  
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
    
    await writeFile(PATH_CONFIG, result, { encoding: 'utf8' });
  
    res.set('Content-Type', 'application/json');
    res.send(result);
  });
  
  app.delete('/api/config*', async (req, res) => {
    const data = await readFile(PATH_CONFIG, { encoding: 'utf8' });
  
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
    
    await writeFile(PATH_CONFIG, result, { encoding: 'utf8' });
  
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
      { cwd: PATH_CLIENT },
      (err, stdout, stderr) => {
        res.set('Content-Type', 'text/plain');
        res.send(stdout);
      },
    );
  });
  
  app.get('*', (req, res) => {
    log(`Default handler hit for '${req.originalUrl}'`, req);
  
    res.sendFile(`${PATH_CLIENT}/index.html`);
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
      const relevantPath = PATH_SNAPSHOTS;
  
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
})();
