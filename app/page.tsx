import { supabase } from '@/lib/supabase';
import { ArtworkPost, Gallery } from '@/types/database';
import Navbar from '@/components/navbar/Navbar';
import FeaturedSection from '@/components/home/FeaturedSection';
import UnifiedCollectionGrid from '@/components/home/UnifiedCollectionGrid';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArtworks(): Promise<{ pinned: ArtworkPost[]; rootArtworks: ArtworkPost[] }> {
  const { data, error } = await supabase
    .from('artwork_posts')
    .select(`
      *,
      gallery:galleries(*),
      images:artwork_images(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching artworks:', error);
    return { pinned: [], rootArtworks: [] };
  }

  const artworks = data as ArtworkPost[];
  const pinned = artworks.filter(a => a.is_pinned);
  // Get root artworks (those without a gallery)
  const rootArtworks = artworks.filter(a => !a.gallery_id);

  return { pinned, rootArtworks };
}

async function getRootGalleries(): Promise<(Gallery & { previewImages?: string[]; subfolderCount?: number; artworkCount?: number })[]> {
  const { data: galleries, error } = await supabase
    .from('galleries')
    .select('*')
    .is('parent_id', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching galleries:', error);
    return [];
  }

  // Fetch preview images, subfolder count, and artwork count for each gallery
  const galleriesWithData = await Promise.all(
    (galleries || []).map(async (gallery) => {
      // Get preview images
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
        previewImages,
        subfolderCount: subfolderCount || 0,
        artworkCount: artworkCount || 0
      };
    })
  );

  return galleriesWithData;
}

export default async function HomePage() {
  const { pinned, rootArtworks } = await getArtworks();
  const rootGalleries = await getRootGalleries();

  // Create unified items: galleries first (alphabetically), then posts (alphabetically)
  type UnifiedItem = 
    | { type: 'gallery'; data: Gallery & { previewImages?: string[] }; sortKey: string }
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
        <FeaturedSection artworks={pinned} />
        <section className="section-collection">
          <div className="collection-header">
            <h2 className="section-title">Full Collection</h2>
          </div>
          <UnifiedCollectionGrid items={items} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
