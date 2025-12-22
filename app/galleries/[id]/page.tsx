import { supabase } from '@/lib/supabase';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/Footer';
import GalleryHeader from '@/components/gallery-detail/GalleryHeader';
import ArtworkSection from '@/components/gallery-detail/ArtworkSection';
import { ArtworkPost, Gallery } from '@/types/database';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getGallery(id: string): Promise<Gallery | null> {
  const { data, error } = await supabase
    .from('galleries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Gallery;
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

export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gallery = await getGallery(id);

  if (!gallery) {
    notFound();
  }

  const artworks = await getGalleryArtworks(id);

  return (
    <div className="gallery-detail-page">
      <Navbar />
      
      <main className="gallery-detail-content">
        <GalleryHeader name={gallery.name} />
        <ArtworkSection artworks={artworks} galleryName={gallery.name} />
      </main>

      <Footer />
    </div>
  );
}
