import { requireAuth } from '@/lib/auth';
import UploadArtworkClient from '@/components/admin/UploadArtworkClient';

export default async function NewPostPage() {
  await requireAuth();

  return <UploadArtworkClient />;
}

