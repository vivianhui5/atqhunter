import { requireAuth } from '@/lib/auth';
import EditArtworkClient from '@/components/admin/EditArtworkClient';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  return <EditArtworkClient artworkId={id} />;
}

