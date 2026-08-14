/**
 * Filter utility
 * @module fi.neomore.template.util.filter
 */
sap.ui.define([
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
], function(Filter, FilterOperator) {
	'use strict';

	return {
		/**
		 * Generated filter that can be passed to back end call
		 * @param {string} sValueToFilter - key of the value that should be filtered
		 * @param {array} aFilterValues - value or values that operator should be applied
		 * @param {sOperator} [sOperator] - operator of filter, default is EQ
		 * @returns {sap.ui.model.Filter[]} array of filters
		 */
		generateFilter: function(sValueToFilter, aFilterValues, sOperator) {
			sOperator = sOperator || 'EQ';
			var sFilterOperator = {
				EQ: FilterOperator.EQ,
				Contains: FilterOperator.Contains,
				NE: FilterOperator.NE,
				StartsWith: FilterOperator.StartsWith,
				LT: FilterOperator.LT,
				GT: FilterOperator.GT
			}[sOperator];
			var aFilterArray = aFilterValues.map(function(sFilterValue) {
				return new Filter(sValueToFilter || '', sFilterOperator, sFilterValue);
			});
			return aFilterArray;
		},

		/**
		 * Generate range filter, returns filter in array to work similarly with generateFilter
		 * @param {string} sValueToFilter - key of the value that should be filtered
		 * @param {string|number|object} lowValue - low value of the range
		 * @param {string|number|object} highValue - high value of the range
		 * @returns {sap.ui.model.Filter[]} array with range filter
		 */
		generateRangeFilter: function(sValueToFilter, lowValue, highValue) {
			// eslint-disable-next-line no-undefined
			if (lowValue !== undefined && lowValue !== null && highValue !== undefined && highValue !== null) {
				return [new Filter(sValueToFilter || '', FilterOperator.BT, lowValue, highValue)];
			}
			return [];
		},

		/**
         * Generate simple (EQ) filters from object
         * Passed filters should be in format:
         * {
         *     'Plant': ['Plant 1', 'Plant 2'],
         *     'WorkCenter': ['WorkCenter 1', 'Work Center 2']
         * }
         * @param {object} oFilters object with filters
         * @returns {sap.ui.model.Filter[]} array of filters
         */
		generateSimpleFilters: function(oFilters) {
			var aFilters = [];
			var aKeys = Object.keys(oFilters);
			aKeys.map(function(sKey) {
				if (oFilters[sKey] && oFilters[sKey].length) {
					aFilters = aFilters.concat(this.generateFilter(sKey, oFilters[sKey]));
				}
			}.bind(this));
			return aFilters;
		},

		/**
         * Generate complex filters from object
         * Passed filters should be in format:
         * {
         *    'type': 'and',
         *    'filters': [
         *      {
         *          'Plant': ['Plant 1'],
         *          'WorkCenter': ['WorkCenter 1']
         *      }, {
         *          'type': 'or',
         *          'filters': [
         *              {
         *                  'Plant': ['Plant 2'],
         *                  'WorkCenter': ['WorkCenter 2']
         *              }
         *          ]
         *      }
         *    ]
         *  }
         * @param {object} oFilters object with filters
         * @param {string} [sType] type of filter (and/or)
         * @returns {sap.ui.model.Filter[]} array of filters
         */
		generateComplexFilters: function(oFilters, sType) {
			if (oFilters.hasOwnProperty('type') && oFilters.hasOwnProperty('filters')) {
				return new Filter({
					filters: oFilters.filters.map(function(oFilter) {
						var generatedFilters = this.generateComplexFilters(oFilter, oFilters.type);
						if (generatedFilters.length) {
							return new Filter({
								filters: generatedFilters,
								and: oFilter.type === 'and'
							});
						}
						return generatedFilters;
					}.bind(this)),
					and: oFilters.type === 'and'
				});
			} else if (Object.keys(oFilters).length) {
				return new Filter({
					filters: this.generateSimpleFilters(oFilters),
					and: sType !== 'or'
				});
			}
			return null;
		}

	};
});