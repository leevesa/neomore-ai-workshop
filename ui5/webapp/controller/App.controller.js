sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/ui/core/Fragment',
	'sap/m/MessageToast',
	'sap/m/MessageBox'
], function (Controller, JSONModel, Fragment, MessageToast, MessageBox) {
	'use strict';

	const STORAGE_KEY = 'workshop.chat.participant';
	const HEARTBEAT_MS = 20000;
	const FEED_POLL_MS = 4000;

	return Controller.extend('fi.neomore.template.controller.App', {

		onInit: function () {
			this._bundle = this.getOwnerComponent().getModel('i18n').getResourceBundle();

			this._viewModel = new JSONModel({
				registered: false,
				busy: false,
				displayName: '',
				initials: '',
				participantId: null,
				avatarUrl: null,
				pendingAvatar: null,
				newMessage: ''
			});
			this.getView().setModel(this._viewModel, 'view');

			this._bindMessageList();
			this._startHeartbeat();
			this._startFeedPolling();

			const stored = this._readStoredParticipant();
			if (stored && stored.participantId) {
				this._applyRegistered(stored.participantId, stored.displayName);
			} else {
				this._openRegisterDialog();
			}
		},

		onExit: function () {
			if (this._heartbeatTimer) {
				clearInterval(this._heartbeatTimer);
			}
			if (this._feedTimer) {
				clearInterval(this._feedTimer);
			}
			if (this._registerDialog) {
				this._registerDialog.destroy();
			}
		},

		// --- message list ------------------------------------------------------

		_bindMessageList: function () {
			// The list binding (path, filter and sorter) is declared in the view.
			// Nothing to do here at the moment; kept for clarity/extension.
		},

		_refreshMessages: function () {
			const oBinding = this.byId('messageList').getBinding('items');
			if (oBinding) {
				oBinding.refresh();
			}
		},

		// --- registration ------------------------------------------------------

		_openRegisterDialog: function () {
			const fnOpen = (oDialog) => {
				this._registerDialog = oDialog;
				oDialog.open();
			};
			if (this._registerDialog) {
				return fnOpen(this._registerDialog);
			}
			Fragment.load({
				id: this.getView().getId(),
				name: 'fi.neomore.template.view.fragment.RegisterDialog',
				controller: this
			}).then((oDialog) => {
				this.getView().addDependent(oDialog);
				fnOpen(oDialog);
			});
		},

		onAvatarSelected: function (oEvent) {
			const oFile = oEvent.getParameter('files') && oEvent.getParameter('files')[0];
			if (!oFile) {
				return;
			}
			const oReader = new FileReader();
			oReader.onload = (e) => {
				this._pendingAvatarBytes = e.target.result; // data URL
				this._viewModel.setProperty('/pendingAvatar', e.target.result);
			};
			oReader.readAsDataURL(oFile);
		},

		onJoin: function () {
			const sName = (this._viewModel.getProperty('/displayName') || '').trim();
			if (!sName) {
				MessageToast.show(this._bundle.getText('ERROR_NAME_REQUIRED'));
				return;
			}
			this._viewModel.setProperty('/busy', true);

			this._invokeAction('/register(...)', { displayName: sName })
				.then((oResult) => {
					const sPid = oResult.participantId;
					return this._maybeUploadAvatar().then(() => sPid);
				})
				.then((sPid) => {
					this._persistParticipant(sPid, sName);
					this._applyRegistered(sPid, sName);
					if (this._registerDialog) {
						this._registerDialog.close();
					}
				})
				.catch((err) => {
					MessageBox.error(this._bundle.getText('ERROR_REGISTER_FAILED', [this._errorText(err)]));
				})
				.finally(() => {
					this._viewModel.setProperty('/busy', false);
				});
		},

		onRegisterEscape: function (oPromise) {
			// Registration is mandatory, so block the escape/close gesture.
			oPromise.reject();
		},

		_maybeUploadAvatar: function () {
			const sDataUrl = this._pendingAvatarBytes;
			if (!sDataUrl) {
				return Promise.resolve();
			}
			const sBase64 = sDataUrl.substring(sDataUrl.indexOf(',') + 1);
			return this._invokeAction('/uploadAvatar(...)', { image: sBase64 })
				.then(() => {
					this._avatarUploaded = true;
				});
		},

		_applyRegistered: function (sParticipantId, sDisplayName) {
			this._viewModel.setProperty('/registered', true);
			this._viewModel.setProperty('/participantId', sParticipantId);
			this._viewModel.setProperty('/displayName', sDisplayName);
			this._viewModel.setProperty('/initials', this.formatInitials(sDisplayName));
			this._viewModel.setProperty('/avatarUrl', this._avatarUrl(sParticipantId));
			this._refreshMessages();
		},

		// --- sending -----------------------------------------------------------

		onSend: function () {
			const sMessage = (this._viewModel.getProperty('/newMessage') || '').trim();
			if (!sMessage) {
				return;
			}
			this._invokeAction('/sendChatMessage(...)', { message: sMessage })
				.then(() => {
					this._viewModel.setProperty('/newMessage', '');
					this._refreshMessages();
				})
				.catch((err) => {
					MessageBox.error(this._bundle.getText('ERROR_SEND_FAILED', [this._errorText(err)]));
				});
		},

		// --- background pings --------------------------------------------------

		_startHeartbeat: function () {
			const fnPing = () => {
				this._invokeAction('/heartbeat(...)', {}).catch(() => { /* ignore */ });
			};
			this._heartbeatTimer = setInterval(fnPing, HEARTBEAT_MS);
		},

		_startFeedPolling: function () {
			this._feedTimer = setInterval(() => this._refreshMessages(), FEED_POLL_MS);
		},

		// --- helpers -----------------------------------------------------------

		_invokeAction: function (sPath, mParams) {
			const oModel = this.getView().getModel();
			const oContext = oModel.bindContext(sPath);
			Object.keys(mParams || {}).forEach((sKey) => {
				oContext.setParameter(sKey, mParams[sKey]);
			});
			// `invoke()` was introduced in newer UI5; older runtimes use `execute()`.
			const fnRun = oContext.invoke || oContext.execute;
			return fnRun.call(oContext).then(() => {
				const oBound = oContext.getBoundContext();
				return oBound ? oBound.getObject() : {};
			});
		},

		formatAvatarUrl: function (sParticipantId) {
			return this._avatarUrl(sParticipantId);
		},

		formatInitials: function (sName) {
			if (!sName) {
				return '';
			}
			return sName.trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase()).slice(0, 2).join('');
		},

		_avatarUrl: function (sParticipantId) {
			if (!sParticipantId) {
				return undefined;
			}
			return "/workshop-hub/Avatars('" + encodeURIComponent(sParticipantId) + "')/data";
		},

		_readStoredParticipant: function () {
			try {
				return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY));
			} catch (e) {
				return null;
			}
		},

		_persistParticipant: function (sParticipantId, sDisplayName) {
			window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
				participantId: sParticipantId,
				displayName: sDisplayName
			}));
		},

		_errorText: function (err) {
			if (err && err.error && err.error.message) {
				return err.error.message;
			}
			return (err && err.message) || String(err);
		}
	});
});
