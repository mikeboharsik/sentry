const cron = require('cron').CronJob;

const { log } = require('../util/logger');
const cleanOutdatedGraveyardSnapshots = require('./cleanOutdatedGraveyardSnapshots');
const emitLatestSnapshotChange = require('./emitLatestSnapshotChange');

const jobs = [];
const jobTemplates = [cleanOutdatedGraveyardSnapshots, emitLatestSnapshotChange];

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
		const { getHandler, name, schedule } = job;

		try {
			const newJob = new cron(schedule, getHandler({ io }), null, true, 'America/New_York');

			jobs.push(newJob);

			log(`Registered background job '${name}'`);
		} catch(e) {
			log(`Error creating background job '${name}': ${e}`);
		}
	});

	return {
		jobs,
		startJobs,
		stopJobs,
	};
};

module.exports = curry;
