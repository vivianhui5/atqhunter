import { supabase } from '@/lib/supabase';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/galleries/PageHeader';
import GalleryGrid from '@/components/galleries/GalleryGrid';
import { Gallery } from '@/types/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getGalleries() {
  const { data: galleries, error } = await supabase
    .from('galleries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching galleries:', error);
    return [];
  }

  // Fetch preview images for each gallery (first 4 images)
  const galleriesWithImages = await Promise.all(
    (galleries || []).map(async (gallery) => {
      const { data: artworks } = await supabase
        .from('artwork_posts')
        .select('images:artwork_images(image_url)')
        .eq('gallery_id', gallery.id)
        .limit(4);

      const previewImages = artworks
        ?.flatMap(a => a.images?.map(img => img.image_url) || [])
        .filter(Boolean)
        .slice(0, 4) || [];

      return { ...gallery, previewImages };
    })
  );

  return galleriesWithImages;
}

export default async function GalleriesPage() {
  const galleries = await getGalleries();

  return (
    <div className="galleries-page">
      <Navbar />
      
      <main className="galleries-content">
        <PageHeader 
          title="Galleries"
          description="Explore our collections, each thoughtfully curated to showcase distinct artistic themes."
        />
        <GalleryGrid galleries={galleries} />
      </main>

      <Footer />
    </div>
  );
}
