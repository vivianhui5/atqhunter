import { supabase } from '@/lib/supabase';
import { ArtworkPost } from '@/types/database';
import Navbar from '@/components/navbar/Navbar';
import FeaturedSection from '@/components/home/FeaturedSection';
import CollectionSection from '@/components/home/CollectionSection';
import Footer from '@/components/Footer';

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
    <div className="home-page">
      <Navbar />
      
      <main className="main-content">
        <FeaturedSection artworks={pinned} />
        <CollectionSection artworks={allArtworks} />
      </main>

      <Footer />
    </div>
  );
}
