const { log } = require('./logger');

const sockets = [];

const curry = io => {
	io.on('connection', socket => {
		log(`[socketId:${socket.id}] Connected`);
		
		sockets.push(socket);
		
		socket.on('disconnecting', reason => {
			log(`[socketId:${socket.id}] Disconnected with reason: ${reason}`);
		});
	});

	const destroySockets = () => {
		sockets.forEach(socket => socket.destroy?.());

		log(`Destroyed ${sockets.length} existing sockets`);
	}

	return {
		destroySockets,
	};
};

module.exports = curry;
