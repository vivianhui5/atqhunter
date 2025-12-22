'use client';

export default function SignInButton() {
  return (
    <button 
      onClick={() => window.location.href = '/admin/login'}
      className="sign-in-button"
    >
      Sign In
    </button>
  );
}

