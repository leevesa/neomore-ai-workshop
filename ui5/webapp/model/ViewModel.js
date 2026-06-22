sap.ui.define([
	'sap/ui/model/json/JSONModel',
	'fi/neomore/template/util/oData'
], function(JSONModel, oDataUtil) {
	'use strict';

	return JSONModel.extend('fi.neomore.template.model.ViewModel', {

		constructor: function() {
			JSONModel.call(this, arguments);

			this.setData({
				Test: 'New Data',
				StartDate: new Date(),
				WorkOrders: []
			});

			return this;
		},

		loadWorkOrder: function() {
			oDataUtil.read('ZCAP_BACKEND_SRV', '/WorkOrders')
				.then((oData) => {
					console.log(oData);
					this.setProperty('/WorkOrders', oData);
				})
				.catch(function(oError) {
					console.error(oError);
				});
		},

		updateData: function() {
			this.setProperty('/Test', 'Updated Data');
		}

	});
});