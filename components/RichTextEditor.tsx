'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Type, Palette } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const fontSizes = [
  { label: 'Small', value: '14px' },
  { label: 'Normal', value: '16px' },
  { label: 'Large', value: '20px' },
  { label: 'Extra Large', value: '24px' },
];

const presetColors = [
  { label: 'Default', value: null },
  { label: 'Black', value: '#1c1917' },
  { label: 'Gray', value: '#57534e' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Pink', value: '#db2777' },
  { label: 'Rose', value: '#e11d48' },
];

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const colorMenuRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [StarterKit, Underline, TextStyle, FontSize, Color],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none text-slate-700 bg-white',
      },
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target as Node)) {
        setShowColorMenu(false);
      }
    };
    if (showColorMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorMenu]);

  if (!editor) {
    return (
      <div className="rich-text-editor-wrapper">
        <div className="rich-text-toolbar rich-text-toolbar-placeholder" />
        <div className="rich-text-editor-placeholder" />
      </div>
    );
  }

  const buttonClass = (isActive: boolean) => 
    `rich-text-icon-button ${isActive ? 'active' : ''}`;

  const applyFontSize = (size: string) => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor.chain().focus() as any).setFontSize(size).run();
    setShowFontMenu(false);
  };

  const applyColor = (color: string | null) => {
    if (!editor) return;
    if (color === null) {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
    setShowColorMenu(false);
  };

  const currentColor = editor.getAttributes('textStyle').color ?? null;

  return (
    <div className="rich-text-editor-wrapper">
      <div className="rich-text-toolbar">
        {/* Font Size */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowFontMenu(!showFontMenu); setShowColorMenu(false); }}
            title="Font Size"
            className={`rich-text-button ${showFontMenu ? 'active' : ''}`}
          >
            <Type size={16} />
            <span>Size</span>
          </button>
          
          {showFontMenu && (
            <div className="rich-text-dropdown">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => applyFontSize(size.value)}
                  className="rich-text-dropdown-item"
                >
                  {size.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Color */}
        <div className="relative" ref={colorMenuRef}>
          <button
            type="button"
            onClick={() => { setShowColorMenu(!showColorMenu); setShowFontMenu(false); }}
            title="Text Color"
            className={`rich-text-button ${showColorMenu || currentColor ? 'active' : ''}`}
          >
            <Palette size={16} />
            <span>Color</span>
            {currentColor && (
              <span
                className="rich-text-color-dot"
                style={{ backgroundColor: currentColor }}
                aria-hidden
              />
            )}
          </button>
          {showColorMenu && (
            <div className="rich-text-dropdown rich-text-color-dropdown">
              <div className="rich-text-color-grid">
                {presetColors.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyColor(preset.value)}
                    className="rich-text-color-swatch"
                    title={preset.label}
                    style={preset.value ? { backgroundColor: preset.value } : undefined}
                    data-default={preset.value === null ? 'true' : undefined}
                  >
                    {preset.value === null ? 'A' : ''}
                  </button>
                ))}
              </div>
              <label className="rich-text-color-custom">
                <span>Custom</span>
                <input
                  type="color"
                  className="rich-text-color-input"
                  value={currentColor && /^#[0-9A-Fa-f]{6}$/.test(currentColor) ? currentColor : '#44403c'}
                  onChange={(e) => applyColor(e.target.value)}
                />
              </label>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-slate-300" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
          className={buttonClass(editor.isActive('bold'))}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
          className={buttonClass(editor.isActive('italic'))}
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
          className={buttonClass(editor.isActive('underline'))}
        >
          <UnderlineIcon size={16} />
        </button>
        
        <div className="rich-text-divider" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
          className={buttonClass(editor.isActive('bulletList'))}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
          className={buttonClass(editor.isActive('orderedList'))}
        >
          <ListOrdered size={16} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
