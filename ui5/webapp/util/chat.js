sap.ui.define([], function() {
	'use strict';

	return {
		normalizeMessage: function(sMessage) {
			// TODO(workshop): Preserve line breaks from the TextArea to the Hub.
			return (sMessage || '').trim().replace(/\r?\n|\r/g, ' ');
		},

		parseMetadata: function(vMetadata) {
			if (!vMetadata) {
				return {};
			}
			if (typeof vMetadata === 'object') {
				return vMetadata;
			}
			try {
				const oMetadata = JSON.parse(vMetadata);
				return oMetadata && typeof oMetadata === 'object' ? oMetadata : {};
			} catch {
				return {};
			}
		},

		messageParameters: function(sMessage, vReplyToEventId) {
			const mParameters = { message: this.normalizeMessage(sMessage) };
			if (vReplyToEventId !== null && typeof vReplyToEventId !== 'undefined') {
				mParameters.replyToEventId = vReplyToEventId;
			}
			return mParameters;
		}
	};
});