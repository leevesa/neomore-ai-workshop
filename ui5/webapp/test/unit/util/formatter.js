sap.ui.define([
	'fi/neomore/template/util/formatter'
], function(formatter) {
	'use strict';

	QUnit.module('Formatter tests', {
		beforeEach: function() {
			this.oFormatter = formatter;
		}
	});

	QUnit.test('checkboxValueFormatter, true', function(assert) {
		assert.equal(this.oFormatter.checkboxValueFormatter('X'), true, 'checkboxValueFormatter, true');
	});

	QUnit.test('checkboxValueFormatter, false', function(assert) {
		assert.equal(this.oFormatter.checkboxValueFormatter(''), false, 'checkboxValueFormatter, false');
	});

	QUnit.test('checkboxValueFormatter, undefined', function(assert) {
		assert.equal(this.oFormatter.checkboxValueFormatter(), false, 'checkboxValueFormatter, undefined');
	});

	QUnit.test('formatDateTime, default format', function(assert) {
		var oDate = new Date(2018, 1, 1);
		assert.equal(this.oFormatter.formatDateTime(oDate), '01.02.2018', 'formatDateTime, default format');
	});

	QUnit.test('formatDateTime, custom format', function(assert) {
		var oDate = new Date(2018, 1, 1);
		assert.equal(this.oFormatter.formatDateTime(oDate, 'dd.MM.yyyy HH:mm'), '01.02.2018 00:00', 'formatDateTime, custom format');
	});

	QUnit.test('formatDateTime, undefined', function(assert) {
		assert.equal(this.oFormatter.formatDateTime(), '', 'formatDateTime, undefined');
	});

	QUnit.test('formatDateTime, leap year', function(assert) {
		var oDate = new Date(2016, 1, 29);
		assert.equal(this.oFormatter.formatDateTime(oDate), '29.02.2016', 'formatDateTime, leap year');
	});

	QUnit.test('formatTime, no value passed', function(assert) {
		assert.equal(this.oFormatter.formatTime(), '', 'formatTime, no value passed');
	});

	QUnit.test('formatTime, default format', function(assert) {
		var oDate = new Date(2023, 5, 30, 14, 8, 0);
		const oTime = {
			ms: oDate.getTime() % 86400000
		};
		assert.equal(this.oFormatter.formatTime(oTime), '11:08', 'formatTime, default format');
	});

	QUnit.test('formatTime, custom format', function(assert) {
		var oDate = new Date(2023, 5, 30, 14, 8, 0);
		const oTime = {
			ms: oDate.getTime() % 86400000
		};
		assert.equal(this.oFormatter.formatTime(oTime, 'HH:mm:ss'), '11:08:00', 'formatTime, custom format');
	});

	QUnit.test('formatInputValue, no values', function(assert) {
		assert.equal(this.oFormatter.formatInputValue(), '', 'formatInputValue, no values');
	});

	QUnit.test('formatInputValue, 1, 2', function(assert) {
		assert.equal(this.oFormatter.formatInputValue(1, 2), '1 - 2', 'formatInputValue, 1, 2');
	});

	QUnit.test('formatInputValue, 1, undefined, 2', function(assert) {
		// eslint-disable-next-line no-undefined
		assert.equal(this.oFormatter.formatInputValue(1, undefined, 2), '1 - 2', 'formatInputValue, 1, 2');
	});

	QUnit.test('selectedStateFormatter, not selected', function(assert) {
		assert.equal(this.oFormatter.selectedStateFormatter('key', 'id'), false, 'selectedStateFormatter, false');
	});

	QUnit.test('selectedStateFormatter, selected', function(assert) {
		assert.equal(this.oFormatter.selectedStateFormatter('key', 'id', [{
			key: 'id'
		}]), true, 'selectedStateFormatter, true');
	});

	QUnit.test('oDataErrorToErrorString, nothing passed', function(assert) {
		assert.equal(this.oFormatter.oDataErrorToErrorString(), '', 'oDataErrorToErrorString, nothing passed');
	});

	QUnit.test('oDataErrorToErrorString, empty object passed', function(assert) {
		assert.equal(this.oFormatter.oDataErrorToErrorString({}), '', 'oDataErrorToErrorString, nothing passed');
	});

	QUnit.test('oDataErrorToErrorString, type one message', function(assert) {
		assert.equal(this.oFormatter.oDataErrorToErrorString({
			message: 'Internal Server Error'
		}), 'Internal Server Error', 'oDataErrorToErrorString, type one message');
	});

	QUnit.test('oDataErrorToErrorString, type two message', function(assert) {
		assert.equal(this.oFormatter.oDataErrorToErrorString({
			message: 'Internal Server Error',
			responseText: '{"error":{"message":{"value":"Response Text Error"}}}'
		}), 'Response Text Error', 'oDataErrorToErrorString, type two message');
	});

	QUnit.test('oDataErrorToErrorString, type three message', function(assert) {
		assert.equal(this.oFormatter.oDataErrorToErrorString({
			message: 'Internal Server Error',
			response: {
				body: '{"error":{"message":{"value":"Response Body Error"}}}'
			}
		}), 'Response Body Error', 'oDataErrorToErrorString, type three message');
	});

	QUnit.test('oDataErrorToErrorString, type four message', function(assert) {
		assert.equal(this.oFormatter.oDataErrorToErrorString({
			message: 'Internal Server Error',
			response: {
				body: {
					error: {
						message: {
							value: 'Response Body Error Object'
						}
					}
				}
			}
		}), 'Response Body Error Object', 'oDataErrorToErrorString, type four message');
	});
});
