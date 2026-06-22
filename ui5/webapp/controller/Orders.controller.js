/**
 * Orders view's controller
 * @module fi.neomore.template.controller.Orders
 */
sap.ui.define([
	'fi/neomore/template/controller/CommonController',
	'fi/neomore/template/controller/BaseController',
	'fi/neomore/template/model/Orders'
], function(CommonController, BaseController, OrdersModel) {
	return CommonController.extend('fi.neomore.template.controller.Orders', {

		/* =========================================================== */
		/* View & Life Cycle		                                   */
		/* =========================================================== */

		onInit: function() {
			BaseController.prototype.onInit.apply(this, arguments);
			this.setModel('Orders', new OrdersModel());
			this.setModel('SearchParameters', {
				OrderId: '',
				Description: ''
			});
		},

		routeMatched: function(navigationEvent) {
			if (navigationEvent.getParameter('name') === 'Orders') {
				BaseController.prototype.routeMatched.apply(this, arguments);
				this.getModel('Orders').loadWorkOrders();
			}
		},

		/* =========================================================== */
		/* Event handlers		                                	   */
		/* =========================================================== */

		onOrderPress: function(oEvent) {
			const sOrderId = oEvent.getSource().getBindingContext('Orders').getObject().OrderId;
			this.navTo('OrderDetails', {
				orderId: sOrderId
			});
		},

		onCreateOrderPress: function() {
			this.navTo('OrderCreate');
		},

		onFilterBarSearch: function() {
			const oParams = this.getModel('SearchParameters').getData();
			let aFilters = [];
			if (oParams.OrderId) {
				aFilters = aFilters.concat(this.generateFilter('OrderId', [oParams.OrderId]));
			}
			if (oParams.Description) {
				aFilters = aFilters.concat(this.generateFilter('Description', [oParams.Description], 'Contains'));
			}
			this.getModel('Orders').loadWorkOrders(aFilters)
				.catch(this.openErrorMessagePopup.bind(this));
			// this.getModel('Orders').loadWorkOrders(this.getModel('SearchParameters').getFilters())
			// 	.catch(this.openErrorMessagePopup.bind(this));
		},

		onDeleteOrderPress: function(oEvent) {
			const sPath = oEvent.getSource().getBindingContext('Orders').getPath();
			this.getModel('Orders').deleteOrder(sPath)
				.then(this.onFilterBarSearch.bind(this))
				.catch(this.openErrorMessagePopup.bind(this));
		}

		/* =========================================================== */
		/* Internal methods				                          	   */
		/* =========================================================== */

	});
});