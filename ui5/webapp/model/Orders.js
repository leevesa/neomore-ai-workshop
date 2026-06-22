sap.ui.define([
	'sap/ui/model/json/JSONModel',
	'fi/neomore/template/util/oData'
], function(JSONModel, oDataUtil) {
	'use strict';

	return JSONModel.extend('fi.neomore.template.model.Orders', {

		constructor: function() {
			JSONModel.call(this, arguments);

			this.setData({
				Items: [],
				Details: {},
				EditMode: false
			});
			this.setSizeLimit(9999999);

			return this;
		},

		loadWorkOrders: function(aFilters = []) {
			return oDataUtil.read('ZCAP_BACKEND_SRV', '/WorkOrders', {
				filters: aFilters
			})
				.then((results) => {
					this.setProperty('/Items', results);
				});
		},

		loadWorkOrderDetails: function(orderId) {
			return oDataUtil.read('ZCAP_BACKEND_SRV', '/WorkOrders', {
				keys: {
					OrderId: orderId
				},
				urlParameters: {
					$expand: 'Operations'
				}
			}).then((result) => {
				this.setProperty('/Details', result);
			});
		},

		saveOrder: function() {
			const oDetails = this.getProperty('/Details');
			if (!oDetails.OrderId) {
				return oDataUtil.create('ZCAP_BACKEND_SRV', '/WorkOrders', oDetails);
			}
			return oDataUtil.update('ZCAP_BACKEND_SRV', '/WorkOrders', oDetails, {
				keys: {
					OrderId: oDetails.OrderId
				}
			});
		},

		deleteOrder: function(sPath) {
			const oOrder = this.getProperty(sPath);
			return oDataUtil.remove('ZCAP_BACKEND_SRV', '/WorkOrders', {
				keys: {
					OrderId: oOrder.OrderId
				}
			});
		},

		initCreateOrder: function() {
			this.setProperty('/Details', {});
			this.setEditMode(true);
		},

		addOperation: function() {
			const aOperations = this.getProperty('/Details/Operations') || [];
			aOperations.push({
				Activity: (aOperations.reduce((max, op) => {
					return Math.max(max, parseInt(op.Activity, 10));
				}, 0) + 10).toString().padStart(4, '0')
			});
			this.setProperty('/Details/Operations', aOperations);
		},

		deleteOperation: function(sPath) {
			const index = parseInt(sPath.split('/').pop(), 10);
			const aOperations = this.getProperty('/Details/Operations');
			aOperations.splice(index, 1);
			this.setProperty('/Details/Operations', aOperations);
		},

		setEditMode: function(bEditMode) {
			this.setProperty('/EditMode', bEditMode);
		}

	});
});