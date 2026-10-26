import { File } from 'expo-file-system';
import { googleSigninModule } from './googleSignin';

// Minimal Google Drive client for the hidden per-app "appDataFolder": the user
// can't see or edit these files, and the app can't see anything else in Drive.

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

export type DriveFile = { id: string; name: string; modifiedTime: string };

let token: string | null = null;

async function accessToken(refresh = false): Promise<string> {
  if (!googleSigninModule) throw new Error('当前环境不支持 Google 登录');
  const { GoogleSignin } = googleSigninModule;
  if (refresh && token) {
    await GoogleSignin.clearCachedAccessToken(token);
    token = null;
  }
  if (!token) token = (await GoogleSignin.getTokens()).accessToken;
  return token;
}

/** Forgets the cached token, e.g. after signing out. */
export function resetToken() {
  token = null;
}

/** fetch with the Drive token, retrying once with a fresh token on 401. */
async function driveFetch(url: string, init: RequestInit = {}): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string>),
        Authorization: `Bearer ${await accessToken(attempt > 0)}`,
      },
    });
    if (res.status === 401 && attempt === 0) continue;
    if (!res.ok) throw new Error(`Google Drive 请求失败（${res.status}）：${await res.text()}`);
    return res;
  }
}

export async function listFiles(): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      fields: 'nextPageToken,files(id,name,modifiedTime)',
      pageSize: '1000',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const body = await (await driveFetch(`${API}?${params}`)).json();
    files.push(...body.files);
    pageToken = body.nextPageToken ?? '';
  } while (pageToken);
  return files;
}

export async function readJson<T>(id: string): Promise<T> {
  return (await driveFetch(`${API}/${id}?alt=media`)).json();
}

async function createEmpty(name: string, mimeType: string): Promise<string> {
  const res = await driveFetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parents: ['appDataFolder'], mimeType }),
  });
  return (await res.json()).id;
}

/** Creates or overwrites a JSON file; returns its id. */
export async function writeJson(name: string, data: unknown, existingId?: string): Promise<string> {
  const id = existingId ?? (await createEmpty(name, 'application/json'));
  await driveFetch(`${UPLOAD}/${id}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return id;
}

export async function uploadFile(name: string, file: File, mimeType: string): Promise<void> {
  const id = await createEmpty(name, mimeType);
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await file.upload(`${UPLOAD}/${id}?uploadType=media`, {
      httpMethod: 'PATCH',
      mimeType,
      headers: { 'Content-Type': mimeType, Authorization: `Bearer ${await accessToken(attempt > 0)}` },
    });
    if (res.status === 401) continue;
    if (res.status >= 300) throw new Error(`照片上传失败（${res.status}）`);
    return;
  }
  throw new Error('照片上传失败：Google 授权已失效');
}

export async function downloadFile(id: string, dest: File): Promise<void> {
  await File.downloadFileAsync(`${API}/${id}?alt=media`, dest, {
    headers: { Authorization: `Bearer ${await accessToken()}` },
    idempotent: true,
  });
}

export async function deleteFile(id: string): Promise<void> {
  await driveFetch(`${API}/${id}`, { method: 'DELETE' });
}
