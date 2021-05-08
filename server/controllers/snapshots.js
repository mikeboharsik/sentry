const path = require('path');
const { mkdir, readdir, readFile } = require('fs').promises;

const { PATH_BASE, PATH_CONFIG, PATH_GRAVEYARD, PATH_SNAPSHOTS, PATH_SNAPSHOTS_LOG } = require('../util/consts');
const { getFileNames } = require('../util/getFileNames');
const { log } = require('../util/logger');

const getBase = {
  method: 'get',
  pattern: '/api/snapshots/base',
  handler: (req, res) => {
    res.sendFile(path.join(PATH_BASE));
  },
};

const getLog = {
  method: 'get',
  pattern: '/api/snapshots/log',
  handler: (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.sendFile(path.join(PATH_SNAPSHOTS_LOG));
  },
};

const getSnapshot = {
  method: 'get',
  pattern: '/api/snapshots/:idx',
  handler: async (req, res) => {
    let { idx } = req.params;

    const contentType = req.get('Content-Type');
    const json = contentType === 'application/json';
    const relevantPath = PATH_SNAPSHOTS;

    const fileName = (await getFileNames(relevantPath))[idx];
    
    const filePath = `${relevantPath}/${fileName}`;

    if (json) {
      const data = await readFile(filePath, { encoding: 'base64' });
  
      const info = JSON.stringify({
        data,
        name: fileName,
      });
  
      res.set('Content-Type', 'application/json');
      res.send(info);
    } else {
      res.sendFile(filePath);
    }
  },
};

const deleteSnapshot = {
  method: 'delete',
  pattern: '/api/snapshots/:idx',
  handler: async (req, res) => {  
    let { idx } = req.params;
  
    const relevantPath = PATH_SNAPSHOTS;
    
    const fileName = (await getFileNames(relevantPath))[idx];
    
    if (!fileName) return res.status(400).send();
    
    try {
      await readdir(PATH_GRAVEYARD);
    } catch {
      await mkdir(PATH_GRAVEYARD);
      log(`Created nonexistent dir '${PATH_GRAVEYARD}'`, req);
    }
  
    await rename(`${PATH_SNAPSHOTS}/${fileName}`, `${PATH_GRAVEYARD}/${fileName}`);
  
    log('emitting', req);
    res.io.emit('deleted', idx);
    log('emitted', req);
  
    res.status(200).send();
  },
}

const getConfig = {
  method: 'get',
  pattern: '/api/snapshots/config*',
  handler: async (req, res) => {
    log(`Reading config file '${PATH_CONFIG}'`);
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
  },
};

const patchConfig = {
  method: 'patch',
  pattern: '/api/snapshots/config*',
  handler: async (req, res) => {
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
  },
};

const deleteConfig = {
  method: 'delete',
  pattern: '/api/snapshots/config*',
  handler: async (req, res) => {
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
  },
};

module.exports = {
  routes: [
    getConfig,
    patchConfig,
    deleteConfig,
    getBase,
    getLog,
    getSnapshot,
    deleteSnapshot,
  ],
};
