const { readFile, rename } = require('fs').promises;

const { getFileNames } = require('../util/getFileNames');

const { PATH_GRAVEYARD } = require('../util/consts');

const getSnapshot = {
  method: 'get',
  pattern: '/api/graveyard/:idx',
  handler: async (req, res) => {
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
  },
}

const restoreSnapshot = {
  method: 'post',
  pattern: '/api/graveyard/:idx/restore',
  handler: async (req, res) => {  
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
  },
}

module.exports = {
  routes: [getSnapshot, restoreSnapshot],
}
