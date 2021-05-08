const { log } = require('../util/logger');

const { routes: bash } = require('./bash');
const { routes: client } = require('./client');
const { routes: graveyard } = require('./graveyard');
const { routes: server } = require('./server');
const { routes: snapshots } = require('./snapshots');

const allRoutes = [...bash, ...client, ...graveyard, ...server, ...snapshots];

const registerRoutes = app => {
  allRoutes.forEach(route => {
    const { handler, method, pattern } = route;

    try {
      app[method](pattern, handler);
      log(`Registered '${method} ${pattern}'`);
    } catch (e) {
      log(`Failed to register '${method} ${pattern}': ${e}`);
    }
  });

  log(`Processed ${allRoutes.length} controller routes`);
};

module.exports = { registerRoutes };
