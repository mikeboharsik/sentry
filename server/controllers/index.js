const { log } = require('../util/logger');

const { routes: bash } = require('./bash');
const { routes: client } = require('./client');
const { routes: graveyard } = require('./graveyard');
const { routes: server } = require('./server');
const { routes: snapshots } = require('./snapshots');

const { PATH_CLIENT } = require('../util/consts');

const curry = ({ destroySockets, httpServer, stopJobs }) => {
	function shutdown() {
		stopJobs();
		destroySockets();
	
		httpServer.close(() => {
			log('!!!!! Server has been shut down !!!!!');

			process.exit(0);
		});
	}

	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);

	const finalRoutes = [
		{
			method: 'get',
			pattern: '/api/stop',
			handler: (req, res) => {
				res.send();
				
				shutdown();
			},
		},
		{
			method: 'get',
			pattern: '*',
			handler: (req, res) => {
				log(`Default handler hit for '${req.originalUrl}'`, req);
			
				res.sendFile(`${PATH_CLIENT}/index.html`);
			},
		},
	];
	
	const allRoutes = [...bash, ...client, ...graveyard, ...server, ...snapshots, ...finalRoutes];
	
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

	return { registerRoutes };
};

module.exports = curry;
