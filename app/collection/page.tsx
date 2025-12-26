import { supabaseAdmin } from '@/lib/supabase';
import { ArtworkPost, Gallery } from '@/types/database';
import Navbar from '@/components/navbar/Navbar';
import UnifiedCollectionGrid from '@/components/home/UnifiedCollectionGrid';
import Footer from '@/components/Footer';
import { isAdmin } from '@/lib/auth';
import GalleryBreadcrumbs from '@/components/galleries/GalleryBreadcrumbs';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArtworks(galleryId?: string): Promise<{ rootArtworks: ArtworkPost[]; galleryArtworks: ArtworkPost[] }> {
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching artworks:', error);
    return { rootArtworks: [], galleryArtworks: [] };
  }

  // Add password field as null for client (we don't send actual passwords)
  const artworks = (data || []).map(a => ({
    ...a,
    password: null,
    gallery: a.gallery ? { ...a.gallery, password: null } : undefined,
  })) as ArtworkPost[];
  
  // Get root artworks (those without a gallery)
  const rootArtworks = artworks.filter(a => !a.gallery_id);
  
  // Get artworks in the specified gallery
  const galleryArtworks = galleryId ? artworks.filter(a => a.gallery_id === galleryId) : [];

  return { rootArtworks, galleryArtworks };
}

async function getRootGalleries(): Promise<(Gallery & { coverImageUrl?: string; previewImages?: string[]; subfolderCount?: number; artworkCount?: number })[]> {
  const { data: galleries, error } = await supabaseAdmin
    .from('galleries')
    .select('id, name, parent_id, cover_image_url, created_at')
    .is('parent_id', null)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching galleries:', error);
    return [];
  }

  // Fetch cover image, subfolder count, and artwork count for each gallery
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
        
        if (firstArtwork?.images && firstArtwork.images.length > 0) {
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

async function getGallery(galleryId: string): Promise<Gallery | null> {
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select('id, name, parent_id, cover_image_url, created_at')
    .eq('id', galleryId)
    .single();

  if (error || !data) {
    return null;
  }

  return { ...data, password: null } as Gallery;
}

async function getChildGalleries(parentId: string): Promise<(Gallery & { coverImageUrl?: string; previewImages?: string[]; subfolderCount?: number; artworkCount?: number })[]> {
  const { data: galleries, error } = await supabaseAdmin
    .from('galleries')
    .select('id, name, parent_id, cover_image_url, created_at')
    .eq('parent_id', parentId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching child galleries:', error);
    return [];
  }

  // Fetch cover image, subfolder count, and artwork count for each gallery
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
        
        if (firstArtwork?.images && firstArtwork.images.length > 0) {
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

interface CollectionPageProps {
  searchParams: Promise<{ gallery?: string }>;
}

export default async function CollectionPage({ searchParams }: CollectionPageProps) {
  const adminView = await isAdmin();
  const params = await searchParams;
  const galleryId = params.gallery;

  const allGalleries = await getAllGalleries();

  // If viewing a specific gallery
  if (galleryId) {
    const gallery = await getGallery(galleryId);
    if (!gallery) {
      // Gallery not found, redirect to collection
      return (
        <div className="home-page">
          <Navbar />
          <main className="main-content">
            <section className="section-collection">
              <div className="collection-header">
                <h2 className="section-title">Gallery not found</h2>
                <Link href="/collection" className="back-link">
                  <ArrowLeft size={16} />
                  Back to Collection
                </Link>
              </div>
            </section>
          </main>
          <Footer />
        </div>
      );
    }

    const childGalleries = await getChildGalleries(galleryId);
    const { galleryArtworks } = await getArtworks(galleryId);

    // Create unified items for this gallery
    type UnifiedItem = 
      | { type: 'gallery'; data: Gallery & { coverImageUrl?: string; previewImages?: string[] }; sortKey: string }
      | { type: 'post'; data: ArtworkPost; sortKey: string };

    const items: UnifiedItem[] = [];

    // Add child galleries
    childGalleries.forEach((childGallery) => {
      items.push({
        type: 'gallery',
        data: childGallery,
        sortKey: childGallery.name.toLowerCase(),
      });
    });

    // Add artworks in this gallery
    galleryArtworks.forEach((artwork) => {
      items.push({
        type: 'post',
        data: artwork,
        sortKey: artwork.title.toLowerCase(),
      });
    });

    // Sort: galleries first (alphabetically), then posts (alphabetically)
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'gallery' ? -1 : 1;
      }
      return a.sortKey.localeCompare(b.sortKey);
    });

    return (
      <div className="home-page">
        <Navbar />
        
        <main className="main-content">
          <section className="section-collection">
            <div className="collection-header">
              <div className="collection-header-top">
                <Link href="/collection" className="back-link">
                  <ArrowLeft size={16} />
                  Back to Collection
                </Link>
              </div>
              <GalleryBreadcrumbs gallery={gallery} allGalleries={allGalleries} />
              <h2 className="section-title">{gallery.name}</h2>
            </div>
            <UnifiedCollectionGrid items={items} allGalleries={allGalleries} adminView={adminView} />
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  // Default: show root galleries and root artworks
  const { rootArtworks } = await getArtworks();
  const rootGalleries = await getRootGalleries();

  // Create unified items: galleries first (alphabetically), then posts (alphabetically)
  type UnifiedItem = 
    | { type: 'gallery'; data: Gallery & { coverImageUrl?: string; previewImages?: string[] }; sortKey: string }
    | { type: 'post'; data: ArtworkPost; sortKey: string };

  const items: UnifiedItem[] = [];

  // Add galleries
  rootGalleries.forEach((gallery) => {
    items.push({
      type: 'gallery',
      data: gallery,
      sortKey: gallery.name.toLowerCase(),
    });
  });

  // Add posts
  rootArtworks.forEach((artwork) => {
    items.push({
      type: 'post',
      data: artwork,
      sortKey: artwork.title.toLowerCase(),
    });
  });

  // Sort: galleries first (alphabetically), then posts (alphabetically)
  items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'gallery' ? -1 : 1;
    }
    return a.sortKey.localeCompare(b.sortKey);
  });

  return (
    <div className="home-page">
      <Navbar />
      
      <main className="main-content">
        <section className="section-collection">
          <div className="collection-header">
            <h2 className="section-title">Full Collection</h2>
          </div>
          <UnifiedCollectionGrid items={items} allGalleries={allGalleries} adminView={adminView} />
        </section>
      </main>

      <Footer />
    </div>
  );
}

