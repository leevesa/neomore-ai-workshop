sap.ui.define([], function() {
	'use strict';

	return {
		normalizeMessage: function(sMessage) {
			return (sMessage || '').trim();
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