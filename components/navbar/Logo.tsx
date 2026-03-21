'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Logo() {
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
    <Link href="/" className="navbar-logo" onClick={handleClick}>
      {loading ? (
        <Loader2 size={20} className="nav-loading-spinner" />
      ) : null}
      <span className="logo-text" style={loading ? { opacity: 0.5 } : undefined}>ATQ</span>
      <span className="logo-subtext" style={loading ? { opacity: 0.5 } : undefined}>Hunter</span>
    </Link>
  );
}
