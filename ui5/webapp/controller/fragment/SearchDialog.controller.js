/**
 * @module fi.neomore.controller.fragment.SearchDialog
 */
sap.ui.define([
	'fi/neomore/template/controller/CommonController',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
], function(CommonController, Filter, FilterOperator) {
	var helperDialogProperties;
	return CommonController.extend('fi.neomore.template.controller.fragment.SearchDialog', {

		/* =========================================================== */
		/* Search dialog API	 									   */
		/* =========================================================== */

		/**
		 * Combines setting up search dialog and API request for helper values
		 * @param {sap.ui.core.mvc.Controller} parent - Parent controller
		 * @param {sap.ui.xmlfragment} fragment - Fragment
		 * @param {object} oParameters - Search dialog parameters
		 * @param {string} oParameters.pathToModel - path to the model
		 * @param {string} oParameters.saveModelName - model where selected values should be saved
		 * @param {string} oParameters.listItemValueKey - key of the JSON item object value/id
		 * @param {string} oParameters.listItemDescriptionKey - key of the JSON item object description
		 * @param {string} oParameters.firstValueToSave - path where value/id key value should be saved
		 * @param {string} [oParameters.secondValueToSave] - path where description key value should be saved
		 * @param {string} [oParameters.configurationModelName] - name of the configuration model that stores dialog configurations, default value is ViewModel
		 * @param {string} [oParameters.service] - part of the uri, before path to service
		 * @param {string} [oParameters.pathToService] - path to the service
		 * @param {array} [oParameters.filters] - filters for service call
		 * @param {string} [oParameters.dialogTitle] - title of the dialog, default is 'Select value'
		 * @param {boolean} [oParameters.getValuesAfterEverySearch] - determines if call is made to back end after every search. This is handy for large data sets only. Default is false
		 * @param {boolean} [oParameters.multiSelect] - determines if dialog allows multiselection. Default is false
		 * @param {function} [oParameters.selectionDone] - function to run after selection has been done
		 */

		init: function(parent, fragment, oParameters) {
			this.parentView = parent;
			this.fragment = fragment;

			this.fragment.attachAfterClose(this.onAfterSearchDialogClose.bind(this));

			this.configureObjectForHelperDialog(oParameters);
			this.getHelperDialogValues(oParameters)
				.then(() => {
					this.changeSearchDialogTitle(oParameters.dialogTitle);
					this.bindSearchDialogToModel();
				})
				.then(this.openSearchDialog.bind(this));
		},

		configureObjectForHelperDialog: function(oParameters) {
			helperDialogProperties = oParameters;
			helperDialogProperties.configurationModelName = oParameters.configurationModelName || 'ViewModel';
		},

		getHelperDialogValues: function(oParameters) {
			return new Promise(function(resolve) {
				var readParameters = {
					filters: oParameters.filters || []
				};

				if (!oParameters.service || !oParameters.pathToService || oParameters.getValuesAfterEverySearch) {
					resolve();
				} else {
					this.setAppBusyMode();
					this.oDataUtil.read(oParameters.service, oParameters.pathToService, readParameters)
						.then((oData) => {
							this.handleHelperDialogValuesSuccess(oData);
							resolve();
						})
						.catch(this.openErrorMessagePopup.bind(this.parentView))
						.finally(this.setAppNotBusyMode);
				}
			}.bind(this));
		},

		handleHelperDialogValuesSuccess: function(helperDialogData) {
			var oConfigurationModel = this.parentView.getModel(helperDialogProperties.configurationModelName);
			oConfigurationModel.setProperty(helperDialogProperties.pathToModel, helperDialogData);
		},

		openSearchDialog: function() {
			this.fragment.open();
		},

		changeSearchDialogTitle: function(title) {
			this.getElement('searchDialogTitle')
				.setTitle(title || this.getResourceBundleText.call(this.parentView, 'SEARCH_DIALOG_DEFAULT_TITLE'));
		},

		bindSearchDialogToModel: function() {
			this.bindEventHandlers();
			this.bindFields();
		},

		bindFields: function() {
			var oDialogListElement = this.getElement('searchDialogList');
			var oDialogListItemElement = this.getElement('searchDialogListItem');
			if (helperDialogProperties.multiSelect) {
				this.handleMultiSelect();
			} else {
				this.handleSingleSelect();
			}
			this.getElement('searchDialogListValue')
				.bindText(helperDialogProperties.configurationModelName + '>' + helperDialogProperties.listItemValueKey);
			this.getElement('searchDialogListDescription')
				.bindText(helperDialogProperties.configurationModelName + '>' + helperDialogProperties.listItemDescriptionKey);
			oDialogListElement.bindItems({
				path: helperDialogProperties.configurationModelName + '>' + helperDialogProperties.pathToModel,
				template: oDialogListItemElement
			});
		},

		handleMultiSelect: function() {
			var oDialogListElement = this.getElement('searchDialogList');
			var oDialogListItemElement = this.getElement('searchDialogListItem');
			oDialogListItemElement.bindProperty('selected', {
				parts: [{
					path: helperDialogProperties.configurationModelName + '>' + helperDialogProperties.listItemValueKey
				}, {
					path: helperDialogProperties.saveModelName + '>/' + helperDialogProperties.firstValueToSave
				}],
				formatter: function(idOfItem, selectedItems) {
					return this
						.formatterUtil
						.selectedStateFormatter(helperDialogProperties.listItemValueKey, idOfItem, selectedItems);
				}.bind(this)
			});
			oDialogListElement.setMode('MultiSelect');
			oDialogListElement.setIncludeItemInSelection(true);
			this.getElement('selectSelectionButton').setVisible(true);
			this.getElement('selectAllCheckBoxBar').setVisible(true);

			// fire selection change to determine the initial state of select all
			this.onSearchDialogSelectionChange();
		},

		handleSingleSelect: function() {
			var oDialogListElement = this.getElement('searchDialogList');
			oDialogListElement.setMode('None');
			oDialogListElement.setIncludeItemInSelection(false);
			this.getElement('selectSelectionButton').setVisible(false);
			this.getElement('selectAllCheckBoxBar').setVisible(false);
		},

		bindEventHandlers: function() {
			var listItem = this.getElement('searchDialogListItem');
			if (helperDialogProperties.getValuesAfterEverySearch) {
				this.handleValuesAfterEverySearch();
			} else {
				this.handleValuesAtStart();
			}
			if (helperDialogProperties.itemPressHandler) {
				listItem.attachPress(helperDialogProperties.itemPressHandler);
			}
			this.getElement('selectSelectionButton').attachPress(this.onSelectSelectionPress, this);
			this.getElement('searchDialogCloseButton').attachPress(this.onSearchDialogCloseButtonPress, this);
		},

		handleValuesAfterEverySearch: function() {
			var oSearchBarElement = this.getElement('searchDialogSearchField');
			oSearchBarElement.attachSearch(this.onSearchDialogSearch, this);
			oSearchBarElement.detachLiveChange(this.onSearchDialogLiveChange, this);
		},

		handleValuesAtStart: function() {
			var oSearchBarElement = this.getElement('searchDialogSearchField');
			oSearchBarElement.detachSearch(this.onSearchDialogSearch, this);
			oSearchBarElement.attachLiveChange(this.onSearchDialogLiveChange, this);
		},

		onSearchDialogLiveChange: function() {
			this.applyFiltersToListBinding(
				helperDialogProperties.listItemValueKey,
				helperDialogProperties.listItemDescriptionKey
			);
		},

		onSearchDialogSearch: function() {
			var filterValue = this.getElement('searchDialogSearchField').getValue();
			var valueToFilter = /\d/.test(filterValue) ? helperDialogProperties.listItemValueKey : helperDialogProperties.listItemDescriptionKey;
			var filter = this.generateFilter(valueToFilter, [filterValue]);
			this.getSearchedValues(filter);
		},

		getSearchedValues: function(filter) {
			var parameters = {
				filters: filter
			};
			this.setAppBusyMode();
			this.oDataUtil.read(helperDialogProperties.service, helperDialogProperties.pathToService, parameters)
				.then(this.handleHelperDialogValuesSuccess.bind(this))
				.catch(this.openErrorMessagePopup.bind(this))
				.finally(this.setAppNotBusyMode);
		},

		applyFiltersToListBinding: function(sValueToFilter, sSecondValueToFilter) {
			var oDialogListBinding = this.getElement('searchDialogList').getBinding('items');
			var oSearchBarElement = this.getElement('searchDialogSearchField');
			var sFilterValue = oSearchBarElement.getValue();
			var oFirstFilter = new Filter(sValueToFilter, FilterOperator.Contains, sFilterValue);
			var oSecondFilter = new Filter(sSecondValueToFilter, FilterOperator.Contains, sFilterValue);
			var oCombinedFilter = new Filter([oFirstFilter, oSecondFilter]);
			oDialogListBinding.filter([oCombinedFilter], 'Application');
		},

		onSelectAllPress: function(selectEvent) {
			var list = this.getElement('searchDialogList');

			if (selectEvent.getParameter('selected')) {
				list.selectAll();
			} else {
				list.removeSelections(true);
			}
		},

		onSearchDialogSelectionChange: function() {
			setTimeout(function() {
				var list = this.getElement('searchDialogList');

				var allItemsAreSelectedFromList = list.getItems().length && list.getItems().length === list.getSelectedItems().length;

				this.getElement('selectAllCheckBox').setSelected(allItemsAreSelectedFromList);
			}.bind(this), 0);
		},

		onSearchDialogItemPress: function(oEvent) {
			var oSaveModel = this.parentView.getModel(helperDialogProperties.saveModelName);
			var selectedListItem = oEvent.getSource().getBindingContext(helperDialogProperties.configurationModelName).getObject();
			var selectedProperty = selectedListItem[helperDialogProperties.listItemValueKey];
			var selectedDescription = selectedListItem[helperDialogProperties.listItemDescriptionKey];
			oSaveModel.setProperty('/' + helperDialogProperties.firstValueToSave, selectedProperty);
			if (helperDialogProperties.secondValueToSave) {
				oSaveModel.setProperty('/' + helperDialogProperties.secondValueToSave, selectedDescription);
			}
			this.onSearchDialogCloseButtonPress();
			if (helperDialogProperties.selectionDone) {
				helperDialogProperties.selectionDone(selectedListItem);
			}
		},

		onSelectSelectionPress: function() {
			var selectedItemContexts = this.getElement('searchDialogList').getSelectedContexts(true);
			var selectedItems = selectedItemContexts.reduce(function(items, itemContext) {
				return items.concat(itemContext.getObject());
			}, []);
			this.parentView.getModel(helperDialogProperties.saveModelName).setProperty('/' + helperDialogProperties.firstValueToSave, selectedItems);
			this.onSearchDialogCloseButtonPress();
			if (helperDialogProperties.selectionDone) {
				helperDialogProperties.selectionDone(selectedItems);
			}
		},

		onSearchDialogCloseButtonPress: function() {
			this.fragment.close();
		},

		/**
		 * This event is fired when search dialog is closed. onSearchDialogCloseButtonPress function doesn't catch events
		 * where user exits without close button.
		 * Is used to reset state of dialog
		 */
		onAfterSearchDialogClose: function() {
			var oSearchBarElement = this.getElement('searchDialogSearchField');
			oSearchBarElement.setValue('');
			oSearchBarElement.detachSearch(this.onSearchDialogSearch, this);
			oSearchBarElement.detachLiveChange(this.onSearchDialogLiveChange, this);

			if (helperDialogProperties.itemPressHandler) {
				this.getElement('searchDialogListItem')
					.detachPress(helperDialogProperties.itemPressHandler);
			}
		},

		getElement: function(element) {
			return this.getFragmentElementById.call(this.parentView, 'SearchDialog', element);
		}
	});
});