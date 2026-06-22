sap.ui.define([
	'fi/neomore/template/util/oData',
	'sap/ui/model/odata/v2/ODataModel'
], function(oDataUtil, ODataModel) {
	'use strict';

	QUnit.module('oData util tests', {
		beforeEach: function() {
		}
	});

	QUnit.test('getOdataModel, should return new oDataModel', function(assert) {
		const oDataModel = oDataUtil.getOdataModel('NEOMORE');
		assert.true(oDataModel instanceof ODataModel, 'getOdataModel returns oDataModel');
	});

	QUnit.test('getOdataModel, should throw error with unknown service name', function(assert) {
		assert.throws(() => {
			return oDataUtil.getOdataModel('UNKNOWN_SERVICE_NAME');
		});
	});

	QUnit.test('generatePathToService, no keys passed, should return passed path', function(assert) {
		const sExpected = '/TestSet';
		const sPath = oDataUtil.generatePathToService('/TestSet');
		assert.deepEqual(sPath, sExpected, 'generatePathToService, /TestSet');
	});

	QUnit.test('generatePathToService, keys passed, should return correct path', function(assert) {
		const sExpected = '/TestSet(test=\'test\')';
		const sPath = oDataUtil.generatePathToService('/TestSet', {test: 'test'});
		assert.deepEqual(sPath, sExpected, 'generatePathToService, /TestSet(test=\'test\')');
	});

	QUnit.test('generatePathToService, multiple keys passed, should return correct path', function(assert) {
		const sExpected = '/TestSet(test=\'test\',test2=\'test2\')';
		const sPath = oDataUtil.generatePathToService('/TestSet', {
			test: 'test',
			test2: 'test2'
		});
		assert.deepEqual(sPath, sExpected, 'generatePathToService, /TestSet(test=\'test\',test2=\'test2\')');
	});

	QUnit.test('generatePathToService, keys with special characters, should return correct path with encoded characters', function(assert) {
		const sExpected = '/TestSet(test=\'test%20test\')';
		const sPath = oDataUtil.generatePathToService('/TestSet', {test: 'test test'});
		assert.deepEqual(sPath, sExpected, 'generatePathToService, /TestSet(test=\'test%20test\')');
	});

	QUnit.test('handleResultsObjects, basic object, should return as is', function(assert) {
		const oResponse = {
			Test: 'Test data'
		};
		const oExpected = {
			Test: 'Test data'
		};
		const oResult = oDataUtil.handleResultsObjects(oResponse);
		assert.deepEqual(oResult, oExpected, 'handleResultsObjects, basic object');
	});

	QUnit.test('handleResultsObjects, get entity set results, should return the array', function(assert) {
		const oResponse = {
			results: [
				{
					Test: 'Test data'
				}
			]
		};
		const oExpected = [{
			Test: 'Test data'
		}];
		const oResult = oDataUtil.handleResultsObjects(oResponse);
		assert.deepEqual(oResult, oExpected, 'handleResultsObjects, results array');
	});

	QUnit.test('handleResultsObjects, deep structure, should return data without "results"', function(assert) {
		const oResponse = {
			results: [{
				Test: 'Test data',
				Deep: {
					results: [{
						Test: 'Test data'
					}]
				}
			}, {
				Test: 'Test data',
				Deep: {
					results: [{
						Test: 'Test data'
					}]
				}
			}]
		};
		const oExpected = [{
			Test: 'Test data',
			Deep: [{
				Test: 'Test data'
			}]
		}, {
			Test: 'Test data',
			Deep: [{
				Test: 'Test data'
			}]
		}];
		const oResult = oDataUtil.handleResultsObjects(oResponse);
		assert.deepEqual(oResult, oExpected, 'handleResultsObjects, deep structure');
	});

	QUnit.test('parseSapMessages, no messages, should return empty array', function(assert) {
		const aExpected = [];
		const aResult = oDataUtil.parseSapMessages();
		assert.deepEqual(aResult, aExpected, 'parseSapMessages, empty array');
	});

	QUnit.test('parseSapMessages, one message returned', function(assert) {
		const aExpected = [{
			severity: 'Error',
			message: 'Test message',
			code: 'Test code',
			target: 'Test target'
		}];
		const aResult = oDataUtil.parseSapMessages({
			headers: {
				'sap-message': JSON.stringify({
					severity: 'error',
					message: 'Test message',
					code: 'Test code',
					target: 'Test target'
				})
			}
		});
		assert.deepEqual(aResult, aExpected, 'parseSapMessages, one message');
	});

	QUnit.test('parseSapMessages, multiple messages (details) returned', function(assert) {
		const aExpected = [{
			severity: 'Error',
			message: 'Test message',
			code: 'Test code',
			target: 'Test target'
		}, {
			severity: 'Warning',
			message: 'Second message',
			code: 'Test code',
			target: 'Test target'
		}, {
			severity: 'Warning',
			message: 'Test message',
			code: 'CODE',
			target: 'Test target'
		}];
		const aResult = oDataUtil.parseSapMessages({
			headers: {
				'sap-message': JSON.stringify({
					severity: 'error',
					message: 'Test message',
					code: 'Test code',
					target: 'Test target',
					details: [{
						severity: 'warning',
						message: 'Second message',
						code: 'Test code',
						target: 'Test target'
					}, {
						severity: 'warning',
						message: 'Test message',
						code: 'CODE',
						target: 'Test target'
					}]
				})
			}
		});
		assert.deepEqual(aResult, aExpected, 'parseSapMessages, multiple messages (details) returned');
	});
});
