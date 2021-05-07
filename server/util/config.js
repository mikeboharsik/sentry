const { existsSync, readFileSync, writeFileSync } = require('fs');
const { log } = require('./logger');

const { PATH_CONFIG } = require('./consts');

let PASSWORD = null;

if (existsSync(PATH_CONFIG)) {
  ({ PASSWORD } = JSON.parse(readFileSync(PATH_CONFIG)));
  log('Loaded config file');
} else {
  PASSWORD = 'PLEASECHANGETHIS';
  writeFileSync(PATH_CONFIG, JSON.stringify({ PASSWORD }, null, '  '));
  log('Failed to load config file and generated a new one');
}

module.exports = {
  PASSWORD,
};
