import { cookies } from 'next/headers';

const ADMIN_SESSION_COOKIE = 'dashboard_admin_session';
const VIEWER_SESSION_COOKIE = 'dashboard_viewer_session';

type ViewerCredential = {
  password: string;
  user: string;
};

function createSessionOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  };
}

function toToken(user: string, password: string): string {
  return Buffer.from(`${user}:${password}`).toString('base64');
}

function expectedAdminToken(): string {
  const user = process.env.DASHBOARD_ADMIN_USER;
  const password = process.env.DASHBOARD_ADMIN_PASSWORD;

  if (!user || !password) {
    throw new Error('DASHBOARD_ADMIN_USER e DASHBOARD_ADMIN_PASSWORD precisam estar definidos.');
  }

  return toToken(user, password);
}

function parseViewerCredentials(): ViewerCredential[] {
  const raw = process.env.DASHBOARD_VIEWER_USERS_JSON;

  if (!raw) {
    throw new Error('DASHBOARD_VIEWER_USERS_JSON precisa estar definido.');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('DASHBOARD_VIEWER_USERS_JSON precisa ser um JSON válido.');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('DASHBOARD_VIEWER_USERS_JSON precisa ser um array com ao menos um usuário.');
  }

  return parsed.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Cada item de DASHBOARD_VIEWER_USERS_JSON precisa ser um objeto.');
    }

    const user = 'user' in entry ? String(entry.user ?? '').trim() : '';
    const password = 'password' in entry ? String(entry.password ?? '') : '';

    if (!user || !password) {
      throw new Error('Cada usuário de DASHBOARD_VIEWER_USERS_JSON precisa ter user e password.');
    }

    return { user, password };
  });
}

function findViewerCredential(user: string, password: string): ViewerCredential | null {
  const credentials = parseViewerCredentials();
  return credentials.find((entry) => entry.user === user && entry.password === password) ?? null;
}

function viewerTokens(): Set<string> {
  return new Set(parseViewerCredentials().map((entry) => toToken(entry.user, entry.password)));
}

export function isValidAdminCredential(user: string, password: string): boolean {
  return toToken(user, password) === expectedAdminToken();
}

export async function createAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, expectedAdminToken(), createSessionOptions());
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_SESSION_COOKIE)?.value === expectedAdminToken();
}

export function isValidViewerCredential(user: string, password: string): boolean {
  return findViewerCredential(user, password) !== null;
}

export async function createViewerSession(user: string, password: string): Promise<void> {
  const credential = findViewerCredential(user, password);

  if (!credential) {
    throw new Error('Credenciais inválidas para acesso ao dashboard.');
  }

  const store = await cookies();
  store.set(VIEWER_SESSION_COOKIE, toToken(credential.user, credential.password), createSessionOptions());
}

export async function clearViewerSession(): Promise<void> {
  const store = await cookies();
  store.delete(VIEWER_SESSION_COOKIE);
}

export async function isViewerAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(VIEWER_SESSION_COOKIE)?.value;

  if (!token) return false;

  return viewerTokens().has(token);
}
