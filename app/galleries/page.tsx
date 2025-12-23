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

  // Fetch preview images, subfolder count, and artwork count for each gallery
  const galleriesWithData = await Promise.all(
    (galleries || []).map(async (gallery) => {
      // Get preview images from artworks directly in this gallery
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

export default async function GalleriesPage() {
  const galleries = await getGalleries();

  return (
    <div className="galleries-page">
      <Navbar />
      
      <main className="galleries-content">
        <PageHeader 
          description="Browse through curated galleries."
        />
        {galleries.length === 0 ? (
          <div className="empty-state">
            <p>No galleries available yet</p>
          </div>
        ) : (
          <GalleryGrid galleries={galleries} />
        )}
      </main>

      <Footer />
    </div>
  );
}
