sap.ui.define([
	'sap/ui/model/ValidateException',
	'sap/ui/model/SimpleType',
	'sap/ui/model/type/DateTime',
	'sap/ui/model/type/Float',
	'sap/ui/model/type/String',
	'sap/ui/model/odata/type/Time'
], function(ValidateException, SimpleType, DateTime, Float, StringType, TimeType) {
	'use strict';

	return {
		EDMTime: TimeType.extend('EDMTime', {
			constructor: function() {
				arguments[0] = {
					UTC: true,
					pattern: 'HH:mm'
				};
				TimeType.apply(this, arguments);
			}
		}),

		UTCDate: DateTime.extend('UTCDate', {
			constructor: function() {
				DateTime.apply(this, arguments);
				this.setFormatOptions({
					UTC: true,
					pattern: 'dd.MM.yyyy'
				});
			}
		}),

		RequiredUTCDate: this.UTCDate.extend('RequiredUTCDate', {
			validateValue: function(oValue) {
				if (oValue === null) {
					throw new ValidateException('Please enter date');
				}
			}
		}),

		RequiredString: StringType.extend('RequiredString', {
			constructor: function() {
				StringType.apply(this, arguments);
				this.setConstraints({
					minLength: 1
				});
			}
		}),

		Price: Float.extend('Price', {
			constructor: function() {
				Float.apply(this, arguments);
				this.setFormatOptions({
					groupingEnabled: true,
					groupingSeparator: ' ',
					maxFractionDigits: 2,
					minFractionDigits: 2,
					decimalSeparator: ','
				});
			}
		}),

		RequiredPriceWithComma: this.Price.extend('PriceWithComma', {
			parseValue: function(oValue, sInternalType) {
				return new this.Price().parseValue(oValue, sInternalType).toString();
			}.bind(this),
			validateValue: function(oValue) {
				new this.Price().validateValue(Number(oValue));
			}.bind(this)
		}),

		Percentage: Float.extend('Percentage', {
			constructor: function() {
				Float.apply(this, arguments);
				this.setFormatOptions({
					groupingEnabled: true,
					groupingSeparator: ' ',
					maxFractionDigits: 1,
					minFractionDigits: 0,
					decimalSeparator: ','
				});
				this.setConstraints({
					maximum: 100,
					minimum: 0
				});
			}
		}),

		FlagToBoolean: SimpleType.extend('FlagToBoolean', {

			formatValue: function(oValue) {
				return Boolean(oValue);
			},

			parseValue: function(oValue) {
				return oValue ? 'X' : '';
			},

			validateValue: function() {
				return true;
			}
		})
	};
});