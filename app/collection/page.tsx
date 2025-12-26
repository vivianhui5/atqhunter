import { supabase } from '@/lib/supabase';
import { ArtworkPost, Gallery } from '@/types/database';
import Navbar from '@/components/navbar/Navbar';
import UnifiedCollectionGrid from '@/components/home/UnifiedCollectionGrid';
import Footer from '@/components/Footer';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArtworks(): Promise<{ rootArtworks: ArtworkPost[] }> {
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching artworks:', error);
    return { rootArtworks: [] };
  }

  // Add password field as null for client (we don't send actual passwords)
  const artworks = (data || []).map(a => ({
    ...a,
    password: null,
    gallery: a.gallery ? { ...a.gallery, password: null } : undefined,
  })) as ArtworkPost[];
  // Get root artworks (those without a gallery)
  const rootArtworks = artworks.filter(a => !a.gallery_id);

  return { rootArtworks };
}

async function getRootGalleries(): Promise<(Gallery & { coverImageUrl?: string; previewImages?: string[]; subfolderCount?: number; artworkCount?: number })[]> {
  const { data: galleries, error } = await supabase
    .from('galleries')
    .select('id, name, parent_id, cover_image_url, created_at, updated_at')
    .is('parent_id', null)
    .order('created_at', { ascending: false });

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
        const { data: firstArtwork } = await supabase
          .from('artwork_posts')
          .select('images:artwork_images(image_url, display_order)')
          .eq('gallery_id', gallery.id)
          .limit(1)
          .single();
        
        if (firstArtwork?.images && firstArtwork.images.length > 0) {
          const sortedImages = firstArtwork.images.sort((a: any, b: any) => a.display_order - b.display_order);
          coverImageUrl = sortedImages[0]?.image_url || null;
        }
      }

      // Keep previewImages for backward compatibility
      const { data: artworks } = await supabase
        .from('artwork_posts')
        .select('images:artwork_images(image_url)')
        .eq('gallery_id', gallery.id)
        .limit(4);

      const previewImages = artworks
        ?.flatMap(a => a.images?.map(img => img.image_url) || [])
        .filter(Boolean)
        .slice(0, 4) || [];

      // Get subfolder count
      const { count: subfolderCount } = await supabase
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', gallery.id);

      // Get artwork count
      const { count: artworkCount } = await supabase
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

export default async function CollectionPage() {
  const adminView = await isAdmin();
  const { rootArtworks } = await getArtworks();
  const rootGalleries = await getRootGalleries();
  const allGalleries = await getAllGalleries();

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

