import { supabase } from '@/lib/supabase';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/Footer';
import { ArtworkPost, Gallery } from '@/types/database';
import { notFound } from 'next/navigation';
import ProtectedArtworkContent from '@/components/ProtectedArtworkContent';
import { Suspense } from 'react';
import { isAdmin } from '@/lib/auth';

// Disable caching to show latest artwork data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArtwork(id: string): Promise<ArtworkPost | null> {
  const { data, error } = await supabase
    .from('artwork_posts')
    .select(`
      id,
      title,
      description,
      price,
      gallery_id,
      is_pinned,
      created_at,
      updated_at,
      gallery:galleries(id, name, parent_id, cover_image_url, created_at, updated_at),
      images:artwork_images(*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  // Add password field as null for client (we don't send actual passwords)
  // Also ensure gallery has password field if it exists
  const artwork = {
    ...data,
    password: null,
    gallery: data.gallery ? {
      ...data.gallery,
      password: null,
    } : undefined,
  } as ArtworkPost;

  return artwork;
}

async function getAllGalleries(): Promise<Gallery[]> {
  const { data, error } = await supabase
    .from('galleries')
    .select('id, name, parent_id, cover_image_url, created_at, updated_at');

  if (error) {
    console.error('Error fetching all galleries:', error);
    return [];
  }

  // Add password field as null for client (we don't send actual passwords)
  return (data || []).map(g => ({ ...g, password: null })) as Gallery[];
}

export default async function ArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminView = await isAdmin();
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
        <ProtectedArtworkContent artwork={artwork} allGalleries={allGalleries} adminView={adminView} />
      </Suspense>
      <Footer />
    </>
  );
}
