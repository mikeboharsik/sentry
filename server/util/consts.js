const PATH_ROOT = "/home/pi/temp/sentry"
const PATH_CLIENT = `/home/pi/sentry/client`;
const PATH_CONFIG = `${PATH_ROOT}/config.json`;
const PATH_GRAVEYARD = `${PATH_ROOT}/graveyard`;
const PATH_SERVER = `${PATH_ROOT}/server`;
const PATH_SERVER_CONFIG = `${PATH_SERVER}/config.json`;
const PATH_SERVER_LOG = `${PATH_SERVER}/logs/log.txt`;
const PATH_SNAPSHOTS = `${PATH_ROOT}/snapshots`;

const PATH_BASE_IMAGE = `${PATH_ROOT}/base.jpg`;
const PATH_SNAPSHOTS_LOG = `${PATH_ROOT}/nohup.out`;

module.exports = {
	PATH_BASE_IMAGE,
	PATH_CLIENT,
	PATH_CONFIG,
	PATH_GRAVEYARD,
	PATH_SERVER_CONFIG,
	PATH_SERVER_LOG,
	PATH_SNAPSHOT_GENERATION,
	PATH_SNAPSHOTS_LOG,
	PATH_SNAPSHOTS,
};
