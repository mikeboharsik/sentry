const path = require('path');

const PATH_CLIENT = path.resolve(process.cwd(), '../client');
const PATH_CONFIG = path.resolve(process.cwd(), '../config.json');
const PATH_GRAVEYARD = path.resolve(process.cwd(), '../../graveyard');
const PATH_SERVER_CONFIG = path.resolve(process.cwd(), 'config.json');
const PATH_SERVER_LOG = path.resolve(process.cwd(), 'logs/log.txt');
const PATH_SNAPSHOT_GENERATION = path.resolve(process.cwd(), '../snapshot_gen');
const PATH_SNAPSHOTS = path.resolve(process.cwd(), '../../snapshots');

const PATH_BASE = `${PATH_SNAPSHOT_GENERATION}/base.jpg`;
const PATH_SNAPSHOTS_LOG = `${PATH_SNAPSHOT_GENERATION}/nohup.out`;

module.exports = {
	PATH_BASE,
	PATH_CLIENT,
	PATH_CONFIG,
	PATH_GRAVEYARD,
	PATH_SERVER_CONFIG,
	PATH_SERVER_LOG,
	PATH_SNAPSHOT_GENERATION,
	PATH_SNAPSHOTS_LOG,
	PATH_SNAPSHOTS,
};
