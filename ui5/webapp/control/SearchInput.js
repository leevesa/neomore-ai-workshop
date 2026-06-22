sap.ui.define([
	'sap/m/Input'
], function(Input) {
	'use strict';
	return Input.extend('fi.neomore.template.control.SearchInput', {
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
			}
		},
		init: function() {
			if (Input.prototype.init) {
				Input.prototype.init.apply(this, arguments);
			}
		},
		onAfterRendering: function() {
			if (Input.prototype.onAfterRendering) {
				Input.prototype.onAfterRendering.apply(this, arguments);
			}
		},

		onfocusin: function(oEvent) {
			var that = this;
			if (oEvent && this.getSelectOnFocus()) {
				window.setTimeout(function() {
					var $input = that.$().find('input')[0];
					// Check that input was found and it's currently active
					if ($input && $input === document.activeElement) {
						$input.select();
					}
				}, 0);
			}
		},

		renderer: {},

		_getValueHelpIcon: function() {
			if (Input.prototype._getValueHelpIcon) {
				var valueHelpIcon = Input.prototype._getValueHelpIcon.apply(this, arguments);
				valueHelpIcon.setProperty('src', 'sap-icon://search');
				return valueHelpIcon;
			}
			return null;
		}

	});
});