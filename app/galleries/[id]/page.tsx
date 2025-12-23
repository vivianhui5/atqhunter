import { supabase } from '@/lib/supabase';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/Footer';
import GalleryHeader from '@/components/gallery-detail/GalleryHeader';
import ArtworkSection from '@/components/gallery-detail/ArtworkSection';
import GalleryBreadcrumbs from '@/components/galleries/GalleryBreadcrumbs';
import GalleryGrid from '@/components/galleries/GalleryGrid';
import { ArtworkPost, Gallery } from '@/types/database';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

async function getGallery(id: string): Promise<Gallery | null> {
  const { data, error } = await supabase
    .from('galleries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Gallery;
}

async function getChildGalleries(parentId: string) {
  const { data: galleries, error } = await supabase
    .from('galleries')
    .select('*')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching child galleries:', error);
    return [];
  }

  // Fetch preview images, subfolder count, and artwork count for each child gallery
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

async function getGalleryArtworks(id: string): Promise<ArtworkPost[]> {
  const { data, error } = await supabase
    .from('artwork_posts')
    .select(`
      *,
      gallery:galleries(*),
      images:artwork_images(*)
    `)
    .eq('gallery_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching artworks:', error);
    return [];
  }

  return data as ArtworkPost[];
}

async function getGalleryPreviewImages(id: string): Promise<string[]> {
  const { data: artworks } = await supabase
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
        <GalleryBreadcrumbs gallery={gallery} allGalleries={allGalleries} />
        <GalleryHeader 
          name={gallery.name}
          previewImages={previewImages}
          subfolderCount={childGalleries.length}
          artworkCount={artworks.length}
        />
        
        {/* Sub-galleries (folders) */}
        {childGalleries.length > 0 && (
          <div className="gallery-subfolders-section">
            <h2 className="section-subtitle">Folders</h2>
            <GalleryGrid galleries={childGalleries} />
          </div>
        )}

        {/* Artworks in this gallery */}
        {artworks.length > 0 && (
          <div className="gallery-artworks-section">
            <ArtworkSection artworks={artworks} galleryName={gallery.name} />
          </div>
        )}

        {/* Empty state */}
        {childGalleries.length === 0 && artworks.length === 0 && (
          <div className="empty-state">
            <p>This gallery is empty</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
