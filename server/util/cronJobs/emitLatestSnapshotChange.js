const { getFileNames } = require('../getFileNames');
const { log } = require('../logger');
const { PATH_SNAPSHOTS } = require('../consts');

let latestFile = null;

const job = {
  name: 'emitLatestSnapshotChange',
  schedule: '*/5 * * * * *',
  getHandler: (io) => async () => {
    try {
      const relevantPath = PATH_SNAPSHOTS;
  
      const cur = String((await getFileNames(relevantPath))[0]);
  
      if (latestFile !== null && latestFile !== cur) {
        io.emit('latestFile', cur);
      }
      
      latestFile = cur;
    } catch(e) {
      log(`Encountered error in scheduled job: ${e}`);
    }
  },
};

module.exports = job;
