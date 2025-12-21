import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  await requireAuth();
  redirect('/admin/posts');
}

