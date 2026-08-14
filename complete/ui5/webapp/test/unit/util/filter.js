sap.ui.define([
	'fi/neomore/template/util/filter',
	'sap/ui/model/Filter'
], function(filterUtil, Filter) {
	'use strict';

	QUnit.module('Filter util tests', {
		beforeEach: function() {
		}
	});

	QUnit.test('generateFilter, empty array passed should return empty array', function(assert) {
		const aExpected = [];
		const aFilter = filterUtil.generateFilter('Plant', []);
		assert.deepEqual(aFilter, aExpected, 'generateFilter, empty array');
	});

	QUnit.test('generateFilter, array with two values should return array of two filters', function(assert) {
		const aExpected = [
			new Filter('Plant', 'EQ', 'Plant 1'),
			new Filter('Plant', 'EQ', 'Plant 2')
		];
		const aFilter = filterUtil.generateFilter('Plant', ['Plant 1', 'Plant 2']);
		assert.deepEqual(aFilter, aExpected, 'generateFilter, array with two values');
	});

	QUnit.test("generateFilter, array with 'Contains' filters", function(assert) {
		const aExpected = [
			new Filter('Plant', 'Contains', 'Plant 1')
		];
		const aFilter = filterUtil.generateFilter('Plant', ['Plant 1'], 'Contains');
		assert.deepEqual(aFilter, aExpected, "generateFilter, array with 'Contains' filters");
	});

	QUnit.test("generateFilter, array with 'NE' filters", function(assert) {
		const aExpected = [
			new Filter('Plant', 'NE', 'Plant 1')
		];
		const aFilter = filterUtil.generateFilter('Plant', ['Plant 1'], 'NE');
		assert.deepEqual(aFilter, aExpected, "generateFilter, array with 'NE' filters");
	});

	QUnit.test("generateFilter, array with 'StartsWith' filters", function(assert) {
		const aExpected = [
			new Filter('Plant', 'StartsWith', 'Plant 1')
		];
		const aFilter = filterUtil.generateFilter('Plant', ['Plant 1'], 'StartsWith');
		assert.deepEqual(aFilter, aExpected, "generateFilter, array with 'StartsWith' filters");
	});

	QUnit.test("generateFilter, array with 'LT' filters", function(assert) {
		const aExpected = [
			new Filter('Plant', 'LT', 'Plant 1')
		];
		const aFilter = filterUtil.generateFilter('Plant', ['Plant 1'], 'LT');
		assert.deepEqual(aFilter, aExpected, "generateFilter, array with 'LT' filters");
	});

	QUnit.test("generateFilter, array with 'GT' filters", function(assert) {
		const aExpected = [
			new Filter('Plant', 'GT', 'Plant 1')
		];
		const aFilter = filterUtil.generateFilter('Plant', ['Plant 1'], 'GT');
		assert.deepEqual(aFilter, aExpected, "generateFilter, array with 'GT' filters");
	});

	QUnit.test('generateRangeFilter, should return empty array', function(assert) {
		const aExpected = [];
		const aFilter = filterUtil.generateRangeFilter('Plant');
		assert.deepEqual(aFilter, aExpected, 'generateRangeFilter, empty array');
	});

	QUnit.test('generateRangeFilter, should return a filter when both lowValue and highValue are defined', function(assert) {
		const aExpected = [new Filter('Plant', 'BT', 10, 20)];
		const result = filterUtil.generateRangeFilter('Plant', 10, 20);
		assert.ok(result.length === 1, 'Result array should have one filter');
		assert.deepEqual(result, aExpected, 'generateRangeFilter, array with one filter');
	});

	QUnit.test('generateRangeFilter, should return an empty array when lowValue is undefined', function(assert) {
		// eslint-disable-next-line no-undefined
		const result = filterUtil.generateRangeFilter('Plant', undefined, 20);
		assert.ok(result.length === 0, 'Result array should be empty');
	});

	QUnit.test('generateRangeFilter, should return an empty array when highValue is undefined', function(assert) {
		const result = filterUtil.generateRangeFilter('Plant', 10);
		assert.ok(result.length === 0, 'Result array should be empty');
	});

	QUnit.test('generateRangeFilter, should return correct values with range from negative to zero range', function(assert) {
		const aExpected = [new Filter('Plant', 'BT', -100, 0)];
		const result = filterUtil.generateRangeFilter('Plant', -100, 0);
		assert.deepEqual(result, aExpected, 'generateRangeFilter, array with one filter');
	});

	QUnit.test('generateRangeFilter, should work with null values', function(assert) {
		const aExpected = [];
		const result = filterUtil.generateRangeFilter('Plant', null, null);
		assert.deepEqual(result, aExpected, 'generateRangeFilter, return empty array');
	});

	QUnit.test('generateSimpleFilters, should return empty array', function(assert) {
		const aExpected = [];
		const aFilter = filterUtil.generateSimpleFilters({});
		assert.deepEqual(aFilter, aExpected, 'generateSimpleFilters, empty array');
	});

	QUnit.test('generateSimpleFilters, should return array of two filters', function(assert) {
		const aExpected = [
			new Filter('Plant', 'EQ', 'Plant 1'),
			new Filter('Plant', 'EQ', 'Plant 2')
		];
		const aFilter = filterUtil.generateSimpleFilters({
			Plant: ['Plant 1', 'Plant 2']
		});
		assert.deepEqual(aFilter, aExpected, 'generateSimpleFilters, array with two values');
	});

	QUnit.test('generateSimpleFilters, should return array of five filters', function(assert) {
		const aExpected = [
			new Filter('Plant', 'EQ', 'Plant 1'),
			new Filter('Plant', 'EQ', 'Plant 2'),
			new Filter('Material', 'EQ', 'Material 1'),
			new Filter('Material', 'EQ', 'Material 2'),
			new Filter('MaterialGroup', 'EQ', 'MaterialGroup 1')
		];
		const aFilter = filterUtil.generateSimpleFilters({
			Plant: ['Plant 1', 'Plant 2'],
			Material: ['Material 1', 'Material 2'],
			MaterialGroup: ['MaterialGroup 1']
		});
		assert.deepEqual(aFilter, aExpected, 'generateSimpleFilters, array with five values');
	});

	QUnit.test('generateComplexFilters, should return null', function(assert) {
		const aExpected = null;
		const aFilter = filterUtil.generateComplexFilters({});
		assert.deepEqual(aFilter, aExpected, 'generateComplexFilters, empty array');
	});

	QUnit.test('generateComplexFilters, should return filter of two filters', function(assert) {
		const aExpected = new Filter({
			filters: [
				new Filter('Plant', 'EQ', 'Plant 1'),
				new Filter('Plant', 'EQ', 'Plant 2')
			],
			and: true
		});
		const aFilter = filterUtil.generateComplexFilters({
			Plant: ['Plant 1', 'Plant 2']
		});
		assert.deepEqual(aFilter, aExpected, 'generateComplexFilters, array with two values');
	});

	QUnit.test('generateComplexFilters, should return array of or filters', function(assert) {
		const aExpected = new Filter({
			filters: [
				new Filter({
					filters: [
						new Filter('Plant', 'EQ', 'Plant 1'),
						new Filter('Material', 'EQ', 'Material 1')
					],
					and: false
				})
			],
			and: false
		});
		const aFilter = filterUtil.generateComplexFilters({
			type: 'or',
			filters: [
				{
					Plant: ['Plant 1'],
					Material: ['Material 1']
				}
			]
		});
		assert.deepEqual(aFilter, aExpected, 'generateComplexFilters, array with and values');
	});

	QUnit.test('generateComplexFilters, should return array of and filters', function(assert) {
		const aExpected = new Filter({
			filters: [
				new Filter({
					filters: [
						new Filter('Plant', 'EQ', 'Plant 1'),
						new Filter('Material', 'EQ', 'Material 1')
					],
					and: true
				})
			],
			and: true
		});
		const aFilter = filterUtil.generateComplexFilters({
			type: 'and',
			filters: [
				{
					Plant: ['Plant 1'],
					Material: ['Material 1']
				}
			]
		});
		assert.deepEqual(aFilter, aExpected, 'generateComplexFilters, array with and values');
	});

	QUnit.test('generateComplexFilters, should return array of and/or filters', function(assert) {
		const aExpected = new Filter({
			filters: [
				new Filter({
					filters: [
						new Filter({
							filters: [
								new Filter('Plant', 'EQ', 'Plant 1'),
								new Filter('Material', 'EQ', 'Material 1')
							],
							and: true
						})
					],
					and: true
				}),
				new Filter({
					filters: [
						new Filter({
							filters: [
								new Filter('Plant', 'EQ', 'Plant 2'),
								new Filter('Material', 'EQ', 'Material 2')
							],
							and: true
						})
					],
					and: true
				})
			],
			and: false
		});
		const aFilter = filterUtil.generateComplexFilters({
			type: 'or',
			filters: [
				{
					type: 'and',
					filters: [
						{
							Plant: ['Plant 1'],
							Material: ['Material 1']
						}
					]
				}, {
					type: 'and',
					filters: [
						{
							Plant: ['Plant 2'],
							Material: ['Material 2']
						}
					]
				}
			]
		});
		assert.deepEqual(aFilter, aExpected, 'generateComplexFilters, array with and/or values');
	});
});
