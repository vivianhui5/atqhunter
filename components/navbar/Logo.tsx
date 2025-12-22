import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="navbar-logo">
      <span className="logo-text">ATQ</span>
      <span className="logo-subtext">Hunter</span>
    </Link>
  );
}

