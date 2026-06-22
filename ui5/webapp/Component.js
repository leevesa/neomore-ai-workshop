sap.ui.define([
	'sap/ui/core/UIComponent'
],
function(UIComponent) {
	'use strict';

	return UIComponent.extend('fi.neomore.template.Component', {
		metadata: {
			manifest: 'json'
		},

		/**
		 * Called once by UI5 during startup. The root view (the chat page) is
		 * created automatically from the manifest, so there is nothing else to wire up.
		 * @public
		 * @override
		 */
		init: function() {
			UIComponent.prototype.init.apply(this, arguments);
		}
	});
});