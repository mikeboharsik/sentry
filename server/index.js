const express = require('express');
const http = require('http');

const app = express();
const httpServer = http.createServer(app);

const io = require('socket.io')(httpServer, {});
const { destroySockets } = require('./util/socket')(io);
const { startJobs, stopJobs } = require('./cronJobs')(io);

const { log } = require('./util/logger');

const { PORT } = require('./util/config');

const { applyFinalMiddleware, applyMiddleware } = require('./util/middleware');
const { registerRoutes } = require('./controllers')({ destroySockets, httpServer, stopJobs });

log('Configuring server');

applyMiddleware(app, io);
registerRoutes(app);
applyFinalMiddleware(app);

log(`Running server on port ${PORT}`);

startJobs();

httpServer.listen(PORT);