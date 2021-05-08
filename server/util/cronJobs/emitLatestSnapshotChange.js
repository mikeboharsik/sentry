const cron = require('cron').CronJob;

const { getFileNames } = require('../getFileNames');
const { log } = require('../logger');
const { PATH_SNAPSHOTS } = require('../consts');

let latestFile = null;

const job = new cron('*/5 * * * * *', async () => {
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
}, null, true, 'America/New_York');

module.exports = job;
