'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Type } from 'lucide-react';
import { useState } from 'react';

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

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [showFontMenu, setShowFontMenu] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Underline, TextStyle, FontSize],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none text-slate-700 bg-white',
      },
    },
  });

  if (!editor) {
    return (
      <div className="rich-text-editor-wrapper">
        <div className="rich-text-toolbar" style={{ height: '3rem' }} />
        <div style={{ minHeight: '140px', padding: '1.25rem', background: '#fafaf9' }} />
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

  return (
    <div className="rich-text-editor-wrapper">
      <div className="rich-text-toolbar">
        {/* Font Size */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFontMenu(!showFontMenu)}
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
