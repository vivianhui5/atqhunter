import { supabase } from '@/lib/supabase';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/Footer';
import { ArtworkPost } from '@/types/database';
import { notFound } from 'next/navigation';
import ArtworkDetail from '@/components/ArtworkDetail';

// Disable caching to show latest artwork data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArtwork(id: string): Promise<ArtworkPost | null> {
  const { data, error } = await supabase
    .from('artwork_posts')
    .select(`
      *,
      gallery:galleries(*),
      images:artwork_images(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data as ArtworkPost;
}

export default async function ArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artwork = await getArtwork(id);

  if (!artwork) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <ArtworkDetail artwork={artwork} />
      <Footer />
    </>
  );
}
