const cron = require('cron').CronJob;

const { log } = require('../logger');
const emitLatestSnapshotChange = require('./emitLatestSnapshotChange');

const jobs = [];
const jobTemplates = [emitLatestSnapshotChange];

const startJobs = () => {
  jobs.forEach(job => {
    job.start();
  });

  log('Started background jobs');
};

const stopJobs = () => {
  jobs.forEach(job => {
    job.stop();
  });

  log('Stopped background jobs');
};

const curry = io => {
  jobTemplates.forEach(job => {
    try {
      const { getHandler, name, schedule } = job;

      const newJob = new cron(schedule, getHandler(io), null, true, 'America/New_York');

      jobs.push(newJob);

      log(`Registered background job '${name}'`);
    } catch(e) {
      log(`Error in creating background jobs: ${e}`);
    }
  });

  return {
    jobs,
    startJobs,
    stopJobs,
  };
};

module.exports = curry;
