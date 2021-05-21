const { rm, stat } = require('fs').promises;

const { getFileNames } = require('../util/getFileNames');
const { log } = require('../util/logger');
const { PATH_GRAVEYARD } = require('../util/consts');

const name = 'cleanOutdatedGraveyardSnapshots';

const job = {
  name,
  schedule: '0 0 * * * *',
  getHandler: () => async () => {
    try {
      log(`${name} START`);

      const startTime = new Date();
      const cutoffTime = (new Date(startTime)).setDate(startTime.getDate() - 14);

      const relevantPath = PATH_GRAVEYARD;

      const fileNames = await getFileNames(relevantPath);
      const fileStatsJobs = fileNames.reduce((acc, cur) => {
        acc.push(stat(`${relevantPath}/${cur}`));
        return acc;
      }, []);

      const fileStats = await Promise.all(fileStatsJobs);
      const oldFileStats = fileStats.reduce((acc, cur, idx) => {
        const { mtime } = cur;
        if (mtime <= cutoffTime) {
          cur.name = fileNames[idx];
          acc.push(cur);
        }
        return acc;
      }, []);

      log(`${oldFileStats.length} outdated files out of ${fileNames.length} files in graveyard`);

      if (oldFileStats.length <= 0) return;

      const deleteJobs = oldFileStats.reduce((acc, cur) => {
        const { name } = cur;
        acc.push(rm(`${relevantPath}/${name}`));
        return acc;
      }, []);

      try {
        await deleteJobs;
      } catch (e) {
        throw e;
      }

      log(`Deleted ${deleteJobs.length} graveyard snapshots, ${fileNames.length - deleteJobs.length} graveyard snapshots remain`);
    } catch(e) {
      log(`Encountered error in scheduled job '${name}': ${e}`);
    } finally {
      log(`${name} END`);
    }
  },
};

module.exports = job;
