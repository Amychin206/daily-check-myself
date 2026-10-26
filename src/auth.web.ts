import { GOOGLE_WEB_CLIENT_ID } from './config';

// Google sign-in in the browser, via Google Identity Services' token flow.
// Browsers can't refresh a token silently, so once the hour-long token expires
// the user has to click once to continue syncing (getAccessToken interactive).

export type GoogleUser = { email: string };

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const SCOPES = `${DRIVE_SCOPE} openid email`;
const EMAIL_KEY = 'google.email';

export class NeedsSignInError extends Error {}

export const authAvailable = !!GOOGLE_WEB_CLIENT_ID;
export const authUnavailableReason = '网页版的 Google 登录还没有配置。';

type TokenResponse = { access_token?: string; expires_in?: number; error?: string; error_description?: string };
type TokenClient = { requestAccessToken: (overrides?: { prompt?: string; login_hint?: string }) => void };
type Gis = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (res: TokenResponse) => void;
        error_callback?: (err: { type: string; message?: string }) => void;
      }) => TokenClient;
      revoke: (token: string, done?: () => void) => void;
    };
  };
};

let gis: Gis | null = null;
const gisReady: Promise<Gis> | null = authAvailable
  ? new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        gis = (window as unknown as { google: Gis }).google;
        resolve(gis);
      };
      script.onerror = () => reject(new Error('无法加载 Google 登录组件'));
      document.head.appendChild(script);
    })
  : null;
gisReady?.catch(() => {});

let token: { value: string; expiresAt: number } | null = null;

function storedEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

/** Opens Google's consent popup. Must be called from a click handler so the popup isn't blocked. */
function requestToken(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!gis) {
      reject(new Error('Google 登录组件还在加载，请稍后再试'));
      return;
    }
    const client = gis.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_WEB_CLIENT_ID,
      scope: SCOPES,
      callback: (res) => {
        if (!res.access_token) {
          reject(new Error(res.error_description || res.error || '授权失败'));
          return;
        }
        token = { value: res.access_token, expiresAt: Date.now() + ((res.expires_in ?? 3600) - 60) * 1000 };
        resolve(res.access_token);
      },
      error_callback: (err) => reject(new Error(err.type === 'popup_closed' ? '已取消登录' : err.message || err.type)),
    });
    client.requestAccessToken({ prompt, login_hint: storedEmail() ?? undefined });
  });
}

export async function restoreSession(): Promise<GoogleUser | null> {
  const email = storedEmail();
  return email ? { email } : null;
}

export async function signIn(): Promise<GoogleUser | null> {
  const accessToken = await requestToken('select_account');
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const { email } = (await res.json()) as { email: string };
  try {
    localStorage.setItem(EMAIL_KEY, email);
  } catch {
    // Without storage the user simply signs in again next visit.
  }
  return { email };
}

export async function signOut(): Promise<void> {
  if (token && gis) gis.accounts.oauth2.revoke(token.value);
  token = null;
  try {
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    // Nothing to clear.
  }
}

export async function getAccessToken({
  refresh = false,
  interactive = false,
}: { refresh?: boolean; interactive?: boolean } = {}): Promise<string> {
  if (refresh) token = null;
  if (token && token.expiresAt > Date.now()) return token.value;
  if (!interactive) throw new NeedsSignInError('需要重新连接 Google');
  return requestToken('');
}
