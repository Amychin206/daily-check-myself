import { Directory, File, Paths } from 'expo-file-system';

// Native photo storage: files in the app's document directory. Photos are
// referenced by file name only, so entries stay valid if the app's storage path
// changes and can be moved between devices. See photos.web.ts for the browser.

function photoDir(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function photoFile(name: string): File {
  return new File(photoDir(), name);
}

export function newPhotoName(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
}

/** Copies a picker/camera result into app storage and returns its file name. */
export async function persistPhoto(sourceUri: string): Promise<string> {
  const name = newPhotoName();
  await new File(sourceUri).copy(photoFile(name));
  return name;
}

export function deleteLocalPhoto(name: string) {
  try {
    const file = photoFile(name);
    if (file.exists) file.delete();
  } catch {
    // Missing file is fine.
  }
}

export async function hasPhoto(name: string): Promise<boolean> {
  return photoFile(name).exists;
}

export async function readPhoto(name: string): Promise<Uint8Array> {
  return photoFile(name).bytes();
}

export async function writePhoto(name: string, bytes: Uint8Array): Promise<void> {
  const file = photoFile(name);
  if (!file.exists) file.create();
  await file.write(bytes);
}

export function usePhotoUri(name: string): string | null {
  return photoFile(name).uri;
}

/** Sends the photo as the request body; returns the HTTP status. */
export async function uploadPhoto(name: string, url: string, headers: Record<string, string>): Promise<number> {
  const res = await photoFile(name).upload(url, { httpMethod: 'PATCH', mimeType: 'image/jpeg', headers });
  return res.status;
}

export async function downloadPhoto(url: string, headers: Record<string, string>, name: string): Promise<void> {
  await File.downloadFileAsync(url, photoFile(name), { headers, idempotent: true });
}
