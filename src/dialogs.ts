import { Alert, Platform } from 'react-native';

// React Native's Alert does nothing in the browser, so fall back to the
// browser's own dialogs there.

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

export function confirmDestructive(title: string, message: string, confirmText: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: '取消', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));
