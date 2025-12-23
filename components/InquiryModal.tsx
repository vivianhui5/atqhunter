'use client';

import { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkTitle: string;
}

export default function InquiryModal({ isOpen, onClose, artworkTitle }: InquiryModalProps) {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);

    try {
      const res = await fetch('/api/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: email,
          subject,
          message,
          artworkTitle,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setEmail('');
          setSubject('');
          setMessage('');
        }, 2000);
      } else {
        const data = await res.json().catch(() => ({ error: 'Unknown error occurred' }));
        setError(data.error || 'Failed to send inquiry');
        console.error('Inquiry error:', data);
      }
    } catch (err) {
      console.error('Inquiry exception:', err);
      setError('Failed to send inquiry. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onClose();
      setError('');
      setSuccess(false);
    }
  };

  return (
    <div className="inquiry-modal-overlay" onClick={handleClose}>
      <div className="inquiry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inquiry-modal-header">
          <h2 className="inquiry-modal-title">Inquire About This Artwork</h2>
          <button
            onClick={handleClose}
            className="inquiry-modal-close"
            disabled={sending}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="inquiry-success">
            <div className="inquiry-success-icon">✓</div>
            <p className="inquiry-success-text">Message sent successfully!</p>
            <p className="inquiry-success-subtext"> If you sent a relevant inquiry, Dr. Kai Hui will respond shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="inquiry-form">
            <div className="inquiry-artwork-info">
              Regarding: <strong>{artworkTitle}</strong>
            </div>

            {error && (
              <div className="inquiry-error">
                {error}
              </div>
            )}

            <div className="inquiry-form-group">
              <label htmlFor="inquiry-email" className="inquiry-label">
                Your Email *
              </label>
              <input
                id="inquiry-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="inquiry-input"
                required
                disabled={sending}
              />
            </div>

            <div className="inquiry-form-group">
              <label htmlFor="inquiry-subject" className="inquiry-label">
                Subject *
              </label>
              <input
                id="inquiry-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Purchase inquiry, Questions about the piece"
                className="inquiry-input"
                required
                disabled={sending}
              />
            </div>

            <div className="inquiry-form-group">
              <label htmlFor="inquiry-message" className="inquiry-label">
                Message *
              </label>
              <textarea
                id="inquiry-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi, I'm interested in this artwork..."
                className="inquiry-textarea"
                rows={6}
                required
                disabled={sending}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="inquiry-submit-button"
            >
              {sending ? (
                <>
                  <Loader2 size={20} className="inquiry-spinner" />
                  Sending...
                </>
              ) : (
                <>
                  Send Inquiry
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

