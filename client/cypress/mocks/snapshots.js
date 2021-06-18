import { default as configFixture } from '../fixtures/config.json';
import { default as snapshotMocks } from '../fixtures/snapshot.json';

export const getSnapshot = () => {
  const pathPattern = /.*\/api\/snapshots\/(\d+)/;

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

      return req.reply({ body });
    },
  ).as('getSnapshot');
};

export const getSnapshotsConfig = (overrides = null) => {
  let body = configFixture;

  if (overrides) {
    body = { ...configFixture, ...overrides };
  }

  cy.intercept(
    /.*\/api\/snapshots\/config/,
    {
      body,
    },
  ).as('getSnapshotsConfig');
};

export const all = () => {
  getSnapshot();
  getSnapshotsConfig();
};