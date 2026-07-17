sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/ui/core/Fragment',
	'sap/m/MessageToast',
	'sap/m/MessageBox'
], function(Controller, JSONModel, Fragment, MessageToast, MessageBox) {
	'use strict';

	const STORAGE_KEY = 'workshop.chat.participant';
	const PASSWORD_KEY = 'workshop.chat.password';
	const PASSWORD_HEADER = 'X-Workshop-Password';
	const FEED_POLL_MS = 4000;

	return Controller.extend('fi.neomore.template.controller.App', {

		onInit: function() {
			this._bundle = this.getOwnerComponent().getModel('i18n').getResourceBundle();
			this._isEditingProfile = false;

			this._viewModel = new JSONModel({
				registered: false,
				busy: false,
				displayName: '',
				nameLocked: false,
				initials: '',
				participantId: null,
				avatarUrl: null,
				pendingAvatar: null,
				password: '',
				newMessage: ''
			});
			this.getView().setModel(this._viewModel, 'view');

			// Restore and apply the workshop password (sent as a header on every hub
			// call) before any request fires.
			this._applyPassword(this._readStoredPassword());

			this._startFeedPolling();

			const stored = this._readStoredParticipant();
			if (stored && stored.displayName) {
				this._viewModel.setProperty('/displayName', stored.displayName);
				this._viewModel.setProperty('/nameLocked', true);
			}
			if (stored && stored.participantId) {
				this._applyRegistered(stored.participantId, stored.displayName);
			} else {
				this._openRegisterDialog();
			}
		},

		onExit: function() {
			if (this._feedTimer) {
				clearInterval(this._feedTimer);
			}
			if (this._registerDialog) {
				this._registerDialog.destroy();
			}
		},

		// --- message list ------------------------------------------------------

		_refreshMessages: function() {
			const oBinding = this.byId('messageList').getBinding('items');
			if (oBinding) {
				oBinding.refresh();
			}
		},

		// --- registration ------------------------------------------------------

		_openRegisterDialog: function() {
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

		onAvatarSelected: function(oEvent) {
			const oFile = oEvent.getParameter('files') && oEvent.getParameter('files')[0];
			if (!oFile) {
				return;
			}

			this._fileToDataUrl(oFile)
				.then((sDataUrl) => {
					return this._normalizeAvatarImage(sDataUrl);
				})
				.then((sDataUrl) => {
					this._pendingAvatarBytes = sDataUrl;
					this._viewModel.setProperty('/pendingAvatar', sDataUrl);
				})
				.catch((err) => {
					MessageBox.error(this._bundle.getText('ERROR_AVATAR_FAILED', [this._errorText(err)]));
				});
		},

		onReopenRegistration: function() {
			this._isEditingProfile = true;
			this._viewModel.setProperty('/busy', false);
			this._openRegisterDialog();
		},

		onJoin: function() {
			const sName = (this._viewModel.getProperty('/displayName') || '').trim();
			if (!sName) {
				MessageToast.show(this._bundle.getText('ERROR_NAME_REQUIRED'));
				return;
			}
			this._viewModel.setProperty('/busy', true);

			const sPassword = (this._viewModel.getProperty('/password') || '').trim();
			// Apply and persist the password header before any hub write fires so
			// register/avatar/chat calls carry it against a protected hub.
			this._applyPassword(sPassword).then(() => {
				this._persistPassword(sPassword);

				if (this._isEditingProfile) {
					return this._maybeUploadAvatar()
						.then(() => {
							const sPid = this._viewModel.getProperty('/participantId');
							this._persistParticipant(sPid, sName);
							this._applyRegistered(sPid, sName);
							if (this._registerDialog) {
								this._registerDialog.close();
							}
							this._pendingAvatarBytes = null;
							this._viewModel.setProperty('/pendingAvatar', null);
						})
						.catch((err) => {
							MessageBox.error(this._bundle.getText('ERROR_AVATAR_FAILED', [this._errorText(err)]));
						})
						.finally(() => {
							this._isEditingProfile = false;
							this._viewModel.setProperty('/busy', false);
						});
				}

				return this._invokeAction('/register(...)', { displayName: sName })
					.then((oResult) => {
						const sPid = oResult.participantId;
						return this._maybeUploadAvatar().then(() => {
							return sPid;
						});
					})
					.then((sPid) => {
						this._persistParticipant(sPid, sName);
						this._applyRegistered(sPid, sName);
						if (this._registerDialog) {
							this._registerDialog.close();
						}
						this._pendingAvatarBytes = null;
						this._viewModel.setProperty('/pendingAvatar', null);
					})
					.catch((err) => {
						MessageBox.error(this._bundle.getText('ERROR_REGISTER_FAILED', [this._errorText(err)]));
					})
					.finally(() => {
						this._isEditingProfile = false;
						this._viewModel.setProperty('/busy', false);
					});
			});
		},

		onRegisterEscape: function(oPromise) {
			if (this._viewModel.getProperty('/registered')) {
				this._isEditingProfile = false;
				oPromise.resolve();
				return;
			}
			// Registration is mandatory before first join, so block the escape/close gesture.
			oPromise.reject();
		},

		_maybeUploadAvatar: function() {
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

		_applyRegistered: function(sParticipantId, sDisplayName) {
			this._viewModel.setProperty('/registered', true);
			this._viewModel.setProperty('/participantId', sParticipantId);
			this._viewModel.setProperty('/displayName', sDisplayName);
			this._viewModel.setProperty('/nameLocked', Boolean(sDisplayName));
			this._viewModel.setProperty('/initials', this.formatInitials(sDisplayName));
			this._viewModel.setProperty('/avatarUrl', this._avatarUrl(sParticipantId));
			this._refreshMessages();
		},

		// --- sending -----------------------------------------------------------

		onSend: function() {
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

		// --- presence ----------------------------------------------------------

		onHeartbeat: function() {
			this._invokeAction('/heartbeat(...)', {})
				.then(() => {
					MessageToast.show(this._bundle.getText('HEARTBEAT_SENT'));
				})
				.catch((err) => {
					MessageBox.error(this._bundle.getText('ERROR_HEARTBEAT_FAILED', [this._errorText(err)]));
				});
		},

		_startFeedPolling: function() {
			this._feedTimer = setInterval(() => {
				return this._refreshMessages();
			}, FEED_POLL_MS);
		},

		// --- helpers -----------------------------------------------------------

		_invokeAction: function(sPath, mParams) {
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

		formatAvatarUrl: function(sParticipantId) {
			return this._avatarUrl(sParticipantId);
		},

		formatAvatarPreviewSrc: function(sPendingAvatar, sAvatarUrl) {
			return sPendingAvatar || sAvatarUrl || '';
		},

		formatHasAvatarPreview: function(sPendingAvatar, sAvatarUrl) {
			return Boolean(sPendingAvatar || sAvatarUrl);
		},

		formatShowAvatarPlaceholder: function(sPendingAvatar, sAvatarUrl) {
			return !sPendingAvatar && !sAvatarUrl;
		},

		formatInitials: function(sName) {
			if (!sName) {
				return '';
			}
			return sName.trim().split(/\s+/).map((w) => {
				return w.charAt(0).toUpperCase();
			}).slice(0, 2).join('');
		},

		_avatarUrl: function(sParticipantId) {
			if (!sParticipantId) {
				return null;
			}
			return "/workshop-hub/Avatars('" + encodeURIComponent(sParticipantId) + "')/data";
		},

		_fileToDataUrl: function(oFile) {
			return new Promise((resolve, reject) => {
				const oReader = new FileReader();
				oReader.onload = (e) =>	{
					resolve(e.target.result);
				};
				oReader.onerror = () => {
					reject(new Error('Failed to read image file'));
				};
				oReader.readAsDataURL(oFile);
			});
		},

		_normalizeAvatarImage: function(sDataUrl) {
			const MAX_EDGE = 512;
			const JPEG_QUALITY = 0.82;
			return new Promise((resolve, reject) => {
				const oImage = new Image();
				oImage.onload = () => {
					const iSourceWidth = oImage.naturalWidth || oImage.width;
					const iSourceHeight = oImage.naturalHeight || oImage.height;
					const fScale = Math.min(1, MAX_EDGE / Math.max(iSourceWidth, iSourceHeight));
					const iWidth = Math.max(1, Math.round(iSourceWidth * fScale));
					const iHeight = Math.max(1, Math.round(iSourceHeight * fScale));

					const oCanvas = document.createElement('canvas');
					oCanvas.width = iWidth;
					oCanvas.height = iHeight;
					const oCtx = oCanvas.getContext('2d');
					if (!oCtx) {
						reject(new Error('Canvas is not available'));
						return;
					}

					oCtx.drawImage(oImage, 0, 0, iWidth, iHeight);
					resolve(oCanvas.toDataURL('image/jpeg', JPEG_QUALITY));
				};
				oImage.onerror = () => {
					reject(new Error('Invalid image data'));
				};
				oImage.src = sDataUrl;
			});
		},

		_readStoredParticipant: function() {
			try {
				return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY));
			} catch (e) {
				return null;
			}
		},

		_persistParticipant: function(sParticipantId, sDisplayName) {
			window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
				participantId: sParticipantId,
				displayName: sDisplayName
			}));
		},

		// --- workshop password -------------------------------------------------
		//
		// WORKSHOP CODE — DO NOT COPY TO PRODUCTION.
		// This is a deliberately simple shared-secret scheme for the workshop: a
		// single password is typed in the browser, kept in sessionStorage, and sent
		// as a plain header on every request. It is not a real authentication
		// mechanism. For production use proper auth (e.g. OAuth2/OIDC, XSUAA,
		// per-user identity, tokens with expiry) instead of a shared password.

		/**
		 * Apply the workshop password as the {@code X-Workshop-Password} header on
		 * every OData request to the hub. Resolves once the header is in effect.
		 * The OData V4 model rejects header changes while requests are open, so we
		 * retry until the model is idle.
		 * @param {string} sPassword The password to send (empty clears the header).
		 * @returns {Promise} Resolved when the header has been applied.
		 */
		_applyPassword: function(sPassword) {
			const sValue = (sPassword || '').trim();
			this._viewModel.setProperty('/password', sValue);
			const oModel = this.getView().getModel();
			return new Promise((resolve) => {
				if (!oModel || typeof oModel.changeHttpHeaders !== 'function') {
					resolve();
					return;
				}
				const mHeaders = {};
				mHeaders[PASSWORD_HEADER] = sValue;
				const fnApply = () => {
					try {
						oModel.changeHttpHeaders(mHeaders);
						resolve();
					} catch (e) {
						// Requests in flight — headers can only change when the model
						// is idle, so retry shortly.
						setTimeout(fnApply, 200);
					}
				};
				fnApply();
			});
		},

		_readStoredPassword: function() {
			try {
				return window.sessionStorage.getItem(PASSWORD_KEY) || '';
			} catch (e) {
				return '';
			}
		},

		_persistPassword: function(sPassword) {
			try {
				if (sPassword) {
					window.sessionStorage.setItem(PASSWORD_KEY, sPassword);
				} else {
					window.sessionStorage.removeItem(PASSWORD_KEY);
				}
			} catch (e) {
				/* ignore storage failures */
			}
		},

		_errorText: function(err) {
			if (err && err.error && err.error.message) {
				return err.error.message;
			}
			return (err && err.message) || String(err);
		}
	});
});
