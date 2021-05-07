const { routes: server } = require('./server');

const allRoutes = [...server];

const registerRoutes = app => {
  allRoutes.forEach(route => {
    const { handler, method, pattern } = route;

    app[method](pattern, handler);
  });
};

module.exports = { registerRoutes };
