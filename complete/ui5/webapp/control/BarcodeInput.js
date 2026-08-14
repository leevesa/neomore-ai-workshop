sap.ui.define([
	'sap/m/Input',
	'sap/ndc/BarcodeScanner'
], function(Input, BarcodeScanner) {
	'use strict';

	/**
	 * Custom BarcodeInput control.
	 *
	 * @param {string} [sId] Id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class BarcodeInput
	 * The fi.neomore.template.control.BarcodeInput control provides Barcode reading functionality.
     * It shows a barcode-icon as a valueHelpIcon.
     * Control also provides events for barcode scan success and fail.
	 *
	 * @extends sap.m.Input
	 *
	 * @author Neomore Consulting Oy
	 * @version 2.0
	 *
	 * @constructor
	 * @public
	 * @since 1.38
	 * @alias fi.neomore.template.control.BarcodeInput
	 */
	var ControlBarcodeInput = Input.extend('fi.neomore.template.control.BarcodeInput', {
		metadata: {
			properties: {
				selectOnFocus: {
					type: 'boolean',
					defaultValue: true
				},
				showValueHelp: {
					type: 'boolean',
					defaultValue: true
				}
			},
			aggregations: {
				_valueHelpIcon: {
					type: 'sap.ui.core.Icon',
					multiple: false,
					visibility: 'hidden'
				}
			},
			events: {
				scanSuccess: {
					parameters: {
						value: {
							type: 'String'
						}
					}
				},
				scanError: {
					parameters: {
						value: {
							type: 'String'
						}
					}
				}
			}
		},
		init: function() {
			if (Input.prototype.init) {
				Input.prototype.init.apply(this, arguments);
			}
			this.attachValueHelpRequest(this._onIconPress.bind(this));
		},

		onAfterRendering: function() {
			if (Input.prototype.onAfterRendering) {
				Input.prototype.onAfterRendering.apply(this, arguments);
			}
		},

		onfocusin: function(oEvent) {
			if (oEvent && this.getSelectOnFocus()) {
				window.setTimeout(function() {
					var $input = this.$().find('input')[0];
					// Check that input was found and it's currently active
					// to prevent focus from jumping between inputs
					if ($input && $input === document.activeElement) {
						$input.select();
					}
				}.bind(this), 0);
			}
		},

		renderer: {},

		_getValueHelpIcon: function() {
			var valueHelpIcon = null;
			if (Input.prototype._getValueHelpIcon) {
				valueHelpIcon = Input.prototype._getValueHelpIcon.apply(this, arguments);
				valueHelpIcon.setProperty('src', 'sap-icon://bar-code');
			}
			return valueHelpIcon;
		},

		_onIconPress: function() {
			BarcodeScanner.scan(
				this._scanSuccessCallback.bind(this),
				this._scanErrorCallback.bind(this)
			);
		},

		_scanSuccessCallback: function(result) {
			if (result) {
				var scannedValue = result.text;
				if (scannedValue) {
					this.setValue(scannedValue);
				}
				this.fireEvent('scanSuccess', {
					value: scannedValue
				});
			}
		},

		_scanErrorCallback: function(error) {
			var errorMessage = 'Error';
			if (error) {
				errorMessage = error;
			}
			this.fireEvent('scanError', {
				value: errorMessage
			});
		}

	});

	return ControlBarcodeInput;
});