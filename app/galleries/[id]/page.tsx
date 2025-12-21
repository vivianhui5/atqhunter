import { supabase } from '@/lib/supabase';
import ArtworkGrid from '@/components/ArtworkGrid';
import Header from '@/components/Header';
import { ArtworkPost, Gallery } from '@/types/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// Disable caching to show latest artworks
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getGallery(id: string): Promise<Gallery | null> {
  const { data, error } = await supabase
    .from('galleries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

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
    <div className="min-h-screen bg-stone-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-8 md:px-12 lg:px-16 py-10 md:py-16">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/galleries"
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors duration-300"
          >
            ← Back to Galleries
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-10 md:mb-14">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium text-stone-800 tracking-tight mb-3">
            {gallery.name}
          </h1>
          <p className="text-stone-500 text-sm md:text-base">
            {artworks.length} {artworks.length === 1 ? 'piece' : 'pieces'} in this collection
          </p>
        </div>
        
        {/* Artwork Grid */}
        <ArtworkGrid artworks={artworks} />
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/60 mt-16">
        <div className="max-w-6xl mx-auto px-8 md:px-12 lg:px-16 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-base font-medium text-stone-700">
              ATQ Hunter
            </p>
            <p className="text-xs text-stone-400">
              © {new Date().getFullYear()} All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
