const { existsSync, readFileSync, writeFileSync } = require('fs');
const { log } = require('./logger');
const defaultConfig = require('./config.default.json');

const { PATH_SERVER_CONFIG } = require('./consts');

let PASSWORD = null;

if (existsSync(PATH_SERVER_CONFIG)) {
  ({ PASSWORD } = JSON.parse(readFileSync(PATH_SERVER_CONFIG)));
  log(`Loaded config file '${PATH_SERVER_CONFIG}'`);
} else {
  ({ PASSWORD } = defaultConfig);
  writeFileSync(PATH_SERVER_CONFIG, JSON.stringify(defaultConfig, null, '  '));
  log(`Failed to load config file '${PATH_SERVER_CONFIG}' and generated a default one`);
}

module.exports = {
  PASSWORD,
};
