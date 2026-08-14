/**
 * @namespace
 * @name fi.neomore.template.control
 * @public
 */
sap.ui.define([
	'sap/m/Table',
	'sap/m/Button',
	'sap/m/TablePersoController',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/Sorter',
	'sap/m/Toolbar',
	'sap/m/ToolbarSpacer',
	'sap/m/Title',
	'sap/m/Text',
	'sap/ui/core/Icon',
	'sap/m/ViewSettingsDialog',
	'sap/m/ViewSettingsItem',
	'fi/neomore/template/control/PersonalizationService',
	'fi/neomore/template/control/SearchInput',
	'fi/neomore/template/control/MultiSortDialog',
	'fi/neomore/template/util/formatter'
], function(Table, Button, TablePersoController, Filter, FilterOperator, Sorter, Toolbar, ToolbarSpacer, Title, Text, Icon, ViewSettingsDialog, ViewSettingsItem, PersonalizationService, SearchInput, MultiSortDialog, FormatterUtil) {
	'use strict';

	/**
	 * Custom Table control.
	 *
	 * @param {string} [sId] Id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class Table
	 * The fi.neomore.template.control.Table control provides a set of commonly used features on top of standard sap.m.Table. Which include:
     * <br /> - Personalization (Column order/visibility)
     * <br /> - Sorting
     * <br /> - Filtering list with a search input
     * <br /> - Showing title with the item count without using external model bindings
	 * <br />
     * <br />To take full advantages it is recommended to use fi.neomore.template.control.Column in columns aggregation to get the easy configuration for sorting and filtering.
	 *
	 * @extends sap.m.Table
	 *
	 * @author Neomore Consulting Oy - Jyri Jaakkola
	 * @version 1.0.4
	 *
	 * @constructor
	 * @public
	 * @since 1.38
	 * @alias fi.neomore.template.control.Table
	 */
	var ControlTable = Table.extend('fi.neomore.template.control.Table', {
		// Internal variables to store some necessary table data
		_bFirstLoad: true,
		_oTablePersoController: null,
		_oSimpleSortDialog: null,
		_oMultiSortDialog: null,
		_sSearchInputId: 'tableSearchInput',
		_aSorters: [],
		_aColumns: [],
		_minScreenWidths: null,
		_additionalFilters: null,

		metadata: {
			/**
             * Extended metadata properties for fi.neomore.template.control.Table.
             * @name fi.neomore.template.control.Table#properties
             * @property {string} [title = ''] - {@link fi.neomore.template.control.Table#title Title text}
             * @property {boolean} [showTotalCount = false] - {@link fi.neomore.template.control.Table#showTotalCount Show total count}
             * @property {int} [count = ''] - {@link fi.neomore.template.control.Table#count Total count}
             * @property {boolean} [showPersonalization = false] - {@link fi.neomore.template.control.Table#showPersonalization Show personalization}
             * @property {boolean} [showMultiSorting = false] - {@link fi.neomore.template.control.Table#showMultiSorting Show multi sorting}
             * @property {boolean} [showSorting = false] - {@link fi.neomore.template.control.Table#showSorting Show sorting}
             * @property {boolean} [showSearch = false] - {@link fi.neomore.template.control.Table#showSearch Show search}
             * @property {boolean} [showFilteringInfo = true] - {@link fi.neomore.template.control.Table#showFilteringInfo Show fitlering info}
             * @property {boolean} [useLiveSearch = false] - {@link fi.neomore.template.control.Table#useLiveSearch Use live search}
             * @property {boolean} [useCustomSorting = false] - {@link fi.neomore.template.control.Table#useCustomSorting Use custom sorting}
             * @property {boolean} [useCustomFiltering = false] - {@link fi.neomore.template.control.Table#useCustomFiltering Use custom filtering}
             * @property {int} [liveSearchStartLength = 1] - {@link fi.neomore.template.control.Table#liveSearchStartLength Live search starting lenght}
             * @property {string} [customHeaderContentPosition = 'Right'] - {@link fi.neomore.template.control.Table#customHeaderContentPosition Position of custom header content}
             * @property {boolean} [setTablePopins = false] - {@link fi.neomore.template.control.Table#setTablePopins Set table popins}
             */
			properties: {
				/**
                 * Sets title to custom Header Toolbar
                 * @name fi.neomore.template.control.Table#title
                 */
				title: {
					type: 'string',
					defaultValue: ''
				},
				/**
                 * Defines Header Toolbar to add total count of items after the title.
                 * <br />
                 * <br />This property requires that also the title has been defined. Otherwise the property will be ignored.
                 * @name fi.neomore.template.control.Table#showTotalCount
                 */
				showTotalCount: {
					type: 'boolean',
					defaultValue: false
				},
				/**
                 * Defines Header Toolbar to show total count of items after the title.
                 * <br />
                 * <br />This property requires that also the title and showTotalCount has been defined/set true. Otherwise the property will be ignored.
                 * @name fi.neomore.template.control.Table#count
                 */
				count: {
					type: 'int',
					defaultValue: -1
				},
				/**
                 * Defines Header Toolbar to add personalizations settings to table.
                 * <br />
                 * <br />When this property is set to true control will render Button to the end of Header Toolbar and
                 * adds automatically possibility to personalize the table. In order to catch changed settings, you can use personalizationChange event.
                 * <br />And to restore personalization settings you can use controls public method setPersonalizationData.
                 * @name fi.neomore.template.control.Table#showPersonalization
                 */
				showPersonalization: {
					type: 'boolean',
					defaultValue: false
				},
				/**
                 * Defines Header Toolbar to add sorting option (Multisort)
                 * <br />
                 * <br />When this property is set to true it will overwrite the showSorting property.
                 * <br />Property adds sorting button to Header Toolbar and handles sorting of the table items.
                 * <br />If you want to use custom sorting or save sorting selections you can get selected sortings by using sortChange event.
                 * <br />You can also retrieve current sorting using controls public method getSorters and set them using setSorters.
                 * <br />To make this option work use fi.neomore.template.control.Column controls in columns aggregation with sortKey properties set.
                 * @name fi.neomore.template.control.Table#showMultiSorting
                 */
				showMultiSorting: {
					type: 'boolean',
					defaultValue: false
				},
				/**
                 * Defines Header Toolbar to add sorting option (Simple sort)
                 * <br />
                 * <br />When this property showMultiSorting is set to true it will overwrite this property and this will have no effect.
                 * <br />Property adds sorting button to Header Toolbar and handles sorting of the table items.
                 * <br />If you want to use custom sorting or save sorting selections you can get selected sortings by using sortChange event.
                 * <br />You can also retrieve current sorting using controls public method getSorters and set them using setSorters.
                 * <br />To make this option work use fi.neomore.template.control.Column controls in columns aggregation with sortKey properties set.
                 * @name fi.neomore.template.control.Table#showSorting
                 */
				showSorting: {
					type: 'boolean',
					defaultValue: false
				},
				/**
                 * Defines Header Toolbar to add search option
                 * <br />
                 * <br />When this property is set to true SeachInput will be added to Header Toolbar.
                 * <br />To make this option work use fi.neomore.template.control.Column controls in columns aggregation with searchKey properties set.
                 * <br />Search will filter the list according to the configurations in columns aggregation.
                 * <br />If you want to change starting lenght of the search string, you can use liveSearchStartLength property to define starting length.
                 * <br />By default the InfoToolbar will be shown with basic information of the filtering.
                 * @name fi.neomore.template.control.Table#showSearch
                 */
				showSearch: {
					type: 'boolean',
					defaultValue: false
				},
				/**
                 * Defines control to show filtering info in InfoToolbar when using search
                 * @name fi.neomore.template.control.Table#showFilteringInfo
                 */
				showFilteringInfo: {
					type: 'boolean',
					defaultValue: true
				},
				/**
                 * Defines if the search should filter items with live change
                 * @name fi.neomore.template.control.Table#useLiveSearch
                 */
				useLiveSearch: {
					type: 'boolean',
					defaultValue: false
				},
				/**
                 * Defines if the custom sorting is in use.
                 * <br />
                 * <br />When this property is set to true the sorting logic in this control is not used.
                 * <br />You should use sortChange event to handle sorting in your controller instead.
                 * @name fi.neomore.template.control.Table#useCustomSorting
                 */
				useCustomSorting: {
					type: 'boolean',
					defaultValue: false
				},
				/**
                * Defines if the custom filtering on search is in use.
                * <br />
                * <br />When this property is set to true the filtering logic in this control is not used.
                * <br />You should use searchChange event to handle sorting in your controller instead.
                * @name fi.neomore.template.control.Table#useCustomFiltering
                */
				useCustomFiltering: {
					type: 'boolean',
					defaultValue: false
				},
				/**
                 * Defines at which point search filtering should start.
                 * @name fi.neomore.template.control.Table#liveSearchStartLength
                 */
				liveSearchStartLength: {
					type: 'int',
					defaultValue: 1
				},
				/**
                 * Defines the position of customHeaderContent.
                 * <br />Possible values: ['Right', 'Center'].
                 * @name fi.neomore.template.control.Table#customHeaderContentPosition
                 */
				customHeaderContentPosition: {
					type: 'string',
					defaultValue: 'Right'
				},
				/**
                 * Defines if the table popins are set automatically.
                 * <br />
                 * <br />When this property is set to true the table popins are set automatically
                 * on initialization and after personalizations have been changed.
                 * @name fi.neomore.template.control.Table#setTablePopins
                 */
				setTablePopins: {
					type: 'boolean',
					defaultValue: false
				}
			},
			aggregations: {
				/**
                 * Custom header content aggregation.
                 * <br />You can add custom content to your header toolbar using this aggregation.
                 * @name fi.neomore.template.control.Table#customHeaderContent
                 */
				customHeaderContent: {
					type: 'sap.ui.core.Control',
					multiple: true
				}
			},
			events: {
				/**
                 * Fired when the personalization has been changed.
                 * <br />Event will pass aColumns data of the personalization as a parameter.
                 * @event fi.neomore.template.control.Table#personalizationChange
                 * @property {array} aColumns - array of column details
                 */
				personalizationChange: {
					parameters: {
						aColumns: {
							type: 'array'
						}
					}
				},
				/**
                 * Fired when the sorting is confirmed.
                 * <br />Event will pass array of sortItems as a parameter.
                 * <br />sortItem has two properties: sortKey & descending.
                 * @event fi.neomore.template.control.Table#sortChange
                 * @property {array} sortItems - array of sort items
                 */
				sortChange: {
					parameters: {
						sortItems: {
							type: 'array'
						}
					}
				},
				/**
                 * Fired when search filtering is done.
                 * <br />Event will pass a value of the search input.
                 * @event fi.neomore.template.control.Table#searchChange
                 * @property {string} value - input value
                 */
				searchChange: {
					parameters: {
						value: {
							type: 'string'
						}
					}
				}
			}
		},

		/* ***************************** */
		/*  Lifecycle/Overrides          */
		/* ***************************** */

		init: function() {
			if (Table.prototype.init) {
				Table.prototype.init.call(this, arguments);
			}
		},

		destroy: function() {
			if (this._oTablePersoController) {
				this._oTablePersoController.destroy();
			}
			if (this._oSimpleSortDialog) {
				this._oSimpleSortDialog.destroy();
			}
			if (this._oMultiSortDialog) {
				this._oMultiSortDialog.destroy();
			}
			Table.prototype.destroy.call(this, arguments);
		},

		onBeforeRendering: function() {
			if (Table.prototype.onBeforeRendering) {
				Table.prototype.onBeforeRendering.call(this, arguments);
			}
			if (!this._oTablePersoController && this.getShowPersonalization()) {
				this._oTablePersoController = new TablePersoController({
					table: this,
					componentName: 'personalization',
					persoService: PersonalizationService
				});
				this._oTablePersoController.activate();
				this._oTablePersoController.attachPersonalizationsDone(this.onPersonalizationChanged.bind(this));
				this._oTablePersoController.getPersoService().setDefaultColumnData(this._createInitialColumnData());
				this.setPersonalizationData(this._aColumns);
			}
			var headerToolbar = this.getHeaderToolbar();
			if (!headerToolbar && !this.getHeaderText()) {
				var toolbar = this._createHeaderToolbar();
				this.setAggregation('headerToolbar', toolbar);
			} else {
				this._updateTotalCount();
			}
			if (this._bFirstLoad) {
				this._bFirstLoad = false;
				if (this.getSetTablePopins()) {
					this._setTablePopinColumns();
				}
			}
		},

		onAfterRendering: function() {
			if (Table.prototype.onAfterRendering) {
				Table.prototype.onAfterRendering.call(this, arguments);
			}
		},

		renderer: {},

		/* ***************************** */
		/*  Public functions             */
		/* ***************************** */

		/**
         * Function to set personalization to table.
         * @method
         * @name fi.neomore.template.control.Table#setPersonalizationData
         * @param {array} aColumnData - array of column data
         * @public
         */
		setPersonalizationData: function(aColumnData) {
			this._aColumns = aColumnData;
			if (this._oTablePersoController) {
				if ((aColumnData || []).length === 0) {
					this._oTablePersoController.getPersoService().resetPersData();
				} else {
					this._oTablePersoController.getPersoService().setPersData({
						_persoSchemaVersion: '1.0',
						aColumns: aColumnData
					});
				}
				this._oTablePersoController.applyPersonalizations(this);
			}
		},

		/**
         * Function to get current columns of the table.
         * @method
         * @name fi.neomore.template.control.Table#getPersonalizationColumns
         * @return {array} - array of column objects
         * @public
         */
		getPersonalizationColumns: function() {
			return this._aColumns;
		},

		/**
         * Function to get current sorters of the table.
         * @method
         * @name fi.neomore.template.control.Table#getSorters
         * @return {array} - array of object: {sortKey: *string*, descending: *boolean*}
         * @public
         */
		getSorters: function() {
			return this._aSorters;
		},

		/**
         * Function to set sorters to table.
         * @method
         * @name fi.neomore.template.control.Table#setSorters
         * @param {array} aSorters - array of object: {sortKey: *string*, descending: *boolean*}
         * @public
         */
		setSorters: function(aSorters) {
			this._aSorters = aSorters;
			this._sortItems(aSorters);
			if (this._oMultiSortDialog) {
				this._oMultiSortDialog.setSortingData(aSorters);
			}
		},

		/**
         * Function to set min screen widths object for table.
         * Object with key as a number after which the setting will be set for the column and
         * value as minScreenWidth value. Object keys should be in ascending order.
         * @method
         * @name fi.neomore.template.control.Table#setMinScreenWidthsObject
         * @param {object} oMinScreenWidths - object of min screen widths for example: {'2': 'Phone', '4': '800px'}
         * @public
         */
		setMinScreenWidthsObject: function(oMinScreenWidths) {
			this._minScreenWidths = oMinScreenWidths;
		},

		/**
         * Function to get min screen widths object for table.
         * @method
         * @name fi.neomore.template.control.Table#getMinScreenWidthsObject
         * @return {object} - object of min screen widths for example: {'2': 'Phone', '4': '800px'}
         * @public
         */
		getMinScreenWidthsObject: function() {
			if (!this._minScreenWidths) {
				return {
					'2': 'Phone',
					'4': 'Tablet',
					'6': 'Desktop'
				};
			}
			return this._minScreenWidths;
		},

		/**
         * Function to set additional filters to table.
         * @method
         * @name fi.neomore.template.control.Table#setAdditionalFilters
         * @param {sap.ui.model.Filter} oFilters - Filters as a sap.ui.model.Filter
         * @public
         */
		setAdditionalFilters: function(oFilters) {
			if (oFilters instanceof Filter) {
				this._additionalFilters = oFilters;
			} else {
				this._additionalFilters = null;
			}
			var sValue = '';
			if (this.getShowSearch()) {
				sValue = sap.ui.getCore().byId(this.getId() + '--' + this._sSearchInputId).getValue();
			}
			this._filterItems(sValue);
		},

		/* ***************************** */
		/*  Internal functions           */
		/* ***************************** */

		_createInitialColumnData: function() {
			return this.getColumns().map(function(column) {
				return {
					id: column.getId(),
					order: column.getOrder(),
					text: column.getHeader().getText(),
					visible: column.getVisible()
				};
			});
		},

		_createHeaderToolbar: function() {
			var toolbar = new Toolbar();
			if (this.getTitle()) {
				var titleText = this.getTitle();
				if (this.getShowTotalCount()) {
					var count = this.getCount() >= 0 ? this.getCount() : (this.getBinding('items') && this.getBinding('items').oList || []).length;
					titleText += ' (' + count + ')';
					this.attachUpdateFinished(this._updateTotalCount.bind(this));
				}
				var title = new Title({
					text: titleText
				});
				toolbar.addContent(title);
			}
			toolbar.addContent(new ToolbarSpacer());
			var customHeaderContent = this.getAggregation('customHeaderContent') || [];
			var customHeaderContentPosition = this.getCustomHeaderContentPosition();
			if (customHeaderContent.length && customHeaderContentPosition === 'Center') {
				customHeaderContent.forEach(function(control) {
					toolbar.addContent(control);
				});
			}
			if (this.getShowSearch()) {
				var searchInput = new SearchInput(this.getId() + '--' + this._sSearchInputId, {
					liveChange: this.onSearchLiveChange.bind(this),
					change: this.onSearchChange.bind(this),
					width: '15rem',
					selectOnFocus: false
				});
				toolbar.addContent(searchInput);
			}
			if (this.getShowSorting() || this.getShowMultiSorting()) {
				var filterButton = new Button({
					icon: 'sap-icon://sort',
					press: this.onOpenSortSetting.bind(this)
				});
				toolbar.addContent(filterButton);
			}
			if (this.getShowPersonalization()) {
				var persoButton = new Button({
					icon: 'sap-icon://action-settings',
					press: this.onOpenActionSettings.bind(this)
				});
				toolbar.addContent(persoButton);
			}
			if (customHeaderContent.length && customHeaderContentPosition === 'Right') {
				customHeaderContent.forEach(function(control) {
					toolbar.addContent(control);
				});
			}
			return toolbar;
		},

		_createInfoToolbar: function(sValue) {
			var toolbar = new Toolbar();
			var visibleCount = 0;
			(this.getVisibleItems() || []).map(function(item) {
				if (item.getId() && item.getId().indexOf(this.getId()) !== -1) {
					visibleCount++;
				}
			}.bind(this));
			var count = this.getCount() >= 0 ? this.getCount() : (this.getBinding('items') && this.getBinding('items').oList || []).length;
			toolbar.addContent(new Text({
				text: this.getModel('i18n').getResourceBundle().getText('CONTROL_TABLE_FILTERING_VALUES', [sValue]) + ' (' + visibleCount + '/' + count + ')'
			}));
			toolbar.addContent(new ToolbarSpacer());
			toolbar.addContent(new Icon({
				src: 'sap-icon://sys-cancel',
				color: 'white',
				press: this.onClearSearchPress.bind(this)
			}));
			return toolbar;
		},

		_createSimpleSortDialog: function() {
			this._oSimpleSortDialog = new ViewSettingsDialog({
				confirm: this.onConfirmSimpleSort.bind(this)
			});
			var aColumns = this.getColumns() || [];
			aColumns.map(function(column) {
				if (column.getProperty('sortKey')) {
					var sortItem = new ViewSettingsItem({
						text: column.getHeader().getText(),
						key: column.getProperty('sortKey')
					});
					this._oSimpleSortDialog.addSortItem(sortItem);
				}
			}.bind(this));
			this._oSimpleSortDialog.open();
		},

		_createMultiSortDialog: function() {
			var aColumns = this.getColumns() || [];
			var columns = [];
			aColumns.forEach(function(column) {
				if (column.getProperty('sortKey')) {
					columns.push({
						text: column.getHeader().getText(),
						sortKey: column.getProperty('sortKey')
					});
				}
			});
			this._oMultiSortDialog = new MultiSortDialog({
				sortChange: this.onMultiSortChange.bind(this)
			});
			this._oMultiSortDialog.setTableColumns(columns);
			this._oMultiSortDialog.setSortingData(this.getSorters());
			this._oMultiSortDialog.open();
		},

		_updateTotalCount: function() {
			if (this.getShowTotalCount()) {
				var count = this.getCount() >= 0 ? this.getCount() : (this.getBinding('items') && this.getBinding('items').oList || []).length;
				var titleText = this.getTitle() + ' (' + count + ')';
				if (this.getAggregation('headerToolbar')) {
					this.getAggregation('headerToolbar').getContent()[0].setText(titleText);
				}
			}
		},

		_filterItems: function(sValue) {
			var aFilters = [];
			if (sValue) {
				var aColumns = this.getColumns() || [];
				aColumns.forEach(function(column) {
					if (column.getSearchKey()) {
						if (column.getIsDate()) {
							column.getSearchKey().split(',').forEach(function(key) {
								aFilters.push(new Filter({
									path: key,
									test: function(oValue) {
										var dateValue = FormatterUtil.formatDateTime(new Date(oValue), column.getDateFormat());
										if (dateValue.indexOf(sValue) !== -1) {
											return true;
										}
										return false;
									}
								}));
							});
						} else {
							column.getSearchKey().split(',').forEach(function(key) {
								aFilters.push(new Filter(key, FilterOperator.Contains, sValue || ''));
							});
						}
					}
				});
			}
			// Check if we have search filters and make those
			// in to new OR Filter
			var bHasSearchFilters = aFilters.length;
			if (bHasSearchFilters) {
				aFilters = new Filter({
					filters: aFilters
				});
			}
			// If there are both search filters and additional filters
			// add them to single filter with AND true.
			// Otherwise set additional filters to aFilters or let
			// aFilters be as it is
			if (bHasSearchFilters && this._additionalFilters) {
				aFilters = new Filter({
					filters: [aFilters, this._additionalFilters],
					and: true
				});
			} else if (!bHasSearchFilters && this._additionalFilters) {
				aFilters = this._additionalFilters;
			}
			// Filter items binding
			this.getBinding('items').filter(aFilters);
			// Update info toolbar if filtering info should be shown
			if (this.getShowFilteringInfo()) {
				if (!Array.isArray(aFilters) && bHasSearchFilters) {
					this.setAggregation('infoToolbar', this._createInfoToolbar(sValue));
				} else {
					this.setAggregation('infoToolbar', null);
				}
			}
		},

		_getNumericStringKeys: function() {
			var aColumns = this.getColumns();
			var aNumeric = [];
			aColumns.forEach(function(column) {
				if (column.getIsNumeric()) {
					aNumeric.push(column.getSortKey());
				}
			});
			return aNumeric;
		},

		_sortItems: function(aSorters) {
			var aNumericKeys = this._getNumericStringKeys();
			var sorters = aSorters.map(function(sorter) {
				if (aNumericKeys.indexOf(sorter.sortKey) !== -1) {
					return new Sorter(sorter.sortKey, sorter.descending, null, function(a, b) {
						var aValue = Number(a) || 0;
						var bValue = Number(b) || 0;
						if (aValue < bValue) {
							return -1;
						} else if (aValue > bValue) {
							return 1;
						}
						return 0;
					});
				}
				return new Sorter(sorter.sortKey, sorter.descending);
			});
			this.getBinding('items').sort(sorters);
			this._aSorters = aSorters;
		},

		_setTablePopinColumns: function() {
			var columns = this.getColumns();
			var minScreenWidths = this.getMinScreenWidthsObject();
			var thresholds = Object.keys(minScreenWidths);
			var visibleCounter = 0;
			columns.sort(function(a, b) {
				if (a.getOrder() < b.getOrder()) {
					return -1;
				} else if (a.getOrder() > b.getOrder()) {
					return 1;
				}
				return 0;
			});
			columns.forEach(function(column) {
				if (column.getVisible()) {
					visibleCounter++;
					column.setDemandPopin(false);
					column.setMinScreenWidth();
				}
				if (visibleCounter >= Number(thresholds[0])) {
					column.setDemandPopin(true);
					var key = -1;
					thresholds.some(function(threshold) {
						if (Number(threshold) >= visibleCounter) {
							key = threshold;
							return true;
						}
						return false;
					});
					key = key !== -1 ? key : thresholds[thresholds.length - 1];
					column.setMinScreenWidth(minScreenWidths[key]);
				}
			});
		},

		/* ***************************** */
		/*  Event handling               */
		/* ***************************** */

		onMultiSortChange: function(oEvent) {
			var sortItems = oEvent.getParameter('sortItems') || [];
			if (!this.getUseCustomSorting()) {
				this._sortItems(sortItems);
			}
			this.fireSortChange({sortItems: sortItems});
		},

		onOpenActionSettings: function() {
			this._oTablePersoController.openDialog();
		},

		onOpenSortSetting: function() {
			if (this.getShowMultiSorting()) {
				if (!this._oMultiSortDialog) {
					this._createMultiSortDialog();
				} else {
					this._oMultiSortDialog.setSortingData(this.getSorters());
					this._oMultiSortDialog.open();
				}
			} else if (!this._oSimpleSortDialog) {
				this._createSimpleSortDialog();
			} else {
				this._oSimpleSortDialog.open();
			}
		},

		onConfirmSimpleSort: function(oEvent) {
			var sortKey = oEvent.getParameter('sortItem').getProperty('key');
			var descending = oEvent.getParameter('sortDescending');
			if (!this.getUseCustomSorting()) {
				this._sortItems([{
					sortKey: sortKey,
					descending: descending
				}]);
			}
			this.fireSortChange({sortItems: [{
				sortKey: sortKey,
				descending: descending
			}]});
		},

		onSearchLiveChange: function(oEvent) {
			if (this.getUseLiveSearch()) {
				var sValue = oEvent.getParameter('value') || '';
				this.fireSearchChange({value: sValue});
				if (sValue.length >= this.getLiveSearchStartLength()) {
					this._filterItems(sValue);
				} else {
					this._filterItems('');
				}
			}
		},

		onSearchChange: function(oEvent) {
			var sValue = oEvent.getParameter('value') || '';
			this.fireSearchChange({value: sValue});
			this._filterItems(sValue);
		},

		onClearSearchPress: function() {
			sap.ui.getCore().byId(this.getId() + '--' + this._sSearchInputId).setValue('');
			this._filterItems('');
		},

		onPersonalizationChanged: function() {
			this._oTablePersoController.getPersoService().getPersData().done(function(oData) {
				this._aColumns = oData.aColumns;
				if (this.getSetTablePopins()) {
					this._setTablePopinColumns();
				}
				this.firePersonalizationChange({
					aColumns: oData.aColumns
				});
			}.bind(this));
		}
	});

	return ControlTable;
});