import { default as configFixture } from '../fixtures/config.json';
import { default as snapshot0 } from '../fixtures/snapshot_0.json';
import { default as snapshot1 } from '../fixtures/snapshot_1.json';
import { default as snapshot2 } from '../fixtures/snapshot_2.json';

const snapshots = {
  snapshot0,
  snapshot1,
  snapshot2,
};

export const getSnapshot = () => {
  const pathPattern = /.*\/api\/snapshots\/(\d+)/;

  cy.intercept(
    {
      method: 'GET',
      url: pathPattern,
    },
    (req) => { 
      const num = req.url.match(pathPattern)[1];
      const body = snapshots[`snapshot${num}`];

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
