'use client';

import { useState } from 'react';
import { Lock, X, Eye, EyeOff } from 'lucide-react';

interface PasswordPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  title: string;
  isVerifying?: boolean;
  error?: string;
}

export default function PasswordPrompt({
  isOpen,
  onClose,
  onSubmit,
  title,
  isVerifying = false,
  error,
}: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password);
      setPassword('');
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <div className="password-prompt-overlay" onClick={handleClose}>
      <div className="password-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="password-prompt-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Lock size={24} style={{ color: '#DC2626' }} />
            <h2>ID: {title} is password protected</h2>
          </div>
          <button 
            onClick={handleClose} 
            className="password-prompt-close" 
            aria-label="Close"
            disabled={isVerifying}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="password-prompt-content">
          <p style={{ fontSize: '0.9375rem', lineHeight: '1.6', color: '#57534e', marginBottom: '1.5rem' }}>
            <strong>ID: {title}</strong> is password protected. Please enter the password to continue.
          </p>

          <div className="admin-form-group">
            <label htmlFor="password-input" className="admin-form-label">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-form-input"
                placeholder="Enter password"
                autoFocus
                disabled={isVerifying}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#78716c',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <p style={{ fontSize: '0.875rem', color: '#DC2626', marginTop: '0.5rem', margin: 0 }}>
                {error}
              </p>
            )}
          </div>

          <div className="password-prompt-footer">
            <button
              type="button"
              onClick={handleClose}
              className="admin-secondary-button"
              disabled={isVerifying}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-primary-button"
              disabled={isVerifying || !password.trim()}
            >
              {isVerifying ? 'Verifying...' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

