import { NextRequest } from 'next/server';
import { createSession, isValidCredential } from '@/lib/auth';
import { redirectTo } from '@/lib/redirect';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const user = String(formData.get('user') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!isValidCredential(user, password)) {
    return redirectTo('/admin/upload', { error: 'Credenciais inválidas' });
  }

  await createSession();
  return redirectTo('/admin/upload');
}
