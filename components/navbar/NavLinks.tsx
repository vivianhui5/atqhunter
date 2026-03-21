'use client';

import { usePathname, useSearchParams } from 'next/navigation';

export default function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHome = pathname === '/' && !searchParams.get('gallery');

  const handleClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      return;
    }
  };

  return (
    <div className="nav-links-group">
      <a
        href="/"
        className={`nav-link ${pathname === '/' ? 'active' : ''}`}
        onClick={handleClick}
      >
        Home
      </a>
    </div>
  );
}
