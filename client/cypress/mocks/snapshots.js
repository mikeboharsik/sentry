import { default as configFixture } from '../fixtures/config.json';
import { default as snapshotMocks } from '../fixtures/snapshot.json';

export const getSnapshot = (overrides = {}) => {
	const pathPattern = /.*\/api\/snapshots\/(\d+)/;

	let headers = {};
	if (overrides.headers) {
		headers = overrides.headers;
	}

	cy.intercept(
		{
			method: 'GET',
			url: pathPattern,
		},
		(req) => { 
			const num = req.url.match(pathPattern)[1];
			const body = snapshotMocks[num];

			if (!body) {
				return req.reply({ statusCode: 404 });
			}

			return req.reply({ body, headers });
		},
	).as('getSnapshot');
};

export const getSnapshotsConfig = (overrides = {}) => {
	let body = configFixture;
	if (overrides.body) {
		body = { ...configFixture, ...overrides.body };
	}

	let headers = {};
	if (overrides.headers) {
		headers = overrides.headers;
	}

	cy.intercept(
		/.*\/api\/snapshots\/config/,
		{
			body,
			headers,
		},
	).as('getSnapshotsConfig');
};

export const all = () => {
	getSnapshot();
	getSnapshotsConfig();
};