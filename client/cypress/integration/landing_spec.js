import * as snapshotMocks from '../mocks/snapshots';

describe('Landing page (local)', () => {
  beforeEach(() => {
    snapshotMocks.getSnapshotsConfig();
    snapshotMocks.getSnapshot();
  });

  it('sends expected API requests', () => {
    cy.visit('http://localhost:3000/');

    cy.wait('@getSnapshot');
    cy.wait('@getSnapshotsConfig');
  });

  it('image overlay exists with expected properties', () => {
    cy.get('[data-cy="imageOverlay"]').contains('1/1/2000, 12:00:00 AM');
  });

  it('lastRead element exists with expected properties', () => {
    cy.get('[data-cy="lastRead"]')
      .should('exist')
      .and('have.css', 'color', 'rgb(255, 0, 0)');

    cy.get('[data-cy="lastRead"]').contains('Last read: 2000-01-01 05:00:00.000000');

    cy.get('[data-cy="lastRead"]')
      .invoke('attr', 'href')
      .should('match', /api\/server\/log/);
  });

  it('arrow elements exist with expected properties', () => {
    cy.get('[data-cy="leftArrow"]').should('exist');

    cy.get('[data-cy="rightArrow"]')
      .should('not.be.visible');
  });

  it('right arrow becomes visible after clicking left arrow', () => {
    cy.get('[data-cy="leftArrow"]').click();

    cy.get('[data-cy="rightArrow"]')
      .should('be.visible');
  });

  it('right arrow becomes invisible after clicking right arrow', () => {
    cy.get('[data-cy="rightArrow"]').click();

    cy.get('[data-cy="rightArrow"]')
      .should('not.be.visible');
  });
});
