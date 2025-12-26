'use client';

import NavLink from './NavLink';

export default function NavLinks() {
  return (
    <div className="nav-links-group">
      <NavLink href="/">Home</NavLink>
      <NavLink href="/collection">Full Collection</NavLink>
    </div>
  );
}

