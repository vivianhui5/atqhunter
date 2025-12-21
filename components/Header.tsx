'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-stone-50/95 backdrop-blur-sm border-b border-stone-200/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8 md:px-12 lg:px-16">
        <div className="flex justify-between items-center py-5 md:py-6">
          {/* Logo */}
          <Link href="/" className="group">
            <h1 className="text-xl md:text-2xl font-medium tracking-tight text-stone-800">
              ATQ Hunter
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            <Link
              href="/"
              className={`text-xs sm:text-sm md:text-base tracking-wider uppercase font-medium transition-colors duration-300 whitespace-nowrap ${
                pathname === '/'
                  ? 'text-stone-900'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              Full Collection
            </Link>
            
            <div className="w-px h-6 bg-stone-300 mx-8 md:mx-12 lg:mx-16"></div>
            
            <Link
              href="/galleries"
              className={`text-xs sm:text-sm md:text-base tracking-wider uppercase font-medium transition-colors duration-300 whitespace-nowrap ${
                pathname.startsWith('/galleries')
                  ? 'text-stone-900'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              Galleries
            </Link>
            
            <div className="w-px h-6 bg-stone-300 mx-8 md:mx-12 lg:mx-16"></div>
            
            <button
              onClick={() => window.location.href = '/admin/login'}
              className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base tracking-wide font-semibold bg-stone-800 text-white hover:bg-stone-700 transition-all duration-300 rounded-lg shadow-md hover:shadow-lg whitespace-nowrap"
            >
              SIGN IN
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
