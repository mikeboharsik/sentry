const { exec } = require('child_process');

const triggerBuild = {
	method: 'get',
	pattern: '/api/client/build',
	handler: (req, res) => {
		exec(
			'yarn build',
			{ cwd: PATH_CLIENT },
			(err, stdout, stderr) => {
				res.set('Content-Type', 'text/plain');
				res.send(stdout);
			},
		);
	},
};

module.exports = { routes: [triggerBuild] };
