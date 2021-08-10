// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

Cypress.on('test:before:run', () => {
	/*
	Cypress.automation('remote:debugger:protocol', {
		command: 'Emulation.setLocaleOverride',
		params: {
			locale: 'en-US'
		}
	});
	*/

	// https://github.com/cypress-io/cypress/issues/7890#issuecomment-655174901
	// This is necessary to ensure that tests don't fail if a user in a different timezone runs them
	Cypress.automation('remote:debugger:protocol', {
		command: "Emulation.setTimezoneOverride",
		params: {
			timezoneId: "America/New_York",
		}
	});
});