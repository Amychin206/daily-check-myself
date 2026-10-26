import Constants, { ExecutionEnvironment } from 'expo-constants';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

/**
 * Google Sign-In is a native module that Expo Go doesn't include. Loading it
 * lazily lets the rest of the app run in Expo Go, with sync simply unavailable.
 */
export const googleSigninModule: GoogleSigninModule | null =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@react-native-google-signin/google-signin');
