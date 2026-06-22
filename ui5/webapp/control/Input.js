sap.ui.define([
	'sap/m/Input'
], function(Input) {
	'use strict';

	/**
	 * Custom Input control.
	 *
	 * @param {string} [sId] Id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class Input
	 * The fi.neomore.template.control.Input control provides extra property to select the text of input on focus
	 *
	 * @extends sap.m.Input
	 *
	 * @author Neomore Consulting Oy
	 * @version 1.0
	 *
	 * @constructor
	 * @public
	 * @since 1.38
	 * @alias fi.neomore.template.control.Input
	 */
	var ControlInput = Input.extend('fi.neomore.template.control.Input', {
		metadata: {
			/**
             * Extended metadata properties for fi.neomore.template.control.Input.
             * @name fi.neomore.template.control.Input#properties
             * @property {boolean} [selectOnFocus = true] - {@link fi.neomore.template.control.Input#selectOnFocus Select on focus}
             */
			properties: {
				/**
                 * Defines if control should select text of input.
                 * <br />Default value is true
                 * @name fi.neomore.template.control.Input#selectOnFocus
                 */
				selectOnFocus: {
					type: 'boolean',
					defaultValue: true
				}
			}
		},
		init: function() {

		},
		onAfterRendering: function() {
			if (Input.prototype.onAfterRendering) {
				Input.prototype.onAfterRendering.apply(this, arguments);
			}
		},

		focus: function() {
			if (Input.prototype.focus) {
				Input.prototype.focus.apply(this, arguments);
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

		renderer: {}

	});

	return ControlInput;
});