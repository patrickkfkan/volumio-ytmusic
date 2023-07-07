import Innertube, { Credentials, OAuthAuthPendingData, Utils as YTUtils } from 'volumio-youtubei.js';
import ytmusic from '../YTMusicContext';

export enum AuthStatus {
  SignedIn = 'SignedIn',
  SignedOut = 'SignedOut',
  SigningIn = 'SigningIn',
  Error = 'Error'
}

export interface AuthStatusInfo {
  status: AuthStatus;
  verificationInfo?: {
    verificationUrl: string,
    userCode: string
  } | null;
  error?: YTUtils.OAuthError;
}

const INITIAL_SIGNED_OUT_STATUS: AuthStatusInfo = {
  status: AuthStatus.SignedOut,
  verificationInfo: null
};

export default class Auth {

  static #handlers = {
    onSuccess: Auth.#handleSuccess.bind(Auth),
    onPending: Auth.#handlePending.bind(Auth),
    onError: Auth.#handleError.bind(Auth),
    onCredentials: Auth.#handleUpdateCredentials.bind(Auth)
  };

  static #handlePending(data: OAuthAuthPendingData) {
    ytmusic.set<AuthStatusInfo>('authStatusInfo', {
      status: AuthStatus.SignedOut,
      verificationInfo: {
        verificationUrl: data.verification_url,
        userCode: data.user_code
      }
    });

    ytmusic.refreshUIConfig();
  }

  static #handleSuccess(data: { credentials: Credentials }) {
    ytmusic.set<AuthStatusInfo>('authStatusInfo', {
      status: AuthStatus.SignedIn
    });

    ytmusic.setConfigValue('authCredentials', data.credentials);

    ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_SIGN_IN_SUCCESS'));
    ytmusic.refreshUIConfig();
  }

  static #handleError(err: YTUtils.OAuthError) {
    if (err.info.status === 'DEVICE_CODE_EXPIRED') {
      ytmusic.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
    }
    else {
      ytmusic.set<AuthStatusInfo>('authStatusInfo', {
        status: AuthStatus.Error,
        error: err
      });

      ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_SIGN_IN',
        ytmusic.getErrorMessage('', err, false)));
    }

    ytmusic.refreshUIConfig();
  }

  static #handleUpdateCredentials(data: { credentials: Credentials }) {
    ytmusic.setConfigValue('authCredentials', data.credentials);
  }

  static registerHandlers() {
    const innertube = ytmusic.get<Innertube>('innertube');
    if (innertube?.session) {
      innertube.session.on('auth', this.#handlers.onSuccess);
      innertube.session.on('auth-pending', this.#handlers.onPending);
      innertube.session.on('auth-error', this.#handlers.onError);
      innertube.session.on('update-credentials', this.#handlers.onCredentials);
    }
  }

  static unregisterHandlers() {
    const innertube = ytmusic.get<Innertube>('innertube');
    if (innertube?.session) {
      innertube.session.off('auth', this.#handlers.onSuccess);
      innertube.session.off('auth-pending', this.#handlers.onPending);
      innertube.session.off('auth-error', this.#handlers.onError);
      innertube.session.off('update-credentials', this.#handlers.onCredentials);
    }
  }

  static signIn() {
    const innertube = ytmusic.get<Innertube>('innertube');
    if (innertube?.session) {
      const credentials = ytmusic.getConfigValue('authCredentials');
      if (credentials) {
        ytmusic.set<AuthStatusInfo>('authStatusInfo', {
          status: AuthStatus.SigningIn
        });
      }
      else {
        ytmusic.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
      }

      ytmusic.refreshUIConfig();
      innertube.session.signIn(credentials);
    }
  }

  static signOut() {
    const innertube = ytmusic.get<Innertube>('innertube');
    if (innertube?.session?.logged_in) {
      innertube.session.signOut();

      ytmusic.deleteConfigValue('authCredentials');

      ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_SIGNED_OUT'));

      // Sign in again with empty credentials to reset status to SIGNED_OUT
      // And obtain new device code
      this.signIn();
    }
  }

  static getAuthStatus() {
    return ytmusic.get<AuthStatusInfo>('authStatusInfo') || INITIAL_SIGNED_OUT_STATUS;
  }
}
