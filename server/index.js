const express = require('express');
const http = require('http');

const app = express();
const httpServer = http.createServer(app);

const io = require('socket.io')(httpServer, {});
const { destroySockets } = require('./util/socket')(io);
const { startJobs, stopJobs } = require('./cronJobs')(io);

const { log } = require('./util/logger');

const { PATH_CLIENT } = require('./util/consts');
const { PORT } = require('./util/config');

const { applyMiddleware } = require('./util/middleware');
const { registerRoutes } = require('./controllers');

function shutdown() {
  stopJobs();
  destroySockets();

  httpServer.close(() => log('!!!!! Server has been shut down !!!!!'));

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

log('Configuring server');

applyMiddleware(app, io);
registerRoutes(app);

app.get('/api/stop', (req, res) => {
  res.send();
  
  shutdown();
});

app.get('*', (req, res) => {
  log(`Default handler hit for '${req.originalUrl}'`, req);

  res.sendFile(`${PATH_CLIENT}/index.html`);
});

app.use((err, req, res, next) => {
  log(`Encountered unexpected error: ${err.stack}`, req);
  res.status(500).send();
});

log(`Running server on port ${PORT}`);

startJobs();

httpServer.listen(PORT);