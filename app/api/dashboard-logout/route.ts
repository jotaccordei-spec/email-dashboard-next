import { clearViewerSession } from '@/lib/auth';
import { redirectTo } from '@/lib/redirect';

export async function POST() {
  await clearViewerSession();
  return redirectTo('/');
}
