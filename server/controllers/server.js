const path = require('path');
const { PATH_SERVER_LOG } = require('../util/consts');

const log = {
  method: 'get',
  pattern: '/api/server/log',
  handler: (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.sendFile(PATH_SERVER_LOG);
  },
};

module.exports = {
  routes: [log],
};
