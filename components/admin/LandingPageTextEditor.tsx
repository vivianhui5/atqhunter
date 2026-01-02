'use client';

import { useState, useEffect } from 'react';
import { Edit2, Save, X, Loader2 } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';

export default function LandingPageTextEditor() {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchText();
    }, []);

    const fetchText = async () => {
        try {
            const res = await fetch('/api/site-settings?key=landing_page_text');
            const data = await res.json();
            if (data.settings && data.settings.length > 0) {
                setText(data.settings[0].value);
            }
        } catch (err) {
            console.error('Error fetching landing page text:', err);
            setError('Failed to load text');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/site-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: 'landing_page_text',
                    value: text
                }),
            });

            if (res.ok) {
                setIsEditing(false);
            } else {
                setError('Failed to save text');
            }
        } catch (err) {
            console.error('Error saving landing page text:', err);
            setError('Failed to save text');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-loading-container" style={{ padding: '2rem' }}>
                <Loader2 size={24} className="admin-spinner" />
            </div>
        );
    }

    return (
        <div className="admin-artwork-card" style={{ marginBottom: '2rem', overflow: 'hidden' }}>
            <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #e7e5e4',
                background: '#fafaf9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 className="admin-form-label" style={{ margin: 0, fontSize: '0.875rem' }}>Landing Page Welcome Text</h3>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="admin-secondary-button"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', height: 'auto' }}
                    >
                        <Edit2 size={14} />
                        <span>Edit</span>
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="admin-secondary-button"
                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', height: 'auto' }}
                            disabled={saving}
                        >
                            <X size={14} />
                            <span>Cancel</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="admin-primary-button"
                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', height: 'auto' }}
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            <span>Save</span>
                        </button>
                    </div>
                )}
            </div>

            <div style={{ padding: '1.5rem' }}>
                {error && (
                    <div style={{
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '6px',
                        color: '#DC2626',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                {isEditing ? (
                    <RichTextEditor content={text} onChange={setText} />
                ) : (
                    <div
                        className="prose prose-stone max-w-none text-stone-600 text-sm"
                        dangerouslySetInnerHTML={{ __html: text || '<p class="italic text-stone-400">No welcome text set.</p>' }}
                    />
                )}
            </div>
        </div>
    );
}
