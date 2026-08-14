sap.ui.define([
	'sap/ui/core/util/MockServer'
], function(MockServer) {
	'use strict';
	return {
		init: function() {
			var aMockServers = ['TEMPLATE_SERVICE'];

			aMockServers.forEach(function(sService) {
				this._initMockServerWithServiceName(sService);
			}.bind(this));
		},

		_initMockServerWithServiceName: function(sService) {
			var oMockServer = new MockServer({
				rootUri: sap.ui.require.toUrl('fi/neomore/template') + '/sap/opu/odata/sap/' + sService + '/'
			});
			var oUriParameters = new URLSearchParams(window.location.search);

			MockServer.config({
				autoRespond: true,
				autoRespondAfter: oUriParameters.get('serverDelay') || 500
			});

			var sPath = sap.ui.require.toUrl('fi/neomore/template/test/localService');
			oMockServer.simulate(sPath + '/' + sService + '.xml', {
				'sMockdataBaseUrl': sPath + '/mockdata/' + sService,
				'bGenerateMissingMockData': true
			});

			oMockServer.start();
		}
	};
});