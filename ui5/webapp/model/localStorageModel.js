sap.ui.define([
	'sap/ui/model/json/JSONModel',
	'sap/ui/util/Storage'
], function(JSONModel, Storage) {
	'use strict';

	return JSONModel.extend('fi.neomore.template.model.localStorageModel', {

		storageKey: 'localStorageModel',
		storage: new Storage(Storage.Type.local),

		constructor: function() {
			JSONModel.call(this, {});
			this.setSizeLimit(1000);

			this.loadData();

			return this;
		},

		loadData: function() {
			var sJSON = this.storage.get(this.storageKey);
			var dateKeys = ['TestDate'];

			var localStorageJSON = JSON.parse(sJSON) || {};

			localStorageJSON.ViewModelStorage = this.formatDates(dateKeys, localStorageJSON.ViewModelStorage || {});

			this.setData(localStorageJSON || {});

			this.bIsDataLoaded = true;
		},

		formatDates: function(dateKeys, storedObject) {
			dateKeys.forEach(function(dateKey) {
				storedObject[dateKey] = storedObject[dateKey] ? new Date(storedObject[dateKey]) : storedObject[dateKey];
			});
			return storedObject;
		},

		storeData: function() {
			var oData = this.getData();

			var sJSON = JSON.stringify(oData);
			this.storage.put(this.storageKey, sJSON);
		},

		setProperty: function(sPath, data) {
			JSONModel.prototype.setProperty.apply(this, sPath, data);
			this.storeData();
		},

		setData: function(data) {
			JSONModel.prototype.setData.apply(this, data);
			// called from constructor: only store data after first load
			if (this.bIsDataLoaded) {
				this.storeData();
			}
		},

		refresh: function() {
			JSONModel.prototype.refresh.apply(this, arguments);
			this.storeData();
		}
	});
});