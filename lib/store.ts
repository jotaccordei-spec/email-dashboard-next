import fs from 'node:fs';
import path from 'node:path';
import { DashboardState } from '@/lib/types';

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const statePath = path.join(dataDir, 'dashboard-state.json');
const uploadsDir = path.join(dataDir, 'uploads');
const generatedDir = path.join(dataDir, 'generated');

function ensureDirs(): void {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(generatedDir, { recursive: true });
}

export function getPaths() {
  ensureDirs();
  return { dataDir, statePath, uploadsDir, generatedDir };
}

export function readDashboardState(): DashboardState | null {
  const { statePath } = getPaths();
  if (!fs.existsSync(statePath)) return null;
  const raw = fs.readFileSync(statePath, 'utf-8');
  return JSON.parse(raw) as DashboardState;
}

export function saveDashboardState(state: DashboardState): void {
  const { statePath } = getPaths();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

export function saveUploadedFile(fileName: string, bytes: Buffer): string {
  const { uploadsDir } = getPaths();
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const fullPath = path.join(uploadsDir, safeName);
  fs.writeFileSync(fullPath, bytes);
  return fullPath;
}

export function listGeneratedFiles(): Array<{ name: string; size: number; updatedAt: string }> {
  const { generatedDir } = getPaths();
  return fs.readdirSync(generatedDir)
    .map((name) => {
      const stat = fs.statSync(path.join(generatedDir, name));
      return { name, size: stat.size, updatedAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
