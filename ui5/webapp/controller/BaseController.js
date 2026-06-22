/**
 * BaseController
 * @module fi.neomore.template.controller.BaseController
 */
sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/core/UIComponent',
	'sap/ui/core/Component',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Binding',
	'sap/ui/core/Fragment',
	'sap/m/BusyDialog',
	'sap/ui/core/BusyIndicator',

	// Utils
	'fi/neomore/template/util/formatter',
	'fi/neomore/template/util/customTypes',
	'fi/neomore/template/util/messagebox',
	'fi/neomore/template/util/oData',
	'fi/neomore/template/util/validation',
	'fi/neomore/template/util/filter',

	// Models
	'fi/neomore/template/model/models',
	'fi/neomore/template/model/localStorageModel'
], function(
	Controller,
	UIComponent,
	Component,
	JSONModel,
	Binding,
	Fragment,
	BusyDialog,
	BusyIndicator,

	// Utils
	formatterUtil,
	customTypesUtil,
	messageBoxUtil,
	oDataUtil,
	validationUtil,
	filterUtil,

	// Models
	models,
	LocalStorage
) {
	'use strict';

	return Controller.extend('fi.neomore.template.controller.BaseController', {

		// Utils
		formatterUtil: formatterUtil,
		customTypesUtil: customTypesUtil,
		messageBoxUtil: messageBoxUtil,
		oDataUtil: oDataUtil,
		validationUtil: validationUtil,
		filterUtil: filterUtil,

		// Models
		models: models,
		localStorage: new LocalStorage(),

		onInit: function() {
			var that = this;
			UIComponent.getRouterFor(this).attachRouteMatched(function() {
				that.routeMatched.apply(that, arguments);
			});
			var eventBus = this.getMyComponent().getEventBus();
			eventBus.subscribe('app', 'afterNavigate', function handleAfterNavigate() {
				that.handleAfterNavigate.apply(that, arguments);
			}, this);
		},

		routeMatched: function(oEvent) {
			var parameters = oEvent.getParameter('arguments');

			if (parameters && !this.isEmptyObject(parameters)) {
				var decodeArr = parameters['?query'] ? parameters['?query'] : parameters;
				if (Array.isArray(decodeArr)) {
					decodeArr.forEach((key, value) => {
						decodeArr[key] = typeof value === 'string' ? decodeURIComponent(decodeURI(value)) : value;
					});
				} else {
					Object.keys(decodeArr).forEach((key) => {
						decodeArr[key] = typeof decodeArr[key] === 'string' ? decodeURIComponent(decodeURI(decodeArr[key])) : decodeArr[key];
					});
				}
			}

			this.setUrlParameters(parameters);
		},

		/**
		 *
		 * PlaceHolder method that should be extended in case something needs to be done right after navigation
		 * @protected
		 */
		handleAfterNavigate: function() {

		},

		/* =========================================================== */
		/* Common helpers                                              */
		/* =========================================================== */

		/**
		 * Get component for current view
		 * @returns {sap.ui.core.UIComponent} the component for this view
		 */
		getMyComponent: function() {
			return Component.get(Component.getOwnerIdFor(this.getView()));
		},

		/**
		 * @public
		 * @returns {sap.ui.core.mvc.Controller} the root controller
		 */
		getRootControl: function() {
			return this.getMyComponent().getAggregation('rootControl').getController();
		},

		/**
		 * @param {string} sElementId - ID of UI element
		 * @returns {object} the element object
		 */
		getElementById: function(sElementId) {
			return this.getView().byId(sElementId);
		},

		/**
		 * @param {string} sFragmentName - name of fragment
		 * @param {string} sElementId - ID of UI element
		 * @returns {object} the element object
		 */
		getFragmentElementById: function(sFragmentName, sElementId) {
			return Fragment.byId(this.getViewName() + this.getRootControl().getSessionId() + sFragmentName, sElementId);
		},

		/**
		 * @public
		 * @param {object} parameters - URL parameters to set
		 */
		setUrlParameters: function(parameters) {
			this.urlParameters = parameters;
		},

		getUrlParameters: function() {
			return this.urlParameters;
		},

		getUrlParameter: function(parameterName) {
			return this.urlParameters[parameterName] || null;
		},

		/**
		 * @param {string} sTextToGet - text property from i18n
		 * @param {array|string} [aPlaceHolders] - placeholders to add to i18n text
		 * @returns {string} the translated text
		 */
		getResourceBundleText: function(sTextToGet, aPlaceHolders) {
			return this.getView().getModel('i18n').getResourceBundle().getText(sTextToGet, aPlaceHolders);
		},

		/**
		 * Convenience method for getting model by name in every controller of the application.
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function(sName) {
			return this.getView().getModel(sName) || this.getMyComponent().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @param {string} sName the model name
		 * @param {object|sap.ui.model.json.JSONModel} [oData] the model data
		 * @param {function} [fOnChange] the model onChange function
		 * @returns {sap.ui.model.json.JSONModel} the view instance
		 */
		setModel: function(sName, oData, fOnChange) {
			var oModel = null;
			if (oData instanceof JSONModel) {
				oModel = oData;
			} else {
				oModel = new JSONModel();
				if (oData) {
					oModel.setData(oData);
				}
			}

			var createdModel = this.getView().setModel(oModel, sName);

			if (fOnChange) {
				var binding = new Binding(oModel, '/', oModel.getContext('/'));
				binding.attachChange(function() {
					fOnChange();
				});
			}

			return createdModel;
		},

		/**
		 * Convenience method for setting the component model in every controller of the application.
		 * @param {string} sName the model name
		 * @param {object|sap.ui.model.json.JSONModel} [oData] the model data
		 * @param {function} [fOnChange] the model onChange function
		 * @returns {sap.ui.model.json.JSONModel} the view instance
		 */
		setGlobalModel: function(sName, oData, fOnChange) {
			var oModel = null;
			if (oData instanceof JSONModel) {
				oModel = oData;
			} else {
				oModel = new JSONModel();
				if (oData) {
					oModel.setData(oData);
				}
			}

			var createdModel = this.getMyComponent().setModel(oModel, sName);

			if (fOnChange) {
				var binding = new Binding(oModel, '/', oModel.getContext('/'));
				binding.attachChange(function() {
					fOnChange();
				});
			}

			return createdModel;
		},

		/**
		 * Generated filter that can be passed to back end call
		 * @param {string} sValueToFilter - key of the value that should be filtered
		 * @param {array} aFilterValues - value or values that operator should be applied
		 * @param {sOperator} [sOperator] - operator of filter, default is EQ
		 * @returns {sap.ui.model.Filter[]} array of filters
		 */
		generateFilter: function(sValueToFilter, aFilterValues, sOperator) {
			return filterUtil.generateFilter(sValueToFilter, aFilterValues, sOperator);
		},


		/**
		 * Finds array index that contains object with given key value pair
		 * @param {string} sIdValue - value which should be found
		 * @param {string} sProperty - key of the value
		 * @param {array} aValuesToLookFrom - array of objects to look from
		 * @returns {integer} index of object with key value pair
		 */
		findRightArrayIndexById: function(sIdValue, sProperty, aValuesToLookFrom) {
			var rightIndex = false;
			aValuesToLookFrom.map(function(object, i) {
				if (object[sProperty] === sIdValue) {
					rightIndex = i;
				}
				return 0;
			});
			return rightIndex;
		},

		/**
		 * @param {array} arr - array to remove item from
		 * @param {integer} index - index of item to remove
		 * @returns {array} array without removed item
		 */
		removeIndexFromArray: function(arr, index) {
			arr.splice(index, 1);
			return arr;
		},

		/* =========================================================== */
		/* Routing			 										   */
		/* =========================================================== */

		/**
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function() {
			return this.getMyComponent().getRouter();
		},

		/**
		 * @returns {Promise} Launchpad user id
		 */
		getUserId: function() {
			return new Promise((resolve, reject) => {
				sap.ushell.Container.getServiceAsync('UserInfo')
					.then((oUserInfo) => {
						resolve(oUserInfo.getId());
					})
					.catch(() => {
						reject();
					});
			});
		},

		onNavBack: function() {
			// Can be used by controllers to add custom functionality to navBack
			if (this.beforeNavBack) {
				this.beforeNavBack();
			}
			window.history.go(-1);
		},

		onNavToLaunchpad: function() {
			var crossAppNavigation = sap.ushell.Container.getService('CrossApplicationNavigation');
			crossAppNavigation.toExternal({
				target: {
					shellHash: '#'
				}
			});
		},

		/**
		 * Navigates to given view; ie. this.navTo('Menu');
		 * @param {string} routeName - name of the route
		 * @param {object} [parameters] - parameters to pass to route
		 * @param {boolean} [replace] - replace history
		 */
		navTo: function(routeName, parameters, replace) {
			var router = UIComponent.getRouterFor(this);

			if (parameters && !this.isEmptyObject(parameters)) {
				var encodeArr = parameters.query ? parameters.query : parameters;
				if (Array.isArray(encodeArr)) {
					encodeArr.forEach((key, value) => {
						encodeArr[key] = typeof value === 'string' ? encodeURIComponent(value) : value;
					});
				} else {
					Object.keys(encodeArr).forEach((key) => {
						encodeArr[key] = typeof encodeArr[key] === 'string' ? encodeURIComponent(encodeArr[key]) : encodeArr[key];
					});
				}
			}

			router.navTo(
				routeName,
				parameters || {},
				replace || false
			);
		},

		/**
		 * @param {string} viewPath - path of the view
		 * @param {string} viewName - name of the view
		 * @returns {boolean} indicates if navigated from given view
		 */
		navigatedFrom: function(viewPath, viewName) {
			return viewPath && viewPath.indexOf(viewName) !== -1;
		},

		/**
		 * @param {string} viewName - name of the view
		 * @returns {boolean} indicates if navigated to given view
		 */
		navigatedToCurrentView: function(viewName) {
			return this.getView().sViewName.indexOf(viewName) !== -1;
		},

		/* =========================================================== */
		/* DOM Manipulations                                           */
		/* =========================================================== */

		/** Shows busy indicator, default delay is 0 second. This is used for busy states that requires no message
		 * @param {integer} [milliseconds] - time of delay
		 */
		showBusyIndicator: function(milliseconds) {
			var delay = milliseconds || 0;
			BusyIndicator.show(delay);
		},

		hideBusyIndicator: function() {
			BusyIndicator.hide();
		},

		/**
		 * Shows busy indicator, default delay is 1 second. This is used for busy states that requires no message
		 * @param {object} [args] object - possible values: {text, title, cancelButtonText, showCancelButton, customIcon, customIconRotationSpeed, customIconDensityAware, customIconWidth, customIconHeight}
		 */
		openBusyDialog: function(args) {
			var parameters = args || {};
			this.busyDialog = new BusyDialog(parameters);
			this.busyDialog.open();
		},

		getBusyDialog: function() {
			return this.busyDialog;
		},

		closeBusyDialog: function() {
			this.busyDialog.close();
		},

		/**
		 * Set application to busy mode
		 * @param {integer} [iDelay = 200] - time of delay
		 */
		setAppBusyMode: function(iDelay) {
			iDelay = iDelay || 200;
			BusyIndicator.show(iDelay);
		},

		setAppNotBusyMode: function() {
			BusyIndicator.hide();
		},

		getViewName: function() {
			return this.getView().sViewName.split('.').pop();
		},

		/**
		 * Open simple dialog pass fragment name which exists in "view/fragment/" (fi.neomore.template.view.fragment) folder
		 *
		 * @example
		 * this.openSimpleDialog('SimpleDialog');
		 *
		 * @see openDialog for opening complex fragment which has its own controller
		 * @public
		 * @param {string} fragmentName - name of the fragment
		 */
		openSimpleDialog: function(fragmentName) {
			this.initializeFragment(fragmentName)
				.then((fragment) => {
					fragment.open();
				});
		},

		/**
		 * Open dialog with fragment name
		 * @param {string} fragmentName - name of the fragment
		 * @param {object} [parameters] - parameters to pass to fragment
		 */
		openDialog: function(fragmentName, parameters) {
			Controller.create({
				name: 'fi.neomore.template.controller.fragment.' + fragmentName
			}).then(function(fragmentController) {
				this.initializeFragment(fragmentName, fragmentController)
					.then((fragment) => {
						fragmentController.init(this, fragment, parameters);
					});
			}.bind(this));
		},

		/**
		 * Initializes fragment
		 * @param {string} fragmentName - name of the fragment
		 * @param {sap.ui.core.mvc.Controller} [controller] - controller of the fragment
		 * @returns {Promise<sap.ui.fragment>} fragment
		 */
		initializeFragment: function(fragmentName, controller) {
			return new Promise((resolve, reject) => {
				var fragmentId = this.getViewName() + this.getRootControl().getSessionId() + fragmentName;

				if (!this[fragmentId]) {
					Fragment.load({
						id: fragmentId,
						name: 'fi.neomore.template.view.fragment.' + fragmentName,
						controller: controller || this
					}).then((oFragment) => {
						this[fragmentId] = oFragment;
						this.getView().addDependent(oFragment);
						resolve(oFragment);
					}).catch((error) => {
						reject(error);
					});
				} else {
					resolve(this[fragmentId]);
				}
			});
		},

		getDialog: function(fragmentName) {
			return this[this.getViewName() + this.getRootControl().getSessionId() + fragmentName];
		},

		/* =========================================================== */
		/* Validation functions                                        */
		/* =========================================================== */

		/**
		 * @param {sap.ui.core.Control} [control] - control that should be validated recursively, default is current view
		 * @param {function} [functionToCallOnInvalidElements] - function that gets array of invalid elements as argument
		 * @returns {boolean} indicates if invalid controls were found
		 */
		validate: function(control, functionToCallOnInvalidElements) {
			var invalidControls = this.getInvalidControls(control);

			if (invalidControls.length && functionToCallOnInvalidElements) {
				functionToCallOnInvalidElements.call(this, this.validationUtil.controlValidationResults);
			}
			return this.validationUtil.controlValidationResults.length === 0;
		},

		/**
		 * Get invalid controls
		 * @param {any} [control] - control that should be validated recursively, default is current view
		 * @returns {array} validation results
		 */
		getInvalidControls: function(control) {
			this.validationUtil.controlValidationResults = [];
			this.validationUtil.validateControlType(control || this.getView());

			return this.validationUtil.controlValidationResults;
		},

		/* =========================================================== */
		/* Message handler helper                                      */
		/* =========================================================== */

		/**
		 * Open message box (Info, Success, Error, Warning, Confirm)
		 * @example
		 * this.showMessageBox({
		 *		type: 'Info',
		 *		title: this.getResourceBundleText('THIS_IS_TITLE'),
		 *		message: this.getResourceBundleText('THIS_IS_MESSAGE'),
		 *		onClose: this.closeHandler.bind(this)
		 *	});
		 * @param  {object} parameters - parameters object
		 * @public
		 */
		showMessageBox: function(parameters) {
			messageBoxUtil.show(parameters);
		},

		/**
		 * Shows SAP messages in popup
		 * @param {array} aMessages - array of messages, generated by parseSapMessages function
		 * @param {boolean=} bShowOnlyWarnings - boolean value to show only warnings
		 * @param {function=} fOnClose - onClose function for the popup
		 */
		openSapMessagesPopup: function(aMessages, bShowOnlyWarnings, fOnClose) {
			if (bShowOnlyWarnings) {
				var aWarnings = [];
				aMessages.forEach(function(message) {
					if (message.severity === 'Warning') {
						aWarnings.push(message);
					}
				});
				aMessages = aWarnings;
			}
			if (aMessages && aMessages.length) {
				var firstMessage = aMessages.shift();
				var otherMessages = [];
				aMessages.forEach(function(message) {
					otherMessages.push(message.severity + ': ' + message.message);
				});
				this.showMessageBox({
					type: firstMessage.severity,
					title: firstMessage.severity,
					message: firstMessage.message,
					details: otherMessages.join('\n'),
					onClose: fOnClose || null
				});
			}
		},

		/* =========================================================== */
		/* Error handler helpers                                       */
		/* =========================================================== */

		/**
		 * @param {string|object} oErrEvt - error event passed from service
		 * @param {string} [i18nKey] - key of the text from i18n
		 * @param {boolean} [hideDetails] - boolean to hide error details
		 */
		openErrorMessagePopup: function(oErrEvt, i18nKey, hideDetails) {
			i18nKey = i18nKey || 'ERROR_MESSAGE_ERROR_LOADING_DATA';
			var additionalErrorMessages = [];
			if (oErrEvt && !hideDetails) {
				var parsedErrorObject = this.parseErrorObject(oErrEvt);
				var errorMessage = oErrEvt && formatterUtil.oDataErrorToErrorString(oErrEvt);
				additionalErrorMessages = [errorMessage].concat(
					(parsedErrorObject && parsedErrorObject.error && parsedErrorObject.error.innererror && parsedErrorObject.error.innererror.errordetails || [])
						.map(function(errorDetailObject) {
							return errorDetailObject.message;
						})
				);
			}
			var messageBoxParameters = {
				type: 'Error',
				title: this.getResourceBundleText('COMMON_ERROR_TITLE'),
				message: oErrEvt ?
					this.getResourceBundleText(i18nKey, formatterUtil.oDataErrorToErrorString(oErrEvt)) : this.getResourceBundleText(i18nKey),
				details: additionalErrorMessages.length ?
					this.generateStringFromAdditionalMessages(
						this.removeIndexFromArray(additionalErrorMessages.filter(this.removeDuplicates.bind(this)), 0)
					) : false
			};
			messageBoxUtil.show(messageBoxParameters);
		},

		parseErrorObject: function(error) {
			var errorObject;
			try {
				errorObject = JSON.parse(error.response ? error.response.body : error.responseText);
			// eslint-disable-next-line no-unused-vars
			} catch (e) {
				errorObject = null;
			}
			return errorObject;
		},

		generateStringFromAdditionalMessages: function(aAdditionalMessages) {
			return aAdditionalMessages.reduce(function(messageString, currentMessage) {
				return messageString ? messageString + ',\n' + currentMessage : currentMessage;
			}, '');
		},

		removeDuplicates: function(value, index, array) {
			return array.indexOf(value) === index;
		},

		isEmptyObject: function(object) {
			return Object.keys(object).length === 0;
		}

	});
});