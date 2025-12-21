import { requireAuth } from '@/lib/auth';
import ManagePostsClient from '@/components/admin/ManagePostsClient';

export default async function ManagePostsPage() {
  await requireAuth();

  return <ManagePostsClient />;
}

