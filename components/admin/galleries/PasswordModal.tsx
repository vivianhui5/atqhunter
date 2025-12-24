'use client';

import { useState } from 'react';
import { X, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (password: string | null) => Promise<void>;
  currentPassword: string | null;
  galleryName: string;
  isSaving?: boolean;
}

export default function PasswordModal({
  isOpen,
  onClose,
  onSave,
  currentPassword,
  galleryName,
  isSaving = false,
}: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const hasPassword = currentPassword !== null && currentPassword !== '';

  const handleSave = async () => {
    setError('');
    
    if (hasPassword && password.trim() === '') {
      // Removing password
      await onSave(null);
      setPassword('');
      return;
    }

    if (!hasPassword && password.trim() === '') {
      setError('Please enter a password or click Cancel');
      return;
    }

    if (password.trim().length < 3) {
      setError('Password must be at least 3 characters');
      return;
    }

    await onSave(password.trim());
    setPassword('');
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={handleClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {hasPassword ? <Lock size={24} style={{ color: '#DC2626' }} /> : <Unlock size={24} style={{ color: '#78716c' }} />}
            <h2>Password Protection</h2>
          </div>
          <button 
            onClick={handleClose} 
            className="admin-modal-close" 
            aria-label="Close" 
            title="Close"
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </div>

        <div className="admin-modal-content">
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.9375rem', lineHeight: '1.6', color: '#57534e', marginBottom: '1rem' }}>
              {hasPassword ? (
                <>
                  Gallery <strong>&ldquo;{galleryName}&rdquo;</strong> has its own password protection.
                  {currentPassword && (
                    <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem', color: '#78716c' }}>
                      Note: If this gallery is inside a protected parent, both passwords will be required.
                    </span>
                  )}
                </>
              ) : (
                <>
                  Set a password to add additional protection to gallery <strong>&ldquo;{galleryName}&rdquo;</strong>.
                  <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem', color: '#78716c' }}>
                    If this gallery is inside a protected parent, this adds an extra layer of protection.
                  </span>
                </>
              )}
            </p>

            {hasPassword && (
              <div style={{ 
                background: '#FEF2F2', 
                border: '1px solid #FECACA', 
                borderRadius: '8px', 
                padding: '0.75rem',
                marginBottom: '1rem'
              }}>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#991B1B',
                  margin: 0,
                  fontWeight: 500
                }}>
                  Current password: <strong>{currentPassword}</strong>
                </p>
              </div>
            )}

            <div className="admin-form-group">
              <label htmlFor="password" className="admin-form-label">
                {hasPassword ? 'New Password (leave empty to remove)' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="admin-form-input"
                  placeholder={hasPassword ? 'Enter new password or leave empty to remove' : 'Enter password'}
                  autoFocus
                  disabled={isSaving}
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
          </div>

          <div className="admin-modal-footer">
            <button
              type="button"
              onClick={handleClose}
              className="admin-secondary-button"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="admin-primary-button"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : hasPassword ? (password.trim() === '' ? 'Remove Password' : 'Update Password') : 'Set Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

