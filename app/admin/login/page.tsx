import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import { isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  // If already authenticated, redirect to admin page
  const adminAuthenticated = await isAdmin();
  if (adminAuthenticated) {
    redirect('/admin');
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo/Brand */}
        <Link href="/" className="login-brand">
          <span className="brand-primary">ATQ</span>
          <span className="brand-secondary">Hunter</span>
        </Link>

        {/* Login Card */}
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Restricted Access</h1>
          </div>

          <LoginForm />

          <div className="login-footer">
            <Link href="/" className="back-home-link">
              ← Back to Collection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
