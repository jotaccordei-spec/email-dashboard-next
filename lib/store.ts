import { DashboardState } from '@/lib/types';

type StoredBinaryFile = {
  content: Buffer;
  name: string;
  size: number;
  updatedAt: string;
};

type DashboardMemoryStore = {
  generatedFiles: Map<string, StoredBinaryFile>;
  state: DashboardState | null;
  uploadedFiles: Map<string, StoredBinaryFile>;
};

declare global {
  var __dashboardMemoryStore: DashboardMemoryStore | undefined;
}

function getMemoryStore(): DashboardMemoryStore {
  if (!globalThis.__dashboardMemoryStore) {
    globalThis.__dashboardMemoryStore = {
      generatedFiles: new Map(),
      state: null,
      uploadedFiles: new Map(),
    };
  }

  return globalThis.__dashboardMemoryStore;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function readDashboardState(): DashboardState | null {
  return getMemoryStore().state;
}

export function saveDashboardState(state: DashboardState): void {
  getMemoryStore().state = state;
}

export function saveUploadedFile(fileName: string, bytes: Buffer): string {
  const safeName = `${Date.now()}-${sanitizeFileName(fileName)}`;
  getMemoryStore().uploadedFiles.set(safeName, {
    name: safeName,
    size: bytes.byteLength,
    updatedAt: new Date().toISOString(),
    content: Buffer.from(bytes),
  });

  return safeName;
}

export function saveGeneratedFile(fileName: string, bytes: Buffer): string {
  const safeName = sanitizeFileName(fileName);
  getMemoryStore().generatedFiles.set(safeName, {
    name: safeName,
    size: bytes.byteLength,
    updatedAt: new Date().toISOString(),
    content: Buffer.from(bytes),
  });

  return safeName;
}

export function readGeneratedFile(fileName: string): StoredBinaryFile | null {
  return getMemoryStore().generatedFiles.get(fileName) ?? null;
}

export function listGeneratedFiles(): Array<{ name: string; size: number; updatedAt: string }> {
  return [...getMemoryStore().generatedFiles.values()]
    .map((file) => ({ name: file.name, size: file.size, updatedAt: file.updatedAt }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
