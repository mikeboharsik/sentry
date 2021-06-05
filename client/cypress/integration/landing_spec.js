import * as snapshotMocks from '../mocks/snapshots';

describe('Landing page (local)', () => {
  beforeEach(() => {
    snapshotMocks.getSnapshot();
    snapshotMocks.getSnapshotsConfig();
  });

  describe('base state', () => {
    it('sends expected API requests', () => {
      cy.visit('/');
  
      cy.wait('@getSnapshot');
      cy.wait('@getSnapshotsConfig');
    });
  
    it('snapshot 0 is displayed', () => {
      cy.get('[data-cy="imageOverlay"]').contains('1/1/2000, 12:02:00 AM');
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
  });

  describe('base state with recent lastRead', () => {
    beforeEach(() => {
      const now = new Date();

      let year = now.getFullYear();
      let month = now.getUTCMonth() + 1;
      let date = now.getUTCDate();
      let hours = now.getUTCHours();
      let minutes = now.getUTCMinutes();
      let seconds = now.getUTCSeconds();
      let milliseconds = now.getUTCMilliseconds();

      if (month < 10) {
        month = `0${month}`;
      }

      if (hours < 10) {
        hours = `0${hours}`;
      }

      if (minutes < 10) {
        minutes = `0${minutes}`;
      }

      if (seconds < 10) {
        seconds = `0${seconds}`;
      }

      const lastRead = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}.${milliseconds}000`;

      snapshotMocks.getSnapshotsConfig({ lastRead });
    });

    it('lastRead text is not red', () => {
      cy.visit('/');

      cy.get('[data-cy="lastRead"]')
        .should('exist')
        .and('not.have.css', 'color', 'rgb(255, 0, 0)');
    });
  });

  describe('navigation', () => {
    it('right arrow becomes visible after clicking left arrow', () => {
      cy.get('[data-cy="leftArrow"]').click();
      cy.get('[data-cy="rightArrow"]')
        .should('be.visible');
    });
  
    it('snapshot 1 is displayed', () => {
      cy.get('[data-cy="imageOverlay"]').contains('1/1/2000, 12:01:00 AM');
    })
  
    it('clicks left arrow again', () => {
      cy.get('[data-cy="leftArrow"]').click();
      cy.get('[data-cy="rightArrow"]')
        .should('be.visible');
    });
  
    it('snapshot 2 is displayed', () => {
      cy.get('[data-cy="imageOverlay"]').contains('1/1/2000, 12:00:00 AM');
    })
  
    it('clicks right arrow and right arrow remains visible', () => {
      cy.get('[data-cy="rightArrow"]')
        .click()
        .should('be.visible');
    });
  
    it('snapshot 1 is displayed', () => {
      cy.get('[data-cy="imageOverlay"]').contains('1/1/2000, 12:01:00 AM');
    });
  
    it('right arrow becomes invisible after clicking right arrow twice', () => {
      cy.get('[data-cy="rightArrow"]')
        .click()
        .should('not.be.visible');
    });
  
    it('snapshot 0 is displayed', () => {
      cy.get('[data-cy="imageOverlay"]').contains('1/1/2000, 12:02:00 AM');
    });
  
    it('clicking config button navigates to config page', () => {
      cy.get('[data-cy="configLink"').click();
  
      cy.location('pathname').should('match', /\/config/);
  
      cy.get('[data-cy="configContainer"]').should('be.visible');
      cy.get('[data-cy="configInput"]').should('be.visible');
      cy.get('[data-cy="configButton"]').should('be.visible');
    });
  });
});
