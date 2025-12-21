import { requireAuth } from '@/lib/auth';
import ManageGalleriesClient from '@/components/admin/ManageGalleriesClient';

export default async function ManageGalleriesPage() {
  await requireAuth();

  return <ManageGalleriesClient />;
}

