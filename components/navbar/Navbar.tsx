'use client';

import Logo from './Logo';
import NavLinks from './NavLinks';
import SignInButton from './SignInButton';

export default function Navbar() {
  return (
    <header className="navbar-banner">
      <div className="navbar-content">
        <Logo />
        <nav className="navbar-nav">
          <NavLinks />
          <SignInButton />
        </nav>
      </div>
    </header>
  );
}

