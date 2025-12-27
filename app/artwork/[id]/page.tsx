import { supabaseAdmin } from '@/lib/supabase';
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
  const { data, error } = await supabaseAdmin
    .from('artwork_posts')
    .select(`
      id,
      title,
      description,
      price,
      gallery_id,
      display_order,
      created_at,
      updated_at,
      gallery:galleries(id, name, parent_id, cover_image_url, display_order, created_at),
      images:artwork_images(*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  // Handle gallery relationship - Supabase may return it as array or object
  let galleryObj: Gallery | undefined = undefined;
  if (data.gallery) {
    // If gallery is an array, take the first item, otherwise use the object
    const galleryData = Array.isArray(data.gallery) ? data.gallery[0] : data.gallery;
    if (galleryData && typeof galleryData === 'object' && galleryData !== null && 'id' in galleryData) {
      const gallery = galleryData as {
        id: string;
        name: string;
        parent_id: string | null;
        cover_image_url: string | null;
        display_order: number | null;
        created_at: string;
      };
      galleryObj = {
        id: gallery.id,
        name: gallery.name,
        parent_id: gallery.parent_id ?? null,
        password: null,
        cover_image_url: gallery.cover_image_url ?? null,
        display_order: gallery.display_order ?? null,
        created_at: gallery.created_at,
      };
    }
  }

  // Add password field as null for client (we don't send actual passwords)
  const artwork: ArtworkPost = {
    ...data,
    password: null,
    display_order: data.display_order ?? null,
    gallery: galleryObj,
  };

  return artwork;
}

async function getAllGalleries(): Promise<Gallery[]> {
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select('id, name, parent_id, cover_image_url, created_at');

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
