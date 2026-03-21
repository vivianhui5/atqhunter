'use client';

import { Suspense } from 'react';
import Logo from './Logo';
import NavLinks from './NavLinks';
import SignInButton from './SignInButton';

export default function Navbar() {
  return (
    <header className="navbar-banner">
      <div className="navbar-content">
        <Suspense fallback={
          <a href="/" className="navbar-logo">
            <span className="logo-text">ATQ</span>
            <span className="logo-subtext">Hunter</span>
          </a>
        }>
          <Logo />
        </Suspense>
        <nav className="navbar-nav">
          <Suspense fallback={
            <div className="nav-links-group">
              <a href="/" className="nav-link">Home</a>
            </div>
          }>
            <NavLinks />
          </Suspense>
          <SignInButton />
        </nav>
      </div>
    </header>
  );
}
