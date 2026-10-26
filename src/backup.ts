import * as DocumentPicker from 'expo-document-picker';
import JSZip from 'jszip';
import { toDateKey } from './dates';
import { readUri, shareBytes } from './files';
import { hasPhoto, readPhoto, writePhoto } from './photos';
import { isSectionKey } from './sections';
import type { Entries, Entry } from './store';

// A backup is a .zip holding backup.json plus every referenced photo under photos/.

type BackupFile = { app: 'daily-check-myself'; version: 1; exportedAt: string; entries: Entry[] };

export async function exportBackup(entries: Entries): Promise<void> {
  const zip = new JSZip();
  const list = Object.values(entries);
  for (const e of list) {
    if (!e.photoFile || e.deleted) continue;
    if (await hasPhoto(e.photoFile)) zip.file(`photos/${e.photoFile}`, await readPhoto(e.photoFile));
  }
  const manifest: BackupFile = {
    app: 'daily-check-myself',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: list,
  };
  zip.file('backup.json', JSON.stringify(manifest));
  const data = await zip.generateAsync({ type: 'uint8array' });
  await shareBytes(`优我备份-${toDateKey(new Date())}.zip`, data, 'application/zip');
}

/** Lets the user pick a backup file; returns its entries (photos already restored), or null if cancelled. */
export async function readBackup(): Promise<Entry[] | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets[0]) return null;

  const zip = await JSZip.loadAsync(await readUri(picked.assets[0].uri));
  const manifestFile = zip.file('backup.json');
  if (!manifestFile) throw new Error('这不是「优我」的备份文件');
  const manifest = JSON.parse(await manifestFile.async('string')) as BackupFile;
  if (manifest.app !== 'daily-check-myself' || !Array.isArray(manifest.entries)) {
    throw new Error('这不是「优我」的备份文件');
  }

  const entries = manifest.entries.filter((e) => isSectionKey(e.section) && typeof e.date === 'string');
  for (const e of entries) {
    if (!e.photoFile) continue;
    const inZip = zip.file(`photos/${e.photoFile}`);
    if (!inZip || (await hasPhoto(e.photoFile))) continue;
    await writePhoto(e.photoFile, await inZip.async('uint8array'));
  }
  return entries;
}
