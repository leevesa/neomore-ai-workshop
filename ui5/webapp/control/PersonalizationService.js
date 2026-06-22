sap.ui.define(['jquery.sap.global'],
	function(jQuery) {
		'use strict';

		// Very simple page-context personalization
		// persistence service
		var PersoService = {
			defaultData: {
				_persoSchemaVersion: '1.0',
				aColumns: []
			},

			getPersData: function() {
				var oDeferred = new jQuery.Deferred();
				if (!this._oBundle) {
					this._oBundle = this.defaultData;
				}
				var oBundle = this._oBundle;
				oDeferred.resolve(oBundle);
				return oDeferred.promise();
			},

			setPersData: function(oBundle) {
				var oDeferred = new jQuery.Deferred();
				if (oBundle && oBundle.aColumns && oBundle.aColumns.length || oBundle && oBundle.length) {
					this._oBundle = oBundle;
				} else {
					this.resetPersData();
				}
				oDeferred.resolve();
				return oDeferred.promise();
			},

			resetPersData: function() {
				var oDeferred = new jQuery.Deferred();
				var oInitialData = this.defaultData;

				// set personalization
				this._oBundle = oInitialData;

				oDeferred.resolve();
				return oDeferred.promise();
			},

			setDefaultColumnData: function(aColumns) {
				if ((this.defaultData.aColumns || []).length === 0) {
					this.defaultData.aColumns = aColumns;
				}
			}
		};

		return PersoService;
	}, true);