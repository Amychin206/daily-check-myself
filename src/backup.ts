import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import { toDateKey } from './dates';
import { photoFile } from './photos';
import { isSectionKey } from './sections';
import type { Entries, Entry } from './store';

// A backup is a .zip holding backup.json plus every referenced photo under photos/.

type BackupFile = { app: 'daily-check-myself'; version: 1; exportedAt: string; entries: Entry[] };

export async function exportBackup(entries: Entries): Promise<void> {
  const zip = new JSZip();
  const list = Object.values(entries);
  for (const e of list) {
    if (!e.photoFile || e.deleted) continue;
    const file = photoFile(e.photoFile);
    if (file.exists) zip.file(`photos/${e.photoFile}`, await file.bytes());
  }
  const manifest: BackupFile = {
    app: 'daily-check-myself',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: list,
  };
  zip.file('backup.json', JSON.stringify(manifest));
  const data = await zip.generateAsync({ type: 'uint8array' });

  const out = new File(Paths.cache, `每日成长备份-${toDateKey(new Date())}.zip`);
  if (out.exists) out.delete();
  out.create();
  await out.write(data);
  await Sharing.shareAsync(out.uri, { mimeType: 'application/zip', dialogTitle: '保存或发送备份' });
}

/** Lets the user pick a backup file; returns its entries (photos already restored), or null if cancelled. */
export async function readBackup(): Promise<Entry[] | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/octet-stream'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets[0]) return null;

  const zip = await JSZip.loadAsync(await new File(picked.assets[0].uri).bytes());
  const manifestFile = zip.file('backup.json');
  if (!manifestFile) throw new Error('这不是「每日成长」的备份文件');
  const manifest = JSON.parse(await manifestFile.async('string')) as BackupFile;
  if (manifest.app !== 'daily-check-myself' || !Array.isArray(manifest.entries)) {
    throw new Error('这不是「每日成长」的备份文件');
  }

  const entries = manifest.entries.filter((e) => isSectionKey(e.section) && typeof e.date === 'string');
  for (const e of entries) {
    if (!e.photoFile) continue;
    const local = photoFile(e.photoFile);
    const inZip = zip.file(`photos/${e.photoFile}`);
    if (local.exists || !inZip) continue;
    local.create();
    await local.write(await inZip.async('uint8array'));
  }
  return entries;
}
