sap.ui.define([
	'sap/m/MessageBox',
	'sap/m/Dialog',
	'sap/m/Button',
	'sap/m/Text'
], function(MessageBox, Dialog, Button, Text) {
	return {
		show: function(parameters) {
			if (parameters.type === 'Confirm') {
				this.openConfirmationDialog(parameters);
			} else {
				this.openMessageBox(parameters);
			}
		},

		openMessageBox: function(parameters) {
			var parametersObject = {
				title: parameters.title || '',
				icon: this.getIcon(parameters.type),
				initialFocus: parameters.initialFocus || null,
				onClose: parameters.onClose || null,
				actions: parameters.actions || MessageBox.Action.OK
			};
			if (parameters.details) {
				parametersObject.details = parameters.details;
			}
			MessageBox.show(parameters.message || '', parametersObject);
		},

		getIcon: function(messageBoxType) {
			return {
				Info: MessageBox.Icon.INFORMATION,
				Success: MessageBox.Icon.SUCCESS,
				Error: MessageBox.Icon.ERROR,
				Warning: MessageBox.Icon.WARNING
			}[messageBoxType] || MessageBox.Icon.NONE;
		},

		openConfirmationDialog: function(parameters) {
			parameters.actions = parameters.actions || {
				beginButton: {},
				endButton: {}
			};
			var dialog = new Dialog({
				title: parameters.title || '',
				type: 'Message',
				content: new Text({
					text: parameters.message
				}),
				endButton: new Button({
					text: parameters.actions.endButton.text || 'Cancel',
					type: parameters.actions.endButton.type || 'Default',
					press: function() {
						dialog.close();
						if (parameters.onClose) {
							parameters.onClose();
						}
					}
				}),
				beginButton: new Button({
					text: parameters.actions.beginButton.text || 'Ok',
					type: parameters.actions.beginButton.type || 'Accept',
					press: function() {
						dialog.close();
						if (parameters.onConfirm) {
							parameters.onConfirm();
						}
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});

			dialog.open();
		}
	};
});