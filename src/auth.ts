import Constants, { ExecutionEnvironment } from 'expo-constants';

// Google sign-in on Android, via the native Google Sign-In SDK. The web build
// uses auth.web.ts instead; both expose the same functions.

export type GoogleUser = { email: string };

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

/** Thrown when an access token can only be obtained with a user click (web only). */
export class NeedsSignInError extends Error {}

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

// The native module isn't in Expo Go; loading it lazily keeps the rest of the
// app working there, with sync unavailable.
const mod: GoogleSigninModule | null =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@react-native-google-signin/google-signin');

mod?.GoogleSignin.configure({ scopes: [DRIVE_SCOPE] });

export const authAvailable = !!mod;
export const authUnavailableReason = 'Expo Go 预览版不支持 Google 登录。安装正式打包的 APK 后即可开启同步。';

let token: string | null = null;

export async function restoreSession(): Promise<GoogleUser | null> {
  if (!mod?.GoogleSignin.hasPreviousSignIn()) return null;
  const res = await mod.GoogleSignin.signInSilently();
  return res.type === 'success' ? { email: res.data.user.email } : null;
}

export async function signIn(): Promise<GoogleUser | null> {
  if (!mod) return null;
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = mod;
  try {
    const res = await GoogleSignin.signIn();
    return isSuccessResponse(res) ? { email: res.data.user.email } : null;
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.IN_PROGRESS) return null;
    throw err;
  }
}

export async function signOut(): Promise<void> {
  await mod?.GoogleSignin.signOut();
  token = null;
}

/** On Android a token can always be fetched without user interaction once signed in. */
export async function getAccessToken({ refresh = false }: { refresh?: boolean; interactive?: boolean } = {}) {
  if (!mod) throw new Error('当前环境不支持 Google 登录');
  if (refresh && token) {
    await mod.GoogleSignin.clearCachedAccessToken(token);
    token = null;
  }
  if (!token) token = (await mod.GoogleSignin.getTokens()).accessToken;
  return token;
}
