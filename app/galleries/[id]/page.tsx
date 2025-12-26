import { supabaseAdmin } from '@/lib/supabase';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/Footer';
import ProtectedGalleryContent from '@/components/galleries/ProtectedGalleryContent';
import { ArtworkPost, Gallery } from '@/types/database';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

async function getGallery(id: string): Promise<Gallery | null> {
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select('id, name, parent_id, cover_image_url, created_at')
    .eq('id', id)
    .single();

  if (error) return null;
  // Add password field as null for client (we don't send actual passwords)
  return { ...data, password: null } as Gallery;
}

async function getChildGalleries(parentId: string) {
  const { data: galleries, error } = await supabaseAdmin
    .from('galleries')
    .select('id, name, parent_id, cover_image_url, created_at')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching child galleries:', error);
    return [];
  }

  // Fetch cover image, subfolder count, and artwork count for each child gallery
  const galleriesWithData = await Promise.all(
    (galleries || []).map(async (gallery) => {
      let coverImageUrl = gallery.cover_image_url;
      
      // If no cover image set, get first artwork's first image
      if (!coverImageUrl) {
        const { data: firstArtwork } = await supabaseAdmin
          .from('artwork_posts')
          .select('images:artwork_images(image_url, display_order)')
          .eq('gallery_id', gallery.id)
          .limit(1)
          .single();
        
        if (firstArtwork?.images && Array.isArray(firstArtwork.images) && firstArtwork.images.length > 0) {
          const sortedImages = firstArtwork.images.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order);
          coverImageUrl = sortedImages[0]?.image_url || null;
        }
      }

      // Keep previewImages for backward compatibility
      const { data: artworks } = await supabaseAdmin
        .from('artwork_posts')
        .select('images:artwork_images(image_url)')
        .eq('gallery_id', gallery.id)
        .limit(4);

      const previewImages = artworks
        ?.flatMap(a => a.images?.map(img => img.image_url) || [])
        .filter(Boolean)
        .slice(0, 4) || [];

      // Get subfolder count
      const { count: subfolderCount } = await supabaseAdmin
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', gallery.id);

      // Get artwork count
      const { count: artworkCount } = await supabaseAdmin
        .from('artwork_posts')
        .select('*', { count: 'exact', head: true })
        .eq('gallery_id', gallery.id);

      return { 
        ...gallery,
        password: null, // Don't send password to client
        coverImageUrl,
        previewImages,
        subfolderCount: subfolderCount || 0,
        artworkCount: artworkCount || 0
      };
    })
  );

  return galleriesWithData;
}

async function getGalleryArtworks(id: string): Promise<ArtworkPost[]> {
  const { data, error } = await supabaseAdmin
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
      gallery:galleries(id, name, parent_id, cover_image_url, created_at),
      images:artwork_images(*)
    `)
    .eq('gallery_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching artworks:', error);
    return [];
  }

  // Add password field as null for client (we don't send actual passwords)
  return (data || []).map(a => ({
    ...a,
    password: null,
    gallery: a.gallery ? { ...a.gallery, password: null } : undefined,
  })) as ArtworkPost[];
}

async function getGalleryPreviewImages(id: string): Promise<string[]> {
  const { data: artworks } = await supabaseAdmin
    .from('artwork_posts')
    .select('images:artwork_images(image_url)')
    .eq('gallery_id', id)
    .limit(4);

  const previewImages = artworks
    ?.flatMap(a => a.images?.map(img => img.image_url) || [])
    .filter(Boolean)
    .slice(0, 4) || [];

  return previewImages;
}

export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminView = await isAdmin();
  const gallery = await getGallery(id);

  if (!gallery) {
    notFound();
  }

  const [allGalleries, childGalleries, artworks, previewImages] = await Promise.all([
    getAllGalleries(),
    getChildGalleries(id),
    getGalleryArtworks(id),
    getGalleryPreviewImages(id),
  ]);

  return (
    <div className="gallery-detail-page">
      <Navbar />
      
      <main className="gallery-detail-content">
        <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
          <ProtectedGalleryContent
            gallery={gallery}
            allGalleries={allGalleries}
            childGalleries={childGalleries}
            artworks={artworks}
            previewImages={previewImages}
            adminView={adminView}
          />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
