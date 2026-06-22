sap.ui.define([
	'sap/m/P13nDialog',
	'sap/m/P13nSortPanel',
	'sap/m/P13nItem',
	'sap/m/P13nSortItem'
], function(P13nDialog, P13nSortPanel, P13nItem, P13nSortItem) {
	'use strict';

	/**
	 * Custom MultiSortDialog control.
	 *
	 * @param {string} [sId] Id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class MultiSortDiaog
	 * The fi.neomore.template.control.Column control provides few extra properties to be used with with fi.neomore.template.control.Table
	 *
	 * @extends sap.m.P13nDialog
	 *
	 * @author Neomore Consulting Oy - Jyri Jaakkola
	 * @version 1.0
	 *
	 * @constructor
	 * @public
	 * @since 1.40
	 * @alias fi.neomore.template.control.MultiSortDialog
	 */

	var MultiSortDialog = P13nDialog.extend('fi.neomore.template.control.MultiSortDialog', {
		_oSortPanel: null,

		metadata: {
			/**
             * Extended metadata properties for fi.neomore.template.control.MultiSortDialog.
             * @name fi.neomore.template.control.MultiSortDialog#properties
             * @property {array} [tableColumns = []] - {@link fi.neomore.template.control.MultiSortDialog#tableColumns Table columns}
             * @property {array} [sortingData = []] - {@link fi.neomore.template.control.MultiSortDialog#sortingData Sorting data}
             */
			properties: {
				/**
                 * Array of columns that are possible to use with sorting.
                 * <br />
                 * <br />Objects should be in format of: {text: *string*, sortKey: *sting*},
                 * where text is the column header text and sortKey the property binded/used for sorting.
                 * <br />This property should be set before first open.
                 * @name fi.neomore.template.control.MultiSortDialog#tableColumns
                 */
				tableColumns: {
					type: 'array',
					defaultValue: []
				},
				/**
                 * Array of sort options that are already set.
                 * <br />
                 * <br />Objects should be in format of: {sortKey: *string*, descending: *boolean*},
                 * where sortKey the property binded/used for sorting and descending if descending is selected.
                 * <br />This property should be set before first open.
                 * @name fi.neomore.template.control.MultiSortDialog#sortingData
                 */
				sortingData: {
					type: 'array',
					defaultValue: []
				}
			},
			events: {
				/**
                 * Fired when the sorting is confirmed.
                 * <br />Event will pass array of sortItems as a parameter.
                 * <br />sortItem has two properties: sortKey & descending.
                 * @event fi.neomore.template.control.MultiSortDialog#sortChange
                 * @property {array} sortItems - array of sort items
                 */
				sortChange: {
					parameters: {
						sortItems: {
							type: 'array'
						}
					}
				}
			}
		},

		init: function() {
			if (P13nDialog.prototype.init) {
				P13nDialog.prototype.init.call(this, arguments);
			}
		},

		open: function() {
			if (!this._oSortPanel) {
				this._setItemsFromColumns();
			} else {
				this._setCurrentSortingData();
			}
			if (P13nDialog.prototype.open) {
				P13nDialog.prototype.open.call(this, arguments);
			}
		},

		renderer: {},

		/* ************************* */
		/* Internal functions        */
		/* ************************* */

		_createOKButton: function() {
			if (P13nDialog.prototype._createOKButton) {
				var button = P13nDialog.prototype._createOKButton.call(this, arguments);
				button.attachPress(this.onOkPress.bind(this));
				return button;
			}
			return null;
		},

		_createCancelButton: function() {
			if (P13nDialog.prototype._createCancelButton) {
				var button = P13nDialog.prototype._createCancelButton.call(this, arguments);
				button.attachPress(this.onCancelPress.bind(this));
				return button;
			}
			return null;
		},

		_setItemsFromColumns: function() {
			this._oSortPanel = new P13nSortPanel({
				addSortItem: this.onSortItemAdd.bind(this),
				removeSortItem: this.onSortItemRemove.bind(this),
				updateSortItem: this.onSortItemUpdate.bind(this)
			});
			// Set possible selection values
			var tableColumns = this.getTableColumns() || [];
			tableColumns.map(function(column) {
				var sText = column.text || '';
				var sKey = column.sortKey || '';
				if (sKey) {
					this._oSortPanel.addItem(new P13nItem({
						columnKey: sKey,
						text: sText
					}));
				}
			}.bind(this));
			this.addAggregation('panels', this._oSortPanel);
			// Set current selections
			this._setCurrentSortingData();
		},

		_setCurrentSortingData: function() {
			// Set current selections
			this._oSortPanel.destroySortItems();
			var sortData = this.getSortingData() || [];
			sortData.map(function(item) {
				this._oSortPanel.addSortItem(new P13nSortItem({
					columnKey: item.sortKey,
					operation: item.descending ? 'Descending' : 'Ascending'
				}));
			}.bind(this));
		},

		_getSortingData: function() {
			var sortItems = this._oSortPanel.getSortItems() || [];
			var sortingData = sortItems.map(function(item) {
				return {
					sortKey: item.getColumnKey(),
					descending: item.getOperation() === 'Descending'
				};
			});
			return {
				sortItems: sortingData
			};
		},

		_getCurrentSortingData: function() {
			var sortItems = this._oSortPanel.getSortItems() || [];
			var sortingData = sortItems.map(function(item) {
				return {
					columnKey: item.getColumnKey(),
					operation: item.getOperation()
				};
			});
			return sortingData;
		},

		/* ************************* */
		/* Event handling            */
		/* ************************* */

		onOkPress: function() {
			this.fireSortChange(this._getSortingData());
			this.close();
		},

		onCancelPress: function() {
			this.close();
		},

		onSortItemAdd: function(oEvent) {
			var sortItem = oEvent.getParameter('sortItemData');
			this._oSortPanel.addSortItem(new P13nSortItem({
				columnKey: sortItem.getColumnKey(),
				operation: sortItem.getOperation()
			}));
		},

		onSortItemRemove: function(oEvent) {
			var index = oEvent.getParameter('index');
			this._oSortPanel.removeSortItem(index);
		},

		onSortItemUpdate: function(oEvent) {
			var items = this._getCurrentSortingData() || [];
			var index = oEvent.getParameter('index');
			var sortItem = oEvent.getParameter('sortItemData');
			items[index] = {
				columnKey: sortItem.getColumnKey(),
				operation: sortItem.getOperation()
			};
			this._oSortPanel.destroySortItems();
			items.map(function(item) {
				this._oSortPanel.addSortItem(new P13nSortItem({
					columnKey: item.columnKey,
					operation: item.operation
				}));
			}.bind(this));
		}

	});

	return MultiSortDialog;
});