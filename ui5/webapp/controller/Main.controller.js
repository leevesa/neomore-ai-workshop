/**
 * Main view's controller
 * @module fi.neomore.template.controller.Main
 */
sap.ui.define([
	'fi/neomore/template/controller/CommonController',
	'fi/neomore/template/controller/BaseController',
	'fi/neomore/template/model/ViewModel'
], function(CommonController, BaseController, ViewModel) {
	return CommonController.extend('fi.neomore.template.controller.Main', {

		/* =========================================================== */
		/* View & Life Cycle		                                   */
		/* =========================================================== */

		onInit: function() {
			BaseController.prototype.onInit.apply(this, arguments);
			this.setModel('View', new ViewModel());
		},
		routeMatched: function(navigationEvent) {
			if (navigationEvent.getParameter('name') === 'Main') {
				BaseController.prototype.routeMatched.apply(this, arguments);
				this.getModel('View').loadWorkOrder();
			}
		},

		/* =========================================================== */
		/* Event handlers		                                	   */
		/* =========================================================== */

		onButtonPress: function() {
			this.showMessageBox({
				type: 'Info',
				title: this.getResourceBundleText('BUTTON_PRESS_TITLE'),
				message: this.getResourceBundleText('BUTTON_PRESS_MESSAGE', [this.getModel('View').getProperty('/Test')])
			});
		},

		onUpdateDataPress: function() {
			this.getModel('View').updateData();
			console.log('ttesstt');
		}

		/* =========================================================== */
		/* Internal methods				                          	   */
		/* =========================================================== */

	});
});