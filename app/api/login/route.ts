import { NextRequest, NextResponse } from 'next/server';
import { createSession, isValidCredential } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const user = String(formData.get('user') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!isValidCredential(user, password)) {
    return NextResponse.redirect(new URL('/admin/upload?error=Credenciais%20inv%C3%A1lidas', request.url));
  }

  await createSession();
  return NextResponse.redirect(new URL('/admin/upload', request.url));
}
