/**
 * oDataUtil
 * @module fi.neomore.template.util.oData
 */
sap.ui.define([
	'sap/ui/model/odata/v2/ODataModel'
],
function(ODataModel) {
	'use strict';

	var models = {};

	return {
		// Define services here
		services: {
			'NEOMORE': '/sap/opu/odata/sap/TEMPLATE_SERVICE',
			'ZCAP_BACKEND_SRV': '/sap/opu/odata/sap/ZCAP_BACKEND_SRV'
		},

		getOdataModel: function(modelName) {
			if (!models[modelName]) {
				models[modelName] = new ODataModel(this.getServiceUrl(modelName), {
					useBatch: false,
					defaultUpdateMethod: 'Put'
				});
			}
			return models[modelName];
		},

		getServiceUrl: function(serviceName) {
			var service = this.services[serviceName];
			if (!service) {
				throw new Error('Service: ' + service + ' not found');
			}
			return sap.ui.require.toUrl('fi/neomore/template') + service;
		},

		handleResultsObjects: function(oData) {
			oData = oData && oData.results ? oData.results : oData;
			if (!Array.isArray(oData)) {
				return typeof oData === 'object' && oData !== null ?
					this.removeResultFromObject(oData) :
					oData;
			}
			return typeof oData === 'object' && oData !== null ?
				this.handleResultFromArray(oData) :
				oData;
		},

		removeResultFromObject: function(oData) {
			Object.keys(oData).map(function(key) {
				oData[key] = oData[key] !== null && typeof oData[key] === 'object' && oData[key] && oData[key].results ?
					oData[key].results :
					oData[key];
				if (Array.isArray(oData[key])) {
					oData[key] = oData[key].map(this.removeResultFromObject.bind(this));
				}
			}.bind(this));

			return oData;
		},

		handleResultFromArray: function(oData) {
			oData = oData.map(function(oItem) {
				return this.handleResultsObjects(oItem);
			}.bind(this));
			return oData;
		},

		/**
			 * Parses SAP messages from the response data
			 * @param {object} oResponse - Response object
			 * @returns {array} SAP messages
			 */
		parseSapMessages: function(oResponse) {
			var aMessages = [];
			if (oResponse && oResponse.headers && oResponse.headers['sap-message']) {
				var oMessage = JSON.parse(oResponse.headers['sap-message']);
				var severity = oMessage.severity ? oMessage.severity.charAt(0).toUpperCase() + oMessage.severity.slice(1) : 'Warning';
				aMessages.push({
					severity: severity || '',
					message: oMessage.message || '',
					code: oMessage.code || '',
					target: oMessage.target || ''
				});
				if (oMessage.details) {
					oMessage.details.map(function(detail) {
						var sSeverity = detail.severity ? detail.severity.charAt(0).toUpperCase() + detail.severity.slice(1) : 'Warning';
						aMessages.push({
							severity: sSeverity || '',
							message: detail.message || '',
							code: detail.code || '',
							target: detail.target || ''
						});
						return detail;
					});
				}
			}
			return aMessages;
		},

		/**
			 * Creates path with keys
			 * @param {string} sPath - Path string
			 * @param {object} oKeys - Keys object
			 * @returns {string} Path to service
			 */
		generatePathToService: function(sPath, oKeys) {
			if (oKeys) {
				var str = '';
				for (var key in oKeys) {
					if (str !== '') {
						str += ',';
					}
					str += key + '=\'' + encodeURIComponent(oKeys[key]) + '\'';
				}
				sPath += '(' + str + ')';
			}

			return sPath;
		},

		/**
			 * Reads data from back end
			 * @param {string} serviceName - part of the uri, before path to service
			 * @param {string} pathToService - path to the service
			 * @param {object} [oParameters] - parameters for service call
			 * @returns {object} data from back end and messages or error event
			 */
		read: function(serviceName, pathToService, oParameters) {
			return new Promise((resolve, reject) => {
				oParameters = oParameters || {};
				pathToService = this.generatePathToService(pathToService, oParameters.keys);

				var oDataModel = this.getOdataModel(serviceName).attachMetadataFailed(function(oError) {
					reject(oError);
				});
				oDataModel.read(pathToService, {
					async: oParameters && oParameters.hasOwnProperty('async') ? oParameters.async : true,
					filters: oParameters && oParameters.filters ? oParameters.filters : null,
					sorters: oParameters && oParameters.sorters ? oParameters.sorters : null,
					urlParameters: oParameters && oParameters.urlParameters ? oParameters.urlParameters : null,
					success: function(oData, oResponse) {
						resolve(this.handleResultsObjects(oData), this.parseSapMessages(oResponse));
					}.bind(this),
					error: function(errEvt) {
						reject(errEvt);
					}
				});
			});
		},

		/**
			 * Removes data from back end
			 * @param {string} serviceName - part of the uri, before path to service
			 * @param {string} pathToService - path to the service
			 * @param {object} [oParameters] - parameters for call
			 * @returns {object} data from back end and messages or error event
			 */
		remove: function(serviceName, pathToService, oParameters) {
			return new Promise((resolve, reject) => {
				oParameters = oParameters || {};
				pathToService = this.generatePathToService(pathToService, oParameters.keys);

				var oDataModel = this.getOdataModel(serviceName);
				oDataModel.remove(pathToService, {
					async: oParameters && oParameters.hasOwnProperty('async') ? oParameters.async : true,
					success: function(oData, oResponse) {
						resolve(this.handleResultsObjects(oData), this.parseSapMessages(oResponse));
					}.bind(this),
					error: function(errEvt) {
						reject(errEvt);
					}
				});
			});
		},

		/**
			 * Posts data to back end
			 * @param {string} serviceName - part of the uri, before path to service
			 * @param {string} pathToService - path to the service
			 * @param {object} dataToPost - data to be posted to back end
			 * @param {object} [oParameters] - parameters for call
			 * @returns {object} data from back end and messages
			 */
		create: function(serviceName, pathToService, dataToPost, oParameters) {
			return new Promise((resolve, reject) => {
				oParameters = oParameters || {};
				pathToService = this.generatePathToService(pathToService, oParameters.keys);

				var oDataModel = this.getOdataModel(serviceName);
				oDataModel.create(pathToService, dataToPost, {
					async: oParameters && oParameters.hasOwnProperty('async') ? oParameters.async : true,
					success: function(oData, oResponse) {
						resolve(this.handleResultsObjects(oData), this.parseSapMessages(oResponse));
					}.bind(this),
					error: function(errEvt) {
						reject(errEvt);
					}
				});
			});
		},

		/**
			 * Updates data to back end
			 * @param {string} serviceName - part of the uri, before path to service
			 * @param {string} pathToService - path to the service
			 * @param {object} dataToUpdate - data to be updated to back end
			 * @param {object} [oParameters] - make call async
			 * @returns {object} data from back end and messages
			 */
		update: function(serviceName, pathToService, dataToUpdate, oParameters) {
			return new Promise((resolve, reject) => {
				oParameters = oParameters || {};
				pathToService = this.generatePathToService(pathToService, oParameters.keys);

				var oDataModel = this.getOdataModel(serviceName);
				oDataModel.update(pathToService, dataToUpdate, {
					async: oParameters && oParameters.hasOwnProperty('async') ? oParameters.async : true,
					success: function(oData, oResponse) {
						resolve(this.handleResultsObjects(oData), this.parseSapMessages(oResponse));
					}.bind(this),
					error: function(errEvt) {
						reject(errEvt);
					}
				});
			});
		},

		callFunction: function(serviceName, functionImportName, callObj, method) {
			return new Promise((resolve, reject) => {
				method = method || 'GET';
				var oDataModel = this.getOdataModel(serviceName);
				oDataModel.callFunction(functionImportName, {
					method: method,
					urlParameters: callObj,
					async: null,
					success: function(oData, oResponse) {
						resolve(this.handleResultsObjects(oData), this.parseSapMessages(oResponse));
					}.bind(this),
					error: function(oError) {
						reject(oError);
					}
				});
			});
		}
	};
});