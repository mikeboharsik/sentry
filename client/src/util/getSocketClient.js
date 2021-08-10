import socketIOClient from 'socket.io-client';

function getSocketClient() {
	const client = socketIOClient()
		.on('connect', () => {
			const { id } = client;

			console.info(`Socket connected: ${id}`);
		})
		.on('disconnect', () => {
			const { id } = client;

			console.info(`Socket disconnected: ${id}`);
		});

	return client;
}

export default getSocketClient;
