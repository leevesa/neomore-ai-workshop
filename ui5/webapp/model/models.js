/**
 * Models helper
 * @module fi.neomore.template.model.models
 */
sap.ui.define([
	'sap/ui/model/json/JSONModel',
	'sap/ui/Device'
], function(JSONModel, Device) {
	'use strict';

	return {
		/**
		 * Helper function to create device model
		 * @returns {sap.ui.model.json.JSONModel} Device model
		 */
		createDeviceModel: function() {
			var oDeviceModel = new JSONModel({
				...Device,
				isTouch: Device.support.touch,
				isNoTouch: !Device.support.touch,
				isPhone: Device.system.phone,
				isNoPhone: !Device.system.phone
			});
			oDeviceModel.setDefaultBindingMode('OneWay');
			return oDeviceModel;
		}

	};
});