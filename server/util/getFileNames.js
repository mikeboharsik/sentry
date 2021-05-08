const { readdir } = require('fs').promises;

async function getFileNames(path) {
  return await readdir(path)
    .then(files => files.sort((a, b) => a < b ? 1 : a > b ? -1 : 0));
}

module.exports = { getFileNames };
