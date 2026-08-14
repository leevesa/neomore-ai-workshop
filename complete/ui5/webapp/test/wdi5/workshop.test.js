/* global browser, process */

'use strict';

const VIEW_NAME = 'fi.neomore.template.view.App';
const teamName = process.env.WORKSHOP_E2E_TEAM || `Workshop E2E ${Date.now()}`;
const workshopPassword = process.env.WORKSHOP_PASSWORD || '';

function control(id, controlType) {
	return browser.asControl({
		selector: {
			id,
			viewName: VIEW_NAME,
			controlType
		}
	});
}

describe('Workshop Chat baseline', () => {
	it('registers a participant', async() => {
		const nameInput = await control('registerName', 'sap.m.Input');
		await nameInput.setValue(teamName);

		if (workshopPassword) {
			const passwordInput = await control('registerPassword', 'sap.m.Input');
			await passwordInput.setValue(workshopPassword);
		}

		const joinButton = await control('joinButton', 'sap.m.Button');
		await joinButton.press();

		const participantName = await control('participantName', 'sap.m.Text');
		await browser.waitUntil(async() => {
			return await participantName.getText() === teamName;
		}, {
			timeoutMsg: 'Participant name did not appear after registration'
		});
	});

	it('sends a one-line chat message', async() => {
		const message = `E2E message ${Date.now()}`;
		const messageInput = await control('messageInput', 'sap.m.TextArea');
		await messageInput.setValue(message);

		const sendButton = await control('sendButton', 'sap.m.Button');
		await sendButton.press();

		await browser.waitUntil(async() => {
			return await messageInput.getValue() === '';
		}, {
			timeoutMsg: 'Composer was not cleared after sending a message'
		});

		const sentMessage = await browser.asControl({
			selector: {
				viewName: VIEW_NAME,
				controlType: 'sap.m.Text',
				properties: { text: message }
			}
		});
		expect(sentMessage.isInitialized()).toBe(true);
	});
});