const { NIL } = require('uuid');
const { createLogger, ConsoleTransport, RotatingFileTransport } = require('@boost/log');

const { PATH_SERVER_LOG } = require('./consts');

const logger = createLogger({
  name: 'logger',
  transports: [
    new RotatingFileTransport({
      levels: ['trace', 'debug', 'info', 'warn', 'error'],
      path: PATH_SERVER_LOG,
      rotation: 'hourly',
    }),
  ]
});

function log(msg, req = {}) {
  let { cid } = req;
  if (!cid) { cid = NIL; }

  const cidStr = `[cid:${cid}] `;

  logger.debug(`${cidStr}${msg}`);
}

module.exports = { log };
