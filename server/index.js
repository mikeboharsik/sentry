const express = require('express');
const http = require('http');

const app = express();
const httpServer = http.createServer(app);
const io = require('socket.io')(httpServer, {});
const { startJobs, stopJobs } = require('./util/cronJobs')(io);

const { log } = require('./util/logger');

const { PATH_CLIENT } = require('./util/consts');

const { applyMiddleware } = require('./util/middleware');
const { registerRoutes } = require('./controllers');

const sockets = [];

function shutdown() {
  stopJobs();

  sockets.forEach(socket => socket.destroy?.());

  httpServer.close(() => log('!!!!! Server has been shut down !!!!!'));

  process.exit(0);
}

(async () => {  
  const port = 13370;
  
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

  io.on('connection', socket => {
    log(`[socketId:${socket.id}] Connected`);
    
    sockets.push(socket);
    
    socket.on('disconnecting', reason => {
      log(`[socketId:${socket.id}] Disconnected with reason: ${reason}`);
    });
  });
  
  log(`Server running`);
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  startJobs();

  httpServer.listen(port);
})();
