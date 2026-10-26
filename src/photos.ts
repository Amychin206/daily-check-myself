import { Directory, File, Paths } from 'expo-file-system';

// Photos are referenced by file name only, so entries stay valid if the app's
// storage path changes and can be moved between devices.
function photoDir(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function photoFile(name: string): File {
  return new File(photoDir(), name);
}

export function localPhotoUri(name: string): string {
  return photoFile(name).uri;
}

/** Copies a picker/camera result into app storage and returns its file name. */
export async function persistPhoto(sourceUri: string): Promise<string> {
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
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
