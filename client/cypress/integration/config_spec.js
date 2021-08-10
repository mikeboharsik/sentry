import * as snapshotMocks from '../mocks/snapshots';

describe('Configuration page', () => {
	before(() => {
		cy.window()
			.its('sessionStorage')
			.invoke('clear');
	});

	after(() => {
		cy.window()
			.its('sessionStorage')
			.invoke('clear');
	});

	it('session storage is clear', () => {
		cy.window()
			.its('sessionStorage')
			.its('length')
			.should('equal', 0);
	});

	it('expected elements exist', () => {
		cy.visit('/config')

		cy.get('[data-cy="configContainer"]').should('be.visible');
		cy.get('[data-cy="configInput"]').should('be.visible');
		cy.get('[data-cy="configButton"]').should('be.visible');
	});

	it('entering text and clicking button sets sessionStorage.pass and navigates to landing page', () => {
		snapshotMocks.all();

		const newPassword = 'NEW PASSWORD';

		cy.get('[data-cy="configInput"]').type(newPassword);
		cy.get('[data-cy="configButton"]').click();

		cy.window()
			.its('sessionStorage')
			.invoke('getItem', 'pass')
			.should('equal', newPassword);

		cy.location('pathname').should('match', /\/$/);
	});

	it('expected elements exist', () => {
		cy.get('[data-cy="configContainer"]').should('not.exist');
		cy.get('[data-cy="configInput"]').should('not.exist');
		cy.get('[data-cy="configButton"]').should('not.exist');

		cy.get('[data-cy="lastRead"]').should('be.visible');
		cy.get('[data-cy="configLink"').should('be.visible');
	});
});