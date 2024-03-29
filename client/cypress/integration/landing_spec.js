import { default as getLastReadFormat } from '../util/getLastReadFormat';
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
				.should('be.visible')
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

	describe('lastRead styling', () => {
		describe('recent lastRead', () => {
			beforeEach(() => {
				const lastRead = getLastReadFormat();
	
				snapshotMocks.getSnapshotsConfig({ body: { lastRead } });
			});
	
			it('lastRead text is not red', () => {
				cy.visit('/');
	
				cy.get('[data-cy="lastRead"]')
					.should('exist')
					.and('not.have.css', 'color', 'rgb(255, 0, 0)');
			});
		});
	
		describe('outdated lastRead', () => {
			beforeEach(() => {
				const lastRead = getLastReadFormat(new Date('2000-01-01 05:00:00'));
	
				snapshotMocks.getSnapshotsConfig({ body: { lastRead } });
			});
	
			it('lastRead text is red', () => {
				cy.visit('/');
	
				cy.get('[data-cy="lastRead"]')
					.should('exist')
					.and('have.css', 'color', 'rgb(255, 0, 0)');
			});
		});
	});

	describe('unauthenticated with isPaused permutations', () => {
		it('isPaused is false and no indicator appears', () => {
			snapshotMocks.getSnapshot({ headers: { 'X-Authenticated': '' } });
			snapshotMocks.getSnapshotsConfig({ body: { isPaused: false } });

			cy.visit('/');
			cy.wait('@getSnapshotsConfig');

			cy.get('[data-cy="PlayIcon"]')
				.should('not.exist');
			cy.get('[data-cy="PauseIcon"]')
				.should('not.exist');
		});

		it('isPaused is true and no indicator appears', () => {
			snapshotMocks.getSnapshot({ headers: { 'X-Authenticated': '' } });
			snapshotMocks.getSnapshotsConfig({ body: { isPaused: true } });

			cy.visit('/');
			cy.wait('@getSnapshotsConfig');

			cy.get('[data-cy="PlayIcon"]')
				.should('not.exist');
			cy.get('[data-cy="PauseIcon"]')
				.should('not.exist');
		});
	});

	describe('authenticated with isPaused permutations', () => {
		it('isPaused is false and play button appears', () => {
			snapshotMocks.getSnapshot({ headers: { 'X-Authenticated': 'true' } });
			snapshotMocks.getSnapshotsConfig({ body: { isPaused: false } });

			cy.visit('/');
			cy.wait('@getSnapshotsConfig');

			cy.get('[data-cy="PlayIcon"]')
				.should('exist');
			cy.get('[data-cy="PauseIcon"]')
				.should('not.exist');
		});

		it('isPaused is true and pause button appears', () => {
			snapshotMocks.getSnapshot({ headers: { 'X-Authenticated': 'true' } });
			snapshotMocks.getSnapshotsConfig({ body: { isPaused: true } });

			cy.visit('/');
			cy.wait('@getSnapshotsConfig');

			cy.get('[data-cy="PlayIcon"]')
				.should('not.exist');
			cy.get('[data-cy="PauseIcon"]')
				.should('exist');
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
