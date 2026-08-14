QUnit.config.autostart = false;

sap.ui.define([
	'fi/neomore/template/util/chat'
], function(chat) {
	'use strict';

	QUnit.module('chat util tests');

	QUnit.test('normalizeMessage trims outer whitespace', function(assert) {
		assert.equal(chat.normalizeMessage('  hello room  '), 'hello room');
	});

	QUnit.test('normalizeMessage rejects whitespace-only content', function(assert) {
		assert.equal(chat.normalizeMessage(' \n\t '), '');
	});

	QUnit.test('messageParameters omits an unselected reply', function(assert) {
		assert.deepEqual(chat.messageParameters(' hello ', null), { message: 'hello' });
	});

	QUnit.test('messageParameters preserves the reply target', function(assert) {
		assert.deepEqual(chat.messageParameters('hello', '42'), {
			message: 'hello',
			replyToEventId: '42'
		});
	});

	QUnit.test('parseMetadata handles valid and malformed values', function(assert) {
		assert.deepEqual(chat.parseMetadata('{"replyToEventId":42}'), { replyToEventId: 42 });
		assert.deepEqual(chat.parseMetadata('not json'), {});
	});
});