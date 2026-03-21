'use client';

import { usePathname, useSearchParams } from 'next/navigation';

export default function Logo() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHome = pathname === '/' && !searchParams.get('gallery');

  const handleClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      return;
    }
    // Allow default <a> navigation — triggers loading.tsx
  };

  return (
    <a href="/" className="navbar-logo" onClick={handleClick}>
      <span className="logo-text">ATQ</span>
      <span className="logo-subtext">Hunter</span>
    </a>
  );
}
