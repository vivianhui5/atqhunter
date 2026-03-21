'use client';

import { useMemo, useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, X, Loader2 } from 'lucide-react';

interface InlinePasswordEditorProps {
  title: string;
  currentPassword: string | null;
  isSaving?: boolean;
  onCancel: () => void;
  onSave: (password: string | null) => Promise<void>;
}

export default function InlinePasswordEditor({
  title,
  currentPassword,
  isSaving = false,
  onCancel,
  onSave,
}: InlinePasswordEditorProps) {
  const [passwordDraft, setPasswordDraft] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const hasPassword = !!(currentPassword && currentPassword !== '');

  const statusText = useMemo(() => {
    if (isSaving) return 'Saving...';
    const typed = passwordDraft.trim();

    if (!hasPassword && typed === '') return 'Type a password below and click Set password.';
    if (!hasPassword && typed !== '') return 'Click Set password to apply this new password.';
    if (hasPassword && typed === '') return 'You have set this as a password.';
    return 'Click Set password to update this password.';
  }, [currentPassword, hasPassword, passwordDraft, isSaving]);

  const handleSave = async () => {
    setError('');
    const typed = passwordDraft.trim();

    if (hasPassword) {
      // Allow removing password by clearing + clicking Set
      if (typed === '') {
        await onSave(null);
        setPasswordDraft('');
        return;
      }
      if (typed.length < 3) {
        setError('Password must be at least 3 characters');
        return;
      }
      await onSave(typed);
      setPasswordDraft('');
      return;
    }

    if (typed === '') {
      setError('Please type a password or click Cancel');
      return;
    }
    if (typed.length < 3) {
      setError('Password must be at least 3 characters');
      return;
    }
    await onSave(typed);
    setPasswordDraft('');
  };

  const saveButtonLabel = useMemo(() => {
    if (isSaving) return 'Saving...';
    const typed = passwordDraft.trim();
    if (!hasPassword) return 'Set password';
    return typed === '' ? 'Remove password' : 'Update password';
  }, [hasPassword, isSaving, passwordDraft]);

  return (
    <>
      {/* Dim backdrop — click to cancel */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 9998,
        }}
      />

      {/* Bottom drawer panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#1f2937',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px 16px 0 0',
          padding: '1.25rem 1.25rem max(1.25rem, env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.5)',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
            {hasPassword ? <Lock size={18} style={{ color: '#f87171', flexShrink: 0 }} /> : <Unlock size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />}
            <span style={{ fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              flexShrink: 0,
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Input row */}
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={passwordDraft}
            onChange={(e) => {
              setPasswordDraft(e.target.value);
              setError('');
            }}
            className="admin-form-input"
            placeholder={hasPassword ? 'New password (leave empty to remove)' : 'Type a password'}
            autoComplete="new-password"
            autoFocus
            disabled={isSaving}
            style={{ paddingRight: '2.5rem' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isSaving}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Status text */}
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#d1d5db', fontWeight: 600 }}>
          {statusText}
        </div>
        {error && <div style={{ marginTop: '0.35rem', color: '#fca5a5', fontSize: '0.875rem', fontWeight: 700 }}>{error}</div>}

        {/* Action button */}
        <div style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            className="admin-primary-button"
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: '0.6rem 1.15rem', width: '100%', justifyContent: 'center' }}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="admin-spinner" />
                Saving...
              </>
            ) : (
              saveButtonLabel
            )}
          </button>
        </div>
      </div>
    </>
  );
}

