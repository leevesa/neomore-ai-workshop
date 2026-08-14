sap.ui.define([
	'sap/m/VariantManagement',
	'sap/m/VariantItem',
	'fi/neomore/template/util/compare',
	'sap/ui/model/json/JSONModel',
	'sap/ushell/Container',
	'sap/ui/core/mvc/View'
], function(VariantManagement, VariantItem, compareUtil, JSONModel, Container, View) {
	'use strict';

	/**
	 * Custom VariantManagement control.
	 *
	 * @param {string} [sId] Id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class VariantManagement
	 * The fi.neomore.template.control.VariantManagement control provides a set of features on top of standard sap.ui.comp.variants.VariantManagement. Which include:
     * <br /> - Event handling inside control
     * <br /> - Less coding to be done in the controller
     * <br /> - Easy way to get variants up and running
     * <br /> - Improved way of handling the state for modifications
	 * <br />
     * <br />VariantManagement is done and tested for cloud use.
	 *
	 * @extends sap.ui.comp.variants.VariantManagement
	 *
	 * @author Neomore Consulting Oy - Jyri Jaakkola
	 * @version 1.0.1
	 *
	 * @constructor
	 * @public
	 * @since 1.52
	 * @alias fi.neomore.template.control.VariantManagement
	 */

	var ControlVariantManagement = VariantManagement.extend('fi.neomore.template.control.VariantManagement', {
		// Internal variables to store some necessary variant management data
		_oModel: null,
		_oView: null,
		_noop: () => {},

		metadata: {
			/**
             * Extended metadata properties for fi.neomore.template.control.Table.
             * @name fi.neomore.template.control.VariantManagement#properties
             * @property {string} containerName - {@link fi.neomore.template.control.VariantManagement#containerName Container name}
             * @property {string} variantSetName - {@link fi.neomore.template.control.VariantManagement#variantSetName Variant set name}
             */
			properties: {
				/**
                 * Container name that will be used as a personalization container name.
                 * (sap.ushell.Container.getService('Personalization').getPersonalizationContainer('containerName'))
                 * @name fi.neomore.template.control.VariantManagement#containerName
                 */
				containerName: {
					type: 'string',
					defaultValue: ''
				},
				/**
                 * Variant set name that will be used inside personalization container.
                 * @name fi.neomore.template.control.VariantManagement#variantSetName
                 */
				variantSetName: {
					type: 'string',
					defaultValue: ''
				}
			},
			events: {
				/**
                 * Fired when the variant has been selected.
                 * <br />Event will pass object of the variant data as a parameter.
                 * @event fi.neomore.template.control.VariantManagement#selectedVariantChange
                 * @property {object} oData - object of variants data
                 */
				selectedVariantChange: {
					parameters: {
						oData: {
							type: 'object'
						}
					}
				},
				/**
                 * Fired when the default variant has been selected.
                 * <br />Event will not pass parameters.
                 * @event fi.neomore.template.control.VariantManagement#defaultVariantSelected
                 */
				defaultVariantSelected: {}
			}
		},

		/* ***************************** */
		/*  Lifecycle                    */
		/* ***************************** */

		init: function() {
			if (VariantManagement.prototype.init) {
				VariantManagement.prototype.init.call(this, arguments);
			}
			this._oModel = new JSONModel({
				Variants: [],
				SelectedVariant: {},
				CurrentData: {}
			});
			this.attachSelect(this._onSelectHandler.bind(this));
			this.attachSave(this._onSaveHandler.bind(this));
			this.attachManage(this._onManageHandler.bind(this));
		},

		onBeforeRendering: function() {
			if (VariantManagement.prototype.onBeforeRendering) {
				VariantManagement.prototype.onBeforeRendering.call(this, arguments);
			}
			this._setModel();
			var template = new VariantItem();
			template.bindProperty('text', {
				path: this.getContainerName() + '>VariantName'
			});
			template.bindProperty('key', {
				path: this.getContainerName() + '>VariantKey'
			});
			this.bindAggregation('variantItems', {
				path: this.getContainerName() + '>/Variants',
				template: template
			});
			if ((this._getModel().getProperty('/Variants') || []).length === 0) {
				this.getAllVariants(this._setVariantsToModel.bind(this), this._setSelectedVariant.bind(this), true);
			}
		},

		renderer: {},

		/* ***************************** */
		/*  Public functions             */
		/* ***************************** */

		setCurrentData: function(oCurrentData) {
			this._getModel().setProperty('/CurrentData', this._deepCopy(oCurrentData));
			this._checkForModifications();
		},

		/* ***************************** */
		/*  "Public" functions           */
		/*  Handled internally           */
		/* ***************************** */

		/**
		 * Get all variant
         * @method
         * @name fi.neomore.template.control.VariantManagement#getAllVariants
		 * @param {function} [fnCallback] - callback function that gets an array of found variants as parameter ({VariantKey, VariantName})
		 * @param {function} [fnDefaultCallback] - callback function that gets default variants data as parameter
		 * @param {boolean} [bSetAsDefault] - set variant as default variant
         * @public
		 */
		getAllVariants: function(fnCallback, fnDefaultCallback, bSetAsDefault) {
			fnCallback = fnCallback || this._noop;
			fnDefaultCallback = fnDefaultCallback || this._noop;
			var oPersonalizationVariantSet = {};
			var aExistingVariants = [];
			var aVariantKeysAndNames = [];
			var sDefaultVariantKey = '';

			if (Container) {
				this._oPersonalizationService = Container.getService('Personalization');
				this._oPersonalizationContainer = this._oPersonalizationService.getPersonalizationContainer(this.getContainerName());
				this._oPersonalizationContainer.fail(function() {
					fnCallback(aExistingVariants);
				});
				this._oPersonalizationContainer.done(function(oPersonalizationContainer) {
					if (!oPersonalizationContainer.containsVariantSet(this.getVariantSetName())) {
						oPersonalizationContainer.addVariantSet(this.getVariantSetName());
					}
					oPersonalizationVariantSet = oPersonalizationContainer.getVariantSet(this.getVariantSetName());
					aVariantKeysAndNames = oPersonalizationVariantSet.getVariantNamesAndKeys();
					for (var key in aVariantKeysAndNames) {
						if (aVariantKeysAndNames.hasOwnProperty(key)) {
							var oVariantItemObject = {};
							oVariantItemObject.VariantKey = aVariantKeysAndNames[key];
							oVariantItemObject.VariantName = key;
							aExistingVariants.push(oVariantItemObject);

							var oVariantItemIsDefault = oPersonalizationVariantSet.getVariant(aVariantKeysAndNames[key]).getItemValue('IsDefault') || '';
							if (oVariantItemIsDefault && bSetAsDefault) {
								sDefaultVariantKey = aVariantKeysAndNames[key];
							}
						}
					}
					if (sDefaultVariantKey) {
						this.setDefaultVariantKey(sDefaultVariantKey);
						// this.setInitialSelectionKey(sDefaultVariantKey);
						window.setTimeout(function() {
							this._setSelectionByKey(sDefaultVariantKey);
						}.bind(this), 0);
						this.getVariantFromKey(sDefaultVariantKey, fnDefaultCallback);
					} else if (bSetAsDefault) {
						this.fireDefaultVariantSelected();
					}
					fnCallback(aExistingVariants);
				}.bind(this));
			}
		},

		/**
		 * Saves the variant on save press
         * @method
         * @name fi.neomore.template.control.VariantManagement#saveVariant
		 * @param {object} oParameters - parameters object
		 *		@param {string} variantName - variant name
		 *		@param {object=} saveData - data to save to the variant
		 *		@param {boolean=} setAsDefault - set variant as default variant
		 *		@param {function=} success - callback function for save success
         *		@param {function=} fail - callback function for save fail
         * @public
		 */
		saveVariant: function(oParameters) {
			var sVariantName = oParameters.variantName || '';
			var oSaveData = oParameters.saveData || '';
			var bSetAsDefault = !!oParameters.setAsDefault;
			var fnSuccessHandler = oParameters.success || this._noop;
			var fnFailHandler = oParameters.fail || this._noop;
			if (this._oPersonalizationContainer) {
				this._oPersonalizationContainer.fail(fnFailHandler);
				this._oPersonalizationContainer.done(function(oPersonalizationContainer) {
					var oPersonalizationVariantSet = {};
					var oVariant = {};
					var sVariantKey = '';
					if (!(oPersonalizationContainer.containsVariantSet(this.getVariantSetName()))) {
						oPersonalizationContainer.addVariantSet(this.getVariantSetName());
					}
					oPersonalizationVariantSet = oPersonalizationContainer.getVariantSet(this.getVariantSetName());

					sVariantKey = oPersonalizationVariantSet.getVariantKeyByName(sVariantName);
					if (sVariantKey) {
						oVariant = oPersonalizationVariantSet.getVariant(sVariantKey);
					} else {
						oVariant = oPersonalizationVariantSet.addVariant(sVariantName);
					}
					if (oSaveData) {
						oVariant.setItemValue('IsDefault', bSetAsDefault ? 'X' : '');
						oVariant.setItemValue('Data', oSaveData);
					}
					if (bSetAsDefault) {
						this.checkIfDefaultVariantHasChanged(oVariant.getVariantKey());
					}
					oPersonalizationContainer.save()
						.fail(fnFailHandler)
						.done(function() {
							fnSuccessHandler(arguments);
							this.getAllVariants(this._setVariantsToModel.bind(this));
						}.bind(this));
				}.bind(this));
			}
		},

		/**
		 * Saves existing variant with key
         * @method
         * @name fi.neomore.template.control.VariantManagement#saveVariantWithKey
		 * @param {object} oParameters - parameters object
		 *		@param {string} variantKey - variant key
		 *		@param {string=} variantName - variant name
		 *		@param {object=} saveData - data to save to the variant
		 *		@param {boolean=} setAsDefault - set variant as default variant
		 *		@param {function=} success - callback function for save success
         *		@param {function=} fail - callback function for save fail
         * @public
		 */
		saveVariantWithKey: function(oParameters) {
			var sVariantKey = oParameters.variantKey || '';
			var sVariantName = oParameters.variantName || '';
			var oSaveData = oParameters.saveData || '';
			var bSetAsDefault = !!oParameters.setAsDefault;
			var fnSuccessHandler = oParameters.success || this._noop;
			var fnFailHandler = oParameters.fail || this._noop;
			if (this._oPersonalizationContainer) {
				this._oPersonalizationContainer.fail(fnFailHandler);
				this._oPersonalizationContainer.done(function(oPersonalizationContainer) {
					var oPersonalizationVariantSet = {};
					var oVariant = {};
					if (!(oPersonalizationContainer.containsVariantSet(this.getVariantSetName()))) {
						oPersonalizationContainer.addVariantSet(this.getVariantSetName());
					}
					oPersonalizationVariantSet = oPersonalizationContainer.getVariantSet(this.getVariantSetName());
					oVariant = oPersonalizationVariantSet.getVariant(sVariantKey);
					oVariant.setItemValue('IsDefault', bSetAsDefault ? 'X' : '');
					if (oSaveData) {
						oVariant.setItemValue('Data', oSaveData);
					}
					if (sVariantName) {
						oVariant._oVariantName = sVariantName;
					}
					oPersonalizationContainer.save()
						.fail(fnFailHandler)
						.done(function() {
							fnSuccessHandler(arguments);
							this.getAllVariants(this._setVariantsToModel.bind(this));
						}.bind(this));
				}.bind(this));
			}
		},

		/**
		 * Delete variants (manage variants)
         * @method
         * @name fi.neomore.template.control.VariantManagement#deleteVariants
		 * @param {array} aVariantKeys - array of variant keys to delete
		 * @param {function=} fnSuccessHandler - callback function for save success
		 * @param {function=} fnFailHandler - callback function for save fail
         * @public
		 */
		deleteVariants: function(aVariantKeys, fnSuccessHandler, fnFailHandler) {
			fnSuccessHandler = fnSuccessHandler || this._noop;
			fnFailHandler = fnFailHandler || this._noop;
			var oPersonalizationVariantSet = {};
			if (this._oPersonalizationContainer) {
				this._oPersonalizationContainer.fail(fnFailHandler);
				this._oPersonalizationContainer.done(function(oPersonalizationContainer) {
					if (!(oPersonalizationContainer.containsVariantSet(this.getVariantSetName()))) {
						oPersonalizationContainer.addVariantSet(this.getVariantSetName());
					}
					oPersonalizationVariantSet = oPersonalizationContainer.getVariantSet(this.getVariantSetName());
					for (var iCount = 0; iCount < aVariantKeys.length; iCount++) {
						if (aVariantKeys[iCount]) {
							oPersonalizationVariantSet.delVariant(aVariantKeys[iCount]);
						}
					}
					oPersonalizationContainer.save()
						.fail(fnFailHandler)
						.done(function() {
							fnSuccessHandler(arguments);
							this.getAllVariants(this._setVariantsToModel.bind(this));
						}.bind(this));
				}.bind(this));
			}
		},

		/**
		 * Rename variants
         * @method
         * @name fi.neomore.template.control.VariantManagement#renameVariants
		 * @param {array} aRenamedVariants - array of renamed variants ({key, name})
		 * @param {function=} fnSuccessHandler - callback function for save success
		 * @param {function=} fnFailHandler - callback function for save fail
         * @public
		 */
		renameVariants: function(aRenamedVariants, fnSuccessHandler, fnFailHandler) {
			for (var iCount = 0; iCount < aRenamedVariants.length; iCount++) {
				if (aRenamedVariants[iCount]) {
					this.saveVariantWithKey({
						variantKey: aRenamedVariants[iCount].key,
						variantName: aRenamedVariants[iCount].name,
						success: fnSuccessHandler,
						fail: fnFailHandler
					});
				}
			}
		},

		/**
		 * Change default variant
         * @method
         * @name fi.neomore.template.control.VariantManagement#changeDefaultVariant
		 * @param {string} oldKey - old default variant key
		 * @param {string} newKey - new default variant key
         * @public
		 */
		changeDefaultVariant: function(oldKey, newKey) {
			if (oldKey) {
				this.saveVariantWithKey({
					variantKey: oldKey
				});
			}
			if (newKey !== '' && newKey !== '*standard*') {
				this.saveVariantWithKey({
					variantKey: newKey,
					setAsDefault: true
				});
			}
		},

		/**
		 * Check wether default variant has changed or not
         * @method
         * @name fi.neomore.template.control.VariantManagement#checkIfDefaultVariantHasChanged
		 * @param {string} defaultVariantKey - new default variant key
         * @public
		 */
		checkIfDefaultVariantHasChanged: function(defaultVariantKey) {
			var oPersonalizationVariantSet = {};
			var aVariantKeysAndNames = [];
			var sDefaultVariantKey = '';
			var bDefaultChanged = false;

			if (Container) {
				this._oPersonalizationService = Container.getService('Personalization');
				this._oPersonalizationContainer = this._oPersonalizationService.getPersonalizationContainer(this.getContainerName());
				this._oPersonalizationContainer.fail(function() {});
				this._oPersonalizationContainer.done(function(oPersonalizationContainer) {
					if (!oPersonalizationContainer.containsVariantSet(this.getVariantSetName())) {
						oPersonalizationContainer.addVariantSet(this.getVariantSetName());
					}
					oPersonalizationVariantSet = oPersonalizationContainer.getVariantSet(this.getVariantSetName());
					aVariantKeysAndNames = oPersonalizationVariantSet.getVariantNamesAndKeys();
					for (var key in aVariantKeysAndNames) {
						if (aVariantKeysAndNames.hasOwnProperty(key)) {
							var oVariantItemIsDefault = oPersonalizationVariantSet.getVariant(aVariantKeysAndNames[key]).getItemValue('IsDefault') || '';
							if (oVariantItemIsDefault) {
								sDefaultVariantKey = aVariantKeysAndNames[key];
								if (sDefaultVariantKey !== defaultVariantKey) {
									this.changeDefaultVariant(sDefaultVariantKey, defaultVariantKey);
									bDefaultChanged = true;
								}
							}
						}
					}
					if (!bDefaultChanged) {
						this.changeDefaultVariant(null, defaultVariantKey);
					}
				}.bind(this));
			}
		},

		/**
		 * Get variant with variant key
         * @method
         * @name fi.neomore.template.control.VariantManagement#getVariantFromKey
		 * @param {string} sVariantKey - selected variant key
		 * @param {function} [fnCallBack] - callback function that gets variant data as parameter
		 * @param {function} [fnStandardCallBack] - callback function for "Standard"/"Default" selection
         * @public
		 */
		getVariantFromKey: function(sVariantKey, fnCallBack, fnStandardCallBack) {
			fnCallBack = fnCallBack || this._noop;
			fnStandardCallBack = fnStandardCallBack || this._noop;
			if (sVariantKey === '*standard*' || sVariantKey === '') {
				fnStandardCallBack();
				this.fireDefaultVariantSelected();
			} else {
				this._oPersonalizationContainer.fail(function() {});
				this._oPersonalizationContainer.done(function(oPersonalizationContainer) {
					var oPersonalizationVariantSet = {};
					if (!(oPersonalizationContainer.containsVariantSet(this.getVariantSetName()))) {
						oPersonalizationContainer.addVariantSet(this.getVariantSetName());
					}
					oPersonalizationVariantSet = oPersonalizationContainer.getVariantSet(this.getVariantSetName());
					var selectedVariant = oPersonalizationVariantSet.getVariant(sVariantKey);
					var variantData = selectedVariant.getItemValue('Data');
					this._setSelectedVariant(this._deepCopy(variantData));
					fnCallBack(this._deepCopy(variantData));
				}.bind(this));
			}
		},

		/* ***************************** */
		/*  Internal functions           */
		/* ***************************** */

		_setModel: function() {
			if (!this._oView) {
				/* eslint-disable-next-line consistent-this */
				var control = this;
				while (control && control.getParent) {
					control = control.getParent();
					if (control instanceof View) {
						this._oView = control;
						break;
					}
				}
				if (this._oView) {
					this._oView.setModel(this._oModel, this.getContainerName());
				}
			}
		},

		_getModel: function() {
			if (this._oView) {
				return this._oView.getModel(this.getContainerName());
			}
			return this._oModel;
		},

		_onSelectHandler: function(oEvent, sKey) {
			var sSelectedVariantKey = sKey || oEvent.getParameter('key');
			if (sSelectedVariantKey) {
				this.getVariantFromKey(sSelectedVariantKey);
			}
		},

		_onSaveHandler: function(oEvent) {
			var oData = this._getModel().getProperty('/CurrentData') || {};

			this.saveVariant({
				variantName: oEvent.getParameter('name'),
				saveData: oData,
				setAsDefault: oEvent.getParameter('def'),
				success: this._saveVariantSuccessHandler.bind(this),
				fail: this._saveVariantFailHandler.bind(this)
			});
		},

		_saveVariantSuccessHandler: function() {},

		_saveVariantFailHandler: function() {},

		_onManageHandler: function(oEvent) {
			var aDeletedVariants = oEvent.getParameter('deleted');
			var aRenamedVariants = oEvent.getParameter('renamed');
			var sNewDefaultVariantKey = oEvent.getParameter('def');
			if (aDeletedVariants.length > 0) {
				this.deleteVariants(aDeletedVariants, this._deleteVariantSuccessHandler.bind(this), this._deleteVariantFailHandler.bind(this));
			}
			if (aRenamedVariants.length > 0) {
				this.renameVariants(aRenamedVariants, this._saveVariantSuccessHandler.bind(this), this._saveVariantFailHandler.bind(this));
			}
			this.checkIfDefaultVariantHasChanged(sNewDefaultVariantKey);
			this.getAllVariants(this._setVariantsToModel.bind(this));
		},

		_deleteVariantFailHandler: function() {},

		_deleteVariantSuccessHandler: function() {},

		_setVariantsToModel: function(aVariants) {
			this._getModel().setProperty('/Variants', aVariants);
		},

		_setSelectedVariant: function(oSelectedVariant) {
			this._getModel().setProperty('/SelectedVariant', this._deepCopy(oSelectedVariant));
			this._getModel().setProperty('/CurrentData', this._deepCopy(oSelectedVariant));
			this.fireSelectedVariantChange(oSelectedVariant);
			this._checkForModifications();
		},

		_deepCopy: function(oData) {
			if (Array.isArray(oData)) {
				return oData.map(this._deepCopy.bind(this));
			} else if (oData instanceof Date) {
				oData = new Date(oData);
			} else if (typeof oData === 'object' && oData !== null) {
				oData = structuredClone(oData);
				var keys = Object.keys(oData);
				keys.map(function(key) {
					oData[key] = this._deepCopy(oData[key]);
				}.bind(this));
			}
			return oData;
		},

		_checkForModifications: function() {
			var oSelected = this._getModel().getProperty('/SelectedVariant') || {};
			// default handling has id field also, we don't want to compare it
			delete oSelected.id;
			var oCurrent = this._getModel().getProperty('/CurrentData') || {};
			if (compareUtil.deepCompare(oSelected, oCurrent)) {
				this.currentVariantSetModified(false);
			} else {
				this.currentVariantSetModified(true);
			}
		}

	});

	return ControlVariantManagement;
});