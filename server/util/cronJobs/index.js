const emitLatestSnapshotChange = require('./emitLatestSnapshotChange');

const jobs = [
  emitLatestSnapshotChange,
];

const startJobs = () => {
  jobs.forEach(job => {
    job.start();
  });
};

const stopJobs = () => {
  jobs.forEach(job => {
    job.stop();
  });
};

module.exports = {
  jobs,
  startJobs,
  stopJobs,
}