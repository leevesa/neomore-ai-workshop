QUnit.config.autostart = false;

sap.ui.define([
	'fi/neomore/template/util/customTypes'
], function(customTypes) {
	QUnit.module('customTypes tests', {
		beforeEach: function() {
			this.oCT = customTypes;
		}
	});

	QUnit.test('util/customType, EDMTime, basic', function(assert) {
		let oEDMTime = new this.oCT.EDMTime({});
		const formattedEDMTime = oEDMTime.formatValue({
			__edmType: 'Edm.Time',
			// "23:59:58"
			ms: 86398000
		}, 'string');

		assert.equal('23:59', formattedEDMTime);
	});

	QUnit.test('util/customType, UTCDate, UTC to UTC', function(assert) {
		const oDate = new Date(Date.UTC(2018, 11, 11));

		assert.equal('11.12.2018', new this.oCT.UTCDate().formatValue(oDate, 'string'));
	});

	QUnit.test('util/customType, RequiredUTCDate, null input', function(assert) {
		const oRUTCD = new this.oCT.RequiredUTCDate();
		try {
			oRUTCD.validateValue(null);
		} catch (e) {
			assert.equal(e.name, 'ValidateException');
			assert.equal(e.message, 'Please enter date');
			// eslint-disable-next-line no-undefined
			assert.equal(e.violatedConstraints, undefined);
		}

		const oDate = new Date(Date.UTC(2018, 11, 11));

		// eslint-disable-next-line no-undefined
		assert.equal(oRUTCD.validateValue(oDate), undefined);
	});

	QUnit.test('util/customType, RequiredString, null input', function(assert) {
		try {
			new this.oCT.RequiredString().validateValue(null);
		} catch (e) {
			assert.equal(e.name, 'ValidateException');
			assert.equal(e.message, 'Enter a value with at least 1 characters');
			assert.deepEqual(e.violatedConstraints, ['minLength']);
		}
	});

	QUnit.test('util/customType, Price, basic 1', function(assert) {
		let oPrice = new this.oCT.Price();
		assert.equal(oPrice.formatValue('1', 'string'), '1,00');
	});

	QUnit.test('util/customType, Price, basic 2', function(assert) {
		let oPrice = new this.oCT.Price();
		assert.equal(oPrice.formatValue('10.22', 'string'), '10,22');
	});

	QUnit.test('util/customType, Price, basic 3', function(assert) {
		let oPrice = new this.oCT.Price();
		assert.equal(oPrice.formatValue('100', 'string'), '100,00');
	});

	QUnit.test('util/customType, Price, basic 4', function(assert) {
		let oPrice = new this.oCT.Price();
		assert.equal(oPrice.formatValue('1000.66', 'string'), '1 000,66');
	});

	QUnit.test('util/customType, Price, basic 5', function(assert) {
		let oPrice = new this.oCT.Price();
		assert.equal(oPrice.formatValue('10000', 'string'), '10 000,00');
	});

	QUnit.test('util/customType, Price, basic 6', function(assert) {
		let oPrice = new this.oCT.Price();
		assert.equal(oPrice.formatValue('1000000.99', 'string'), '1 000 000,99');
	});

	QUnit.test('util/customType, Price, String as input', function(assert) {
		let oPrice = new this.oCT.Price();
		assert.equal(oPrice.formatValue('Not Number', 'string'), '');
	});

	QUnit.test('util/customType, Price, String + number mix as input', function(assert) {
		let oPrice = new this.oCT.Price();
		assert.equal(oPrice.formatValue('Not Number 123', 'string'), '');
	});

	QUnit.test('util/customType, Price, NaN as input', function(assert) {
		let oPrice = new this.oCT.Price();
		assert.equal(oPrice.formatValue('NaN', 'string'), '');
	});

	QUnit.test('util/customType, RequiredPriceWithComma, parse valid value 1', function(assert) {
		const oRPWC = new this.oCT.RequiredPriceWithComma();
		assert.equal(oRPWC.parseValue('1 000,00', 'string'), '1000');
	});

	QUnit.test('util/customType, RequiredPriceWithComma, parse valid value 2', function(assert) {
		const oRPWC = new this.oCT.RequiredPriceWithComma();
		assert.equal(oRPWC.parseValue('1 000,22', 'string'), '1000.22');
	});

	QUnit.test('util/customType, RequiredPriceWithComma, validate valid value', function(assert) {
		const oRPWC = new this.oCT.RequiredPriceWithComma();

		// eslint-disable-next-line no-undefined
		assert.equal(oRPWC.validateValue('7'), undefined);
	});

	QUnit.test('util/customType, RequiredPriceWithComma, parse invalid value', function(assert) {
		const oRPWC = new this.oCT.RequiredPriceWithComma();
		try {
			oRPWC.parseValue('NaN', 'string');
		} catch (e) {
			assert.equal(e.name, 'ParseException');
			assert.equal(e.message, 'Enter a valid number');
			// eslint-disable-next-line no-undefined
			assert.deepEqual(e.violatedConstraints, undefined);
		}
	});

	QUnit.test('util/customType, Percentage, validation in range (0-100)', function(assert) {
		let oPercentage = new this.oCT.Percentage();
		const sValidPercentage = oPercentage.formatValue('10', 'string');
		assert.equal(sValidPercentage, '10');
	});

	QUnit.test('util/customType, Percentage, validation over the range (0-100)', function(assert) {
		let oPercentage = new this.oCT.Percentage();
		try {
			oPercentage.validateValue('101', 'string');
		} catch (e) {
			assert.equal(e.name, 'ValidateException');
			assert.equal(e.message, 'Enter a number less than or equal to 100');
			assert.deepEqual(e.violatedConstraints, ['maximum']);
		}
	});

	QUnit.test('util/customType, Percentage, validation under the range (0-100)', function(assert) {
		let oPercentage = new this.oCT.Percentage();
		try {
			oPercentage.validateValue('-1', 'string');
		} catch (e) {
			assert.equal(e.name, 'ValidateException');
			assert.equal(e.message, 'Enter a number greater than or equal to 0');
			assert.deepEqual(e.violatedConstraints, ['minimum']);
		}
	});


	QUnit.test('util/customType, FlagToBoolean, format value 1', function(assert) {
		let oFTB = new this.oCT.FlagToBoolean();

		assert.equal(oFTB.formatValue(''), false);
	});

	QUnit.test('util/customType, FlagToBoolean, format value 2', function(assert) {
		let oFTB = new this.oCT.FlagToBoolean();

		assert.equal(oFTB.formatValue('X'), true);
	});

	QUnit.test('util/customType, FlagToBoolean, parse value 1', function(assert) {
		let oFTB = new this.oCT.FlagToBoolean();

		assert.equal(oFTB.parseValue(true), 'X');
	});

	QUnit.test('util/customType, FlagToBoolean, parse value 2', function(assert) {
		let oFTB = new this.oCT.FlagToBoolean();

		assert.equal(oFTB.parseValue(false), '');
	});

	QUnit.test('util/customType, FlagToBoolean, validate value', function(assert) {
		let oFTB = new this.oCT.FlagToBoolean();

		assert.ok(oFTB.validateValue(), true);
	});
});
