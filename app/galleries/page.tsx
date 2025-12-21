import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import { Gallery } from '@/types/database';
import Link from 'next/link';

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
    <div className="min-h-screen bg-stone-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-8 md:px-12 lg:px-16 py-10 md:py-16">
        {/* Header Section */}
        <div className="mb-10 md:mb-14">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium text-stone-800 tracking-tight mb-3">
            Galleries
          </h1>
          <p className="text-stone-500 text-sm md:text-base max-w-xl">
            Explore our collections, each thoughtfully curated to showcase distinct artistic themes.
          </p>
        </div>
        
        {galleries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-400 text-sm tracking-wide">
              No galleries available yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {galleries.map((gallery) => (
              <Link
                key={gallery.id}
                href={`/galleries/${gallery.id}`}
                className="group block p-6 md:p-8 border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 transition-all duration-300"
              >
                <h2 className="text-lg md:text-xl font-medium text-stone-800 group-hover:text-stone-600 transition-colors duration-300 mb-2">
                  {gallery.name}
                </h2>
                <p className="text-xs text-stone-400">
                  View Collection →
                </p>
              </Link>
            ))}
          </div>
        )}
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
