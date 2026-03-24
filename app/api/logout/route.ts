import { NextRequest } from 'next/server';
import { clearSession } from '@/lib/auth';
import { redirectTo } from '@/lib/redirect';

export async function POST(request: NextRequest) {
  await clearSession();
  return redirectTo(request, '/admin/upload');
}
