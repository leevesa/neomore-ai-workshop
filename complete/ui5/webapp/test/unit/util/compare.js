QUnit.config.autostart = false;

sap.ui.define([
	'fi/neomore/template/util/compare',
	'sap/m/Button',
	'sap/m/Text'
], function(compare, Button, Text) {
	QUnit.module('compare util tests');

	QUnit.test('util/compare, deepCompare, NaN', function(assert) {
		assert.ok(compare.deepCompare(NaN, NaN));
	});

	QUnit.test('util/compare, deepCompare, instanceof function', function(assert) {
		assert.ok(compare.deepCompare(() => {}, () => {}));
	});

	QUnit.test('util/compare, deepCompare, instanceof Date', function(assert) {
		assert.ok(compare.deepCompare(Date.UTC(0), Date.UTC(0)));
	});

	QUnit.test('util/compare, deepCompare, instanceof RegExp', function(assert) {
		assert.ok(compare.deepCompare(RegExp(), RegExp()));
	});

	QUnit.test('util/compare, deepCompare, instanceof String', function(assert) {
		assert.ok(compare.deepCompare(String('test'), String('test')));
	});

	QUnit.test('util/compare, deepCompare, instanceof Number', function(assert) {
		assert.ok(compare.deepCompare(Number(1), Number(1)));
	});

	QUnit.test('util/compare, deepCompare, faulty object vs string', function(assert) {
		let a = {};
		assert.notOk(compare.deepCompare(a, 'string'));
	});

	QUnit.test('util/compare, deepCompare, faulty same prototype', function(assert) {
		function Foo() {}
		function Bar() {}

		Bar.prototype = Object.create(Foo.prototype);

		assert.notOk(compare.deepCompare(Foo.prototype, Bar.prototype));
	});

	QUnit.test('util/compare, deepCompare, faulty same func different prototype', function(assert) {
		function Bar() {}
		function Foo() {}

		const bar1 = new Bar();
		const bar2 = new Bar();

		bar2.prototype = Object.create(Foo.prototype);

		assert.notOk(compare.deepCompare(bar1, bar2));
	});

	QUnit.test('util/compare, deepCompare, faulty different constructor', function(assert) {
		let oButton = new Button();
		let oText = new Text();

		assert.notOk(compare.deepCompare(oText, oButton));
	});

	QUnit.test('util/compare, deepCompare, faulty same key in obj but different datatype, case 1', function(assert) {
		let a = { key: 'string' };
		let b = { key: 1 };

		assert.notOk(compare.deepCompare(a, b));
	});

	// This case never happens?? since above case is never ok (lines 73, 75)
	// QUnit.test("util/compare, deepCompare, faulty same key in obj but different datatype, case 2", function (assert) {
	//     let a = { key: "string" };
	//     let b = { key: 1 };

	//     assert.notOk(compare.deepCompare(b, a))
	// });

	QUnit.test('util/compare, deepCompare, truthy compare nothing (die silently)', function(assert) {
		assert.ok(compare.deepCompare());
	});

	QUnit.test('util/compare, deepCompare, truthy same prototype objects', function(assert) {
		let a = {};
		assert.ok(compare.deepCompare(a, a));
	});

	QUnit.test('util/compare, deepCompare, truthy empty objects', function(assert) {
		assert.ok(compare.deepCompare({}, {}));
	});
	QUnit.test('util/compare, deepCompare, falsy empty objects', function(assert) {
		assert.notOk(compare.deepCompare({}, { a: '' }));
	});


	QUnit.test('util/compare, deepCompare, truthy object with single key', function(assert) {
		assert.ok(compare.deepCompare({ string: 'string'}, { string: 'string'}));
	});
	QUnit.test('util/compare, deepCompare, falsy object with single key', function(assert) {
		assert.notOk(compare.deepCompare({ string: 'NOT SAME'}, { string: 'string'}));
	});


	QUnit.test('util/compare, deepCompare, truthy object with deep nesting', function(assert) {
		assert.ok(compare.deepCompare({ object: { string: 'string'} }, { object: { string: 'string'} }));
	});
	QUnit.test('util/compare, deepCompare, falsy object with deep nesting', function(assert) {
		assert.notOk(compare.deepCompare({ object: { string: 'NOT SAME'} }, { object: { string: 'string'} }));
	});
});