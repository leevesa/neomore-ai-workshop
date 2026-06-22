sap.ui.define([
	'sap/ui/model/json/JSONModel',
	'fi/neomore/template/util/oData'
], function(JSONModel, oDataUtil) {
	'use strict';

	return JSONModel.extend('fi.neomore.template.model.Helpers', {

		constructor: function() {
			JSONModel.call(this, arguments);

			this.setData({
				WorkCenters: []
			});

			return this;
		},

		loadHelpers: function() {
			return Promise.all([
				this.loadWorkCenters(),
				this.loadPriorities(),
				this.loadPersons(),
				this.loadFunctionalLocations(),
				this.loadEquipments()
			]);
		},

		loadWorkCenters: function() {
			return oDataUtil.read('ZCAP_BACKEND_SRV', '/WorkCenters')
				.then((results) => {
					this.setProperty('/WorkCenters', results);
				});
		},

		loadPriorities: function() {
			return oDataUtil.read('ZCAP_BACKEND_SRV', '/Priorities')
				.then((results) => {
					this.setProperty('/Priorities', results);
				});
		},

		loadPersons: function() {
			return oDataUtil.read('ZCAP_BACKEND_SRV', '/Persons')
				.then((results) => {
					this.setProperty('/Persons', results);
				});
		},

		loadFunctionalLocations: function() {
			return oDataUtil.read('ZCAP_BACKEND_SRV', '/FunctionalLocations')
				.then((results) => {
					this.setProperty('/FunctionalLocations', results);
				});
		},

		loadEquipments: function() {
			return oDataUtil.read('ZCAP_BACKEND_SRV', '/Equipments')
				.then((results) => {
					this.setProperty('/Equipments', results);
				});
		}

	});
});