import { supabase } from '@/lib/supabase';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/Footer';
import { ArtworkPost, Gallery } from '@/types/database';
import { notFound } from 'next/navigation';
import ProtectedArtworkContent from '@/components/ProtectedArtworkContent';
import { Suspense } from 'react';

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

async function getAllGalleries(): Promise<Gallery[]> {
  const { data, error } = await supabase
    .from('galleries')
    .select('*');

  if (error) {
    console.error('Error fetching all galleries:', error);
    return [];
  }

  return (data || []) as Gallery[];
}

export default async function ArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [artwork, allGalleries] = await Promise.all([
    getArtwork(id),
    getAllGalleries(),
  ]);

  if (!artwork) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
        <ProtectedArtworkContent artwork={artwork} allGalleries={allGalleries} />
      </Suspense>
      <Footer />
    </>
  );
}
