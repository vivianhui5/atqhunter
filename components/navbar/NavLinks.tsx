'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NavLinks() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);

  const loading = isPending || clicked;

  const handleClick = (e: React.MouseEvent) => {
    const isAlreadyHome = pathname === '/' && !searchParams.get('gallery');
    if (isAlreadyHome) return;

    e.preventDefault();
    setClicked(true);
    startTransition(() => {
      router.push('/');
    });
  };

  return (
    <div className="nav-links-group">
      <Link
        href="/"
        className={`nav-link ${pathname === '/' ? 'active' : ''}`}
        onClick={handleClick}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="nav-loading-spinner" />
            Loading…
          </>
        ) : (
          'Home'
        )}
      </Link>
    </div>
  );
}
