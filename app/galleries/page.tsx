import { supabase } from '@/lib/supabase';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/galleries/PageHeader';
import GalleryGrid from '@/components/galleries/GalleryGrid';
import { Gallery } from '@/types/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getGalleries(parentId: string | null = null) {
  // Only fetch root galleries (where parent_id is null) for the main page
  const query = supabase
    .from('galleries')
    .select('*')
    .order('created_at', { ascending: false });

  if (parentId === null) {
    // Get root galleries only
    query.is('parent_id', null);
  } else {
    // Get children of a specific parent
    query.eq('parent_id', parentId);
  }

  const { data: galleries, error } = await query;

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
        coverImageUrl,
        previewImages,
        subfolderCount: subfolderCount || 0,
        artworkCount: artworkCount || 0
      };
    })
  );

  return galleriesWithData;
}

async function getAllGalleriesForPasswordCheck(): Promise<Gallery[]> {
  const { data, error } = await supabase
    .from('galleries')
    .select('*');

  if (error) {
    console.error('Error fetching all galleries:', error);
    return [];
  }

  return (data || []) as Gallery[];
}

export default async function GalleriesPage() {
  const galleries = await getGalleries();
  const allGalleries = await getAllGalleriesForPasswordCheck();

  return (
    <div className="galleries-page">
      <Navbar />
      
      <main className="galleries-content">
        <PageHeader 
          title="Galleries"
          description="Browse through curated galleries."
        />
        {galleries.length === 0 ? (
          <div className="empty-state">
            <p>No galleries available yet</p>
          </div>
        ) : (
          <GalleryGrid galleries={galleries} allGalleries={allGalleries} />
        )}
      </main>

      <Footer />
    </div>
  );
}
