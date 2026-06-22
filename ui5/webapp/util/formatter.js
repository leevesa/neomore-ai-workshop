/**
 * formatter
 * @module fi.neomore.template.util.formatter
 */
sap.ui.define([
	'sap/ui/core/format/DateFormat'
], function(DateFormat) {
	return {

		formatInputValue: function() {
			var values = [];
			if (arguments && arguments.length > 0) {
				values = Array.prototype.slice.call(arguments);
				values = values.filter(function(value) {
					// eslint-disable-next-line no-undefined
					return value !== '' && value !== undefined && value !== null;
				});
			}
			return values.join(' - ');
		},

		checkboxValueFormatter: function(value) {
			return !!value;
		},

		oDataErrorToErrorString: function(oDataErrEvt) {
			var errorString = '';
			if (oDataErrEvt) {
				// HTTP request failed
				errorString = oDataErrEvt.message || errorString;
				if (oDataErrEvt.responseText || oDataErrEvt.response && oDataErrEvt.response.body) {
					// get actual error message if available
					var errorBody = '';
					try {
						errorBody = JSON.parse(oDataErrEvt.responseText ? oDataErrEvt.responseText : oDataErrEvt.response.body);
					// eslint-disable-next-line no-unused-vars
					} catch (err) {
						errorBody = oDataErrEvt.responseText ? errorString : oDataErrEvt.response.body;
					}
					if (errorBody && errorBody.error && errorBody.error.message) {
						errorString = errorBody.error.message.value || errorString;
					}
				}
			}
			return errorString;
		},

		/**
		 * Format javascript date object to text string
		 * @param  {Date} dateTime javascript date object
		 * @param  {string} customFormat   default: 'dd.MM.yyyy'
		 * @return {string} formatted date string
		 */
		formatDateTime: function(dateTime, customFormat) {
			var formattedDateTime = '';
			if (dateTime) {
				var dateFormat = DateFormat.getDateTimeInstance({
					pattern: customFormat || 'dd.MM.yyyy'
				});
				formattedDateTime = dateFormat.format(dateTime);
			}

			return formattedDateTime;
		},

		/**
		 * Format EDM.Time to text string
		 * @param  {object} time Edm.Time object
		 * @param  {string} customFormat default: 'HH.mm'
		 * @return {string} formatted time string
		 */
		formatTime: function(time, customFormat) {
			var formattedTime = '';
			if (time) {
				var timeFormat = DateFormat.getTimeInstance({
					pattern: customFormat || 'HH:mm'
				});
				var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
				formattedTime = timeFormat.format(new Date(time.ms + TZOffsetMs));
			}

			return formattedTime;
		},

		selectedStateFormatter: function(itemKey, idOfItem, selectedItems) {
			selectedItems = selectedItems || [];
			return !!(selectedItems.filter(function(itemObject) {
				return itemObject[itemKey] === idOfItem;
			}).length);
		}
	};
});