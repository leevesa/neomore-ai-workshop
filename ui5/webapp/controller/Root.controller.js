sap.ui.define([
	'fi/neomore/template/controller/CommonController'
], function(CommonController) {
	return CommonController.extend('fi.neomore.template.controller.Root', {

		onInit: function() {
			this.rootControl = this.byId('rootControl');
			this.sessionId = new Date().getTime();
		},

		getSessionId: function() {
			return this.sessionId;
		},

		afterNavigate: function(navigationEvent) {
			this.getMyComponent().getEventBus().publish('app', 'afterNavigate', {
				fromView: navigationEvent.getParameter('from').sViewName,
				toView: navigationEvent.getParameter('to').sViewName,
				directionIsBackWards: navigationEvent.getParameter('isBackToPage')
			});
		},

		navigate: function(navigationEvent) {
			this.getMyComponent().getEventBus().publish('app', 'navigate', {
				fromView: navigationEvent.getParameter('from').sViewName,
				toView: navigationEvent.getParameter('to').sViewName,
				directionIsBackWards: navigationEvent.getParameter('isBackToPage')
			});
		}

	});
});