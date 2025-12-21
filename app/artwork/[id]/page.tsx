import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import { ArtworkPost } from '@/types/database';
import { notFound } from 'next/navigation';
import ArtworkDetail from '@/components/ArtworkDetail';

// Disable caching to show latest artwork data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArtwork(id: string): Promise<ArtworkPost | null> {
  const { data, error } = await supabase
    .from('artwork_posts')
    .select(`
      *,
      gallery:galleries(*),
      images:artwork_images(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data as ArtworkPost;
}

export default async function ArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artwork = await getArtwork(id);

  if (!artwork) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <ArtworkDetail artwork={artwork} />
      
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
