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
        class: 'prose max-w-none focus:outline-none min-h-[140px] p-5 text-slate-700',
      },
    },
  });

  if (!editor) {
    return (
      <div className="bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-white border-b border-slate-200 p-3 h-12" />
        <div className="min-h-[140px] p-5 bg-slate-50" />
      </div>
    );
  }

  const buttonClass = (isActive: boolean) => 
    `w-9 h-9 rounded-lg flex items-center justify-center transition ${
      isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`;

  const applyFontSize = (size: string) => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor.chain().focus() as any).setFontSize(size).run();
    setShowFontMenu(false);
  };

  return (
    <div className="bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition">
      <div className="bg-white border-b border-slate-200 p-3 flex items-center gap-1.5">
        {/* Font Size */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFontMenu(!showFontMenu)}
            title="Font Size"
            className={`h-9 px-3 rounded-lg flex items-center gap-1.5 transition text-sm font-medium ${
              showFontMenu ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Type size={16} />
            Size
          </button>
          
          {showFontMenu && (
            <div className="absolute top-full left-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden z-10 min-w-[140px]">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => applyFontSize(size.value)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition text-slate-700 text-sm font-medium"
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
        
        <div className="w-px h-6 bg-slate-300" />
        
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
