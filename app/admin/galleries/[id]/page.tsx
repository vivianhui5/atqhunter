import { requireAuth } from '@/lib/auth';
import GalleryDetailClient from '@/components/admin/GalleryDetailClient';

export default async function GalleryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  return <GalleryDetailClient galleryId={id} />;
}

