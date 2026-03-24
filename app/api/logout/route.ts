import { clearAdminSession } from '@/lib/auth';
import { redirectTo } from '@/lib/redirect';

export async function POST() {
  await clearAdminSession();
  return redirectTo('/admin/upload');
}
