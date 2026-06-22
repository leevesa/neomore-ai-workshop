sap.ui.define([
	'sap/ui/base/Object',
	'fi/neomore/template/model/models',
	'sap/ushell/Container',
	'sap/ui/core/library',
	'fi/neomore/template/model/Helpers'
], function(Object, models, Container, sapUiCoreLibrary, HelpersModel) {
	'use strict';

	const { ValueState } = sapUiCoreLibrary;

	return Object.extend('fi.neomore.template.controller.Application', {

		constructor: function(component) {
			this.component = component;
		},

		init: function() {
			this.component.setModel(models.createDeviceModel(), 'Device');
			this.component.setModel(new HelpersModel(), 'Helpers');
			this.component.getModel('Helpers').loadHelpers();

			this.component.attachParseError(this.showElementError);
			this.component.attachValidationError(this.showElementError);
			this.component.attachValidationSuccess(this.hideElementError);
		},

		showElementError: function(oEvent) {
			var element = oEvent.getSource();
			if (element.setValueState) {
				element.setValueState(ValueState.Error);
			} else {
				element.addStyleClass('selectError');
			}
		},

		hideElementError: function(oEvent) {
			var element = oEvent.getSource();
			if (element.setValueState) {
				element.setValueState(ValueState.None);
			} else {
				element.removeStyleClass('selectError');
			}
		},

		getNavigationIntent: function() {
			if (Container) {
				var urlParser = Container.getService('URLParsing');
				return urlParser.parseShellHash(urlParser.getHash(window.location.href)).action;
			}
			return '';
		}
	});
});