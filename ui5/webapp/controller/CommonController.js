/**
 * CommonController
 * @module fi.neomore.template.controller.CommonController
 */
sap.ui.define([
	'fi/neomore/template/controller/BaseController'
], function(BaseController) {
	return BaseController.extend('fi.neomore.template.controller.CommonController', {

		getDeviceModel: function() {
			return this.getModel('Device');
		},

		isPhone: function() {
			return this.getDeviceModel().getProperty('/isPhone');
		}

	});
});