import { supabase } from '@/lib/supabase';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/Footer';
import PageHeader from '@/components/galleries/PageHeader';
import GalleryGrid from '@/components/galleries/GalleryGrid';
import { Gallery } from '@/types/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getGalleries(): Promise<Gallery[]> {
  const { data, error } = await supabase
    .from('galleries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching galleries:', error);
    return [];
  }

  return data as Gallery[];
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
