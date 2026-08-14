sap.ui.define([
	'fi/neomore/template/util/i18n'
], function(i18nUtil) {
	'use strict';

	QUnit.module('i18n Util tests', {
		beforeEach: function() {
		}
	});

	QUnit.test('getText, returns sKey if text is not available', function(assert) {
		assert.equal(i18nUtil.getText('X'), 'X', 'getText, returns sKey if text is not available');
	});

	QUnit.test('getText, returns correct text with existing key', function(assert) {
		assert.equal(i18nUtil.getText('COMMON_ERROR_TITLE'), 'Error', 'getText, returns correct text with existing key');
	});

	QUnit.test('getText, returns correct text for text with placeholders without placeholders', function(assert) {
		assert.equal(i18nUtil.getText('ERROR_MESSAGE_ERROR_LOADING_DATA'), '{0}', 'getText, returns correct text for text with placeholders without placeholders');
	});

	QUnit.test('getText, returns correct text with placeholders', function(assert) {
		assert.equal(i18nUtil.getText('ERROR_MESSAGE_ERROR_LOADING_DATA', ['Placeholder']), 'Placeholder', 'getText, returns correct text with placeholders');
	});
});
