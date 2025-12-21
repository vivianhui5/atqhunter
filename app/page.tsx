import { supabase } from '@/lib/supabase';
import ArtworkGrid from '@/components/ArtworkGrid';
import Header from '@/components/Header';
import { ArtworkPost } from '@/types/database';

// Disable caching for this page to show latest posts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArtworks(): Promise<{ pinned: ArtworkPost[]; allArtworks: ArtworkPost[] }> {
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
    return { pinned: [], allArtworks: [] };
  }

  const artworks = data as ArtworkPost[];
  const pinned = artworks.filter(a => a.is_pinned);

  return { pinned, allArtworks: artworks };
}

export default async function HomePage() {
  const { pinned, allArtworks } = await getArtworks();

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 py-10 md:py-16">
        {/* Featured Section */}
        {pinned.length > 0 && (
          <section className="mb-16">
            <div className="mb-6">
              <h2 className="text-sm font-medium text-stone-500 tracking-wider">
                Featured
              </h2>
            </div>
            <ArtworkGrid artworks={pinned} />
          </section>
        )}

        {/* All Artwork Section */}
        <section>
          <div className="mb-8">
          <h2 className="text-sm font-medium text-stone-500 tracking-wider">
               Full Collection
              </h2>
          </div>
          
          <ArtworkGrid artworks={allArtworks} small={true} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/60 mt-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-base font-medium text-stone-700">ATQ Hunter</p>
            <p className="text-xs text-stone-400">© {new Date().getFullYear()} All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
