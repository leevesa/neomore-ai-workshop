/**
 * i18n utility
 * @module fi.neomore.template.util.i18n
 */
sap.ui.define([
	'sap/base/i18n/ResourceBundle'
], function(ResourceBundle) {
	'use strict';

	const oBundle = ResourceBundle.create({
		url: sap.ui.require.toUrl('fi/neomore/template/i18n/i18n.properties'),
		async: false
	});

	return {
		/**
         * Get text from i18n
         * @param {string} sKey - text property from i18n
		 * @param {array|string} [aPlaceHolders] - placeholders to add to i18n text
         * @returns {string} - Translated text
         */
		getText: function(sKey, aPlaceHolders) {
			return oBundle.getText(sKey, aPlaceHolders);
		}
	};
});