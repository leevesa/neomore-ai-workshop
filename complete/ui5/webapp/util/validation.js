sap.ui.define([
	'sap/ui/core/Control',
	'sap/ui/layout/form/FormContainer',
	'sap/ui/layout/form/FormElement',
	'sap/m/Input',
	'sap/m/Select',
	'sap/m/DatePicker'
], function(Control, FormContainer, FormElement, Input, Select, DatePicker) {
	return {
		controlValidationResults: [],

		validateControlType: function(oControl) {
			var isValid = true;
			var controlAggregation = null;
			var validProperty = this.getValidProperty(oControl);
			var validAggregation = this.getValidAggregation(oControl);
			if (this.shouldCheckConstraints(oControl, validProperty) && !this.controlPassesConstraints(oControl, validProperty)) {
				isValid = false;
			} else if (!this.shouldCheckConstraints(oControl, validProperty) && this.isVisible(oControl) && validAggregation) {
				this.hideControlError(oControl);
				controlAggregation = oControl.getAggregation(validAggregation);
				if (validAggregation && controlAggregation instanceof Array) {
					controlAggregation.map(function(element) {
						isValid = this.validateControlType(element);
					}.bind(this));
				} else if (validAggregation) {
					isValid = this.validateControlType(controlAggregation);
				}
			} else {
				this.hideControlError(oControl);
			}
			if (typeof isValid === 'function') {
				return isValid;
			} else if (isValid === false) {
				this.controlValidationResults.push(oControl);
			}
			return isValid;
		},

		getValidProperty: function(oControl) {
			return ['value', 'selectedKey', 'text'].filter(function(property) {
				return Boolean(oControl.getBinding(property));
			}).shift() || false;
		},

		getValidAggregation: function(oControl) {
			return ['items', 'content', 'form', 'formContainers', 'formElements', 'fields'].filter(function(aggregation) {
				return Boolean(oControl.getAggregation(aggregation));
			}).shift() || false;
		},

		shouldCheckConstraints: function(oControl, property) {
			return Boolean(this.isValidControl(oControl) &&
				this.isVisible(oControl) &&
				this.isEnabled(oControl) &&
				this.hasType(oControl, property) &&
				this.hasNoCustomDataFlag(oControl));
		},

		isValidControl: function(oControl) {
			return Boolean(oControl instanceof Object &&
				(oControl instanceof Control ||
					oControl instanceof FormContainer ||
					oControl instanceof FormElement));
		},

		isVisible: function(oControl) {
			return oControl.getVisible ? oControl.getVisible() : true;
		},

		isEnabled: function(oControl) {
			return Boolean(oControl.getEnabled && oControl.getEnabled());
		},

		hasType: function(oControl, property) {
			return Boolean(property && this.getType(oControl, property));
		},

		getType: function(oControl, property) {
			return this.getControlBinding(oControl, property) && this.getControlBinding(oControl, property).getType();
		},

		hasNoCustomDataFlag: function(oControl) {
			return Boolean(
				oControl.getCustomData() &&
				oControl.getCustomData().filter(function(customData) {
					return customData.getKey() === 'required' && !customData.getValue();
				}).length === 0
			);
		},

		controlPassesConstraints: function(oControl, validProperty) {
			var isValid = true;
			try {
				this.validateType(oControl, validProperty);
			} catch (validationError) {
				isValid = false;
				this.handleValidationError(oControl, validProperty, validationError);
			} finally {
				return isValid;
			}
		},

		validateType: function(oControl, property) {
			var oInternalValue = this.getType(oControl, property)
				.parseValue(this.getBindingValue(oControl, property), this.getControlBinding(oControl, property).sInternalType);
			this.getType(oControl, property)
				.validateValue(oInternalValue);
		},

		handleValidationError: function(oControl, property, validationError) {
			var controlBinding = this.getControlBinding(oControl, property);
			if (this.isInput(oControl)) {
				oControl.attachEventOnce('valueHelpRequest', this.hideControlError.bind(this, oControl));
				oControl.attachEventOnce('liveChange', this.hideControlError.bind(this, oControl));
			}
			if (this.isSelect(oControl) || this.isDatePicker(oControl)) {
				oControl.attachEventOnce('change', this.hideControlError.bind(this, oControl));
			}
			controlBinding.attachEventOnce('change', this.hideControlError.bind(this, oControl));
			setTimeout(this.showControlError.bind(this, oControl, validationError), 0);
		},

		showControlError: function(oControl, validationError) {
			if (oControl.setValueState) {
				oControl.setValueState('Error');
				oControl.setValueStateText(oControl.getValueStateText() ? oControl.getValueStateText() : validationError.message);
			} else if (oControl.addStyleClass) {
				oControl.addStyleClass('selectError');
			}
		},

		hideControlError: function(oControl) {
			if (oControl.setValueState) {
				oControl.setValueState('None');
			} else if (oControl.removeStyleClass) {
				oControl.removeStyleClass('selectError');
			}
		},

		isInput: function(element) {
			return Boolean(element instanceof Input);
		},

		isSelect: function(element) {
			return Boolean(element instanceof Select);
		},

		isDatePicker: function(element) {
			return Boolean(element instanceof DatePicker);
		},

		getControlBinding: function(oControl, property) {
			return this.getComplexBinding(oControl, property) || oControl.getBinding(property);
		},

		getComplexBinding: function(oControl, property) {
			return (oControl.getBinding(property).aBindings &&
				oControl.getBinding(property).aBindings.filter(function(binding) {
					return Boolean(binding.getType());
				}).shift()) || false;
		},

		getBindingValue: function(oControl, property) {
			return (this.getComplexBinding(oControl, property) &&
				this.getComplexBinding(oControl, property).getValue()) ||
				oControl.getProperty(property);
		}
	};
});