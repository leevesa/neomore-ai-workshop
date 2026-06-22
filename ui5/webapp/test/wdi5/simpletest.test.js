/* global browser */

const { wdi5 } = require('wdio-ui5-service');

describe('test suite description', () => {
	before(async() => {
		await wdi5.goTo('#fineomoretemplate-display');
	});

	it('should find Page and return title', async() => {
		const pageSelector = {
			selector: {
				controlType: 'sap.m.Page',
				viewName: 'fi.neomore.template.view.Main',
				// if left undefined: the DOM element that should receive events, as determined by OPA5. This would search for special elements with the following priority: press, focus, root.
				interaction: 'root'
			}
		};
		const title = await browser.asControl(pageSelector).getProperty('title');
		expect(title).toEqual('Template');
	});
});