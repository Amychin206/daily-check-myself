import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Opens the share sheet so the user can save or send a generated file. */
export async function shareBytes(name: string, bytes: Uint8Array, mimeType: string): Promise<void> {
  const out = new File(Paths.cache, name);
  if (out.exists) out.delete();
  out.create();
  await out.write(bytes);
  await Sharing.shareAsync(out.uri, { mimeType, dialogTitle: '保存或发送备份' });
}

export async function readUri(uri: string): Promise<Uint8Array> {
  return new File(uri).bytes();
}
