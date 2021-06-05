import { default as configFixture } from '../fixtures/config.json';
import { default as snapshotFixture } from '../fixtures/snapshot.json';

export const getSnapshot = () => {
  cy.intercept(
    {
      method: 'GET',
      url: /.*\/api\/snapshots\/\d+/g,
    },
    {
      body: snapshotFixture,
      statusCode: 200,
    },
  ).as('getSnapshot');
};

export const getSnapshotsConfig = ({ lastRead } = {}) => {
  let body = configFixture;

  if (lastRead) {
    body = { ...configFixture, lastRead };
  }

  cy.intercept(
    {
      method: 'GET',
      url: '**/api/snapshots/config',
    },
    {
      body,
      statusCode: 200,
    },
  ).as('getSnapshotsConfig');
};
