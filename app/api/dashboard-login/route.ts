import { NextRequest } from 'next/server';
import { createViewerSession, isValidViewerCredential } from '@/lib/auth';
import { redirectTo } from '@/lib/redirect';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const user = String(formData.get('user') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!isValidViewerCredential(user, password)) {
    return redirectTo('/', { error: 'Credenciais inválidas' });
  }

  await createViewerSession(user, password);
  return redirectTo('/');
}
