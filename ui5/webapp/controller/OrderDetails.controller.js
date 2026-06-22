/**
 * OrderDetails view's controller
 * @module fi.neomore.template.controller.OrderDetails
 */
sap.ui.define([
	'fi/neomore/template/controller/CommonController',
	'fi/neomore/template/controller/BaseController',
	'fi/neomore/template/model/Orders'
], function(CommonController, BaseController, OrdersModel) {
	return CommonController.extend('fi.neomore.template.controller.OrderDetails', {

		/* =========================================================== */
		/* View & Life Cycle		                                   */
		/* =========================================================== */

		onInit: function() {
			BaseController.prototype.onInit.apply(this, arguments);
			this.setModel('OrderDetails', new OrdersModel());
		},

		routeMatched: function(navigationEvent) {
			if (navigationEvent.getParameter('name') === 'OrderDetails') {
				BaseController.prototype.routeMatched.apply(this, arguments);
				this.getModel('OrderDetails').loadWorkOrderDetails(this.getUrlParameter('orderId'));
			}
			if (navigationEvent.getParameter('name') === 'OrderCreate') {
				BaseController.prototype.routeMatched.apply(this, arguments);
				this.getModel('OrderDetails').initCreateOrder();
			}
		},

		/* =========================================================== */
		/* Event handlers		                                	   */
		/* =========================================================== */

		onPlantValueHelpRequest: function() {
			this.openDialog('SearchDialog', {
				configurationModelName: 'Helpers',
				pathToModel: '/Plants',
				listItemValueKey: 'PlantId',
				listItemDescriptionKey: 'PlantDescription',
				saveModelName: 'OrderDetails',
				firstValueToSave: 'Details/Plant',
				secondValueToSave: 'Details/PlantDescr',
				service: 'ZCAP_BACKEND_SRV',
				pathToService: '/Plants'
			});
		},

		onWorkcenterValueHelpRequest: function() {
			this.openDialog('SearchDialog', {
				configurationModelName: 'Helpers',
				pathToModel: '/WorkCenters',
				listItemValueKey: 'WorkCenterId',
				listItemDescriptionKey: 'WorkCenterDescription',
				saveModelName: 'OrderDetails',
				firstValueToSave: 'Details/Workcenter',
				secondValueToSave: 'Details/WorkcenterDescr'
			});
		},

		onPriorityValueHelpRequest: function() {
			this.openDialog('SearchDialog', {
				configurationModelName: 'Helpers',
				pathToModel: '/Priorities',
				listItemValueKey: 'PriorityId',
				listItemDescriptionKey: 'PriorityDescription',
				saveModelName: 'OrderDetails',
				firstValueToSave: 'Details/Priority',
				secondValueToSave: 'Details/PriorityDescr'
			});
		},

		onFunctLocValueHelpRequest: function() {
			this.openDialog('SearchDialog', {
				configurationModelName: 'Helpers',
				pathToModel: '/FunctionalLocations',
				listItemValueKey: 'FunctionalLocationId',
				listItemDescriptionKey: 'FunctionalLocationDescription',
				saveModelName: 'OrderDetails',
				firstValueToSave: 'Details/FunctLoc',
				secondValueToSave: 'Details/FunctLocDescr'
			});
		},

		onEquipmentValueHelpRequest: function() {
			this.openDialog('SearchDialog', {
				configurationModelName: 'Helpers',
				pathToModel: '/Equipments',
				listItemValueKey: 'EquipmentId',
				listItemDescriptionKey: 'EquipmentDescription',
				saveModelName: 'OrderDetails',
				firstValueToSave: 'Details/Equipment',
				secondValueToSave: 'Details/EquipmentDescr'
			});
		},

		onRespPersonValueHelpRequest: function() {
			this.openDialog('SearchDialog', {
				configurationModelName: 'Helpers',
				pathToModel: '/Persons',
				listItemValueKey: 'PersonId',
				listItemDescriptionKey: 'PersonName',
				saveModelName: 'OrderDetails',
				firstValueToSave: 'Details/RespPerson',
				secondValueToSave: 'Details/RespPersonName'
			});
		},

		onAddOperationPress: function() {
			this.getModel('OrderDetails').addOperation();
		},

		onDeleteOperationPress: function(oEvent) {
			const sPath = oEvent.getSource().getParent().getBindingContext('OrderDetails').getPath();
			this.getModel('OrderDetails').deleteOperation(sPath);
		},

		onEditPress: function() {
			this.getModel('OrderDetails').setEditMode(true);
		},

		onSavePress: function() {
			this.getModel('OrderDetails').saveOrder().then((oData) => {
				if (this.getUrlParameter('orderId')) {
					this.getModel('OrderDetails').loadWorkOrderDetails(this.getUrlParameter('orderId'));
				}
				this.getModel('OrderDetails').setEditMode(false);
				this.navTo('OrderDetails', {
					orderId: oData.OrderId
				}, true);
			}).catch(this.openErrorMessagePopup.bind(this));
		},

		onCancelPress: function() {
			this.getModel('OrderDetails').setEditMode(false);
		}

		/* =========================================================== */
		/* Internal methods				                          	   */
		/* =========================================================== */

	});
});