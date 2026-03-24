import { cookies } from 'next/headers';

const SESSION_COOKIE = 'dashboard_session';

function expectedToken(): string {
  const user = process.env.DASHBOARD_ADMIN_USER;
  const password = process.env.DASHBOARD_ADMIN_PASSWORD;

  if (!user || !password) {
    throw new Error('DASHBOARD_ADMIN_USER e DASHBOARD_ADMIN_PASSWORD precisam estar definidos.');
  }

  return Buffer.from(`${user}:${password}`).toString('base64');
}

export function isValidCredential(user: string, password: string): boolean {
  return Buffer.from(`${user}:${password}`).toString('base64') === expectedToken();
}

export async function createSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === expectedToken();
}
