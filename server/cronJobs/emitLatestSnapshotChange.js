const { getFileNames } = require('../util/getFileNames');
const { log } = require('../util/logger');
const { PATH_SNAPSHOTS } = require('../util/consts');

const name = 'emitLatestSnapshotChange';

let latestFile = null;

const job = {
	name,
	schedule: '*/5 * * * * *',
	getHandler: ({ io }) => async () => {
		try {
			log(`${name} START`);

			const relevantPath = PATH_SNAPSHOTS;
	
			const cur = String((await getFileNames(relevantPath))[0]);
	
			if (latestFile !== null && latestFile !== cur) {
				io.emit('latestFile', cur);
			}
			
			latestFile = cur;
		} catch(e) {
			log(`Encountered error in scheduled job '${name}': ${e}`);
		} finally {
			log(`${name} END`);
		}
	},
};

module.exports = job;
