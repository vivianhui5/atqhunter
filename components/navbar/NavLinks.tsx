'use client';

import NavLink from './NavLink';

export default function NavLinks() {
  return (
    <div className="nav-links-group">
      <NavLink href="/">Full Collection</NavLink>
      <NavLink href="/galleries">Galleries</NavLink>
    </div>
  );
}

