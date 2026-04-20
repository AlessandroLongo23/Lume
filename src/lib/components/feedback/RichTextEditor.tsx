'use client';

import { useCallback, useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Unlink,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string, plainText: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
}

const EDITOR_CLASSNAME =
  'prose prose-sm prose-zinc dark:prose-invert max-w-none focus:outline-none px-3 py-2.5';

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Scrivi…',
  disabled = false,
  minHeight = 120,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        codeBlock: false,
        link: false,
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: EDITOR_CLASSNAME,
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate({ editor }) {
      const html = editor.isEmpty ? '' : editor.getHTML();
      onChange(html, editor.getText());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    if (editor.isEditable === disabled) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  const promptLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const input = window.prompt('URL del link', previous ?? 'https://');
    if (input === null) return;
    if (input === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const href = /^(https?:|mailto:)/i.test(input) ? input : `https://${input}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }, [editor]);

  const unsetLink = useCallback(() => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
  }, [editor]);

  if (!editor) {
    return (
      <div
        className="rounded-md border border-zinc-500/25 bg-zinc-50 dark:bg-zinc-900 animate-pulse"
        style={{ minHeight: minHeight + 40 }}
      />
    );
  }

  const hasLink = editor.isActive('link');

  return (
    <div
      className={`flex flex-col rounded-md border border-zinc-500/25 bg-white dark:bg-zinc-900 overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40 ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: rgb(161 161 170);
          pointer-events: none;
          float: left;
          height: 0;
        }
        .tiptap:focus { outline: none; }
        .tiptap p { margin: 0; }
        .tiptap p + p { margin-top: 0.5em; }
        .tiptap ul, .tiptap ol { margin: 0.25em 0; padding-left: 1.25rem; }
        .tiptap ul { list-style: disc; }
        .tiptap ol { list-style: decimal; }
        .tiptap blockquote {
          margin: 0.5em 0;
          padding-left: 0.75rem;
          border-left: 2px solid rgb(228 228 231);
          color: rgb(82 82 91);
        }
        .dark .tiptap blockquote {
          border-left-color: rgb(63 63 70);
          color: rgb(212 212 216);
        }
        .tiptap code {
          background: rgb(244 244 245);
          padding: 0.1em 0.3em;
          border-radius: 0.25rem;
          font-size: 0.9em;
        }
        .dark .tiptap code {
          background: rgb(39 39 42);
        }
        .tiptap a {
          color: rgb(79 70 229);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .dark .tiptap a { color: rgb(129 140 248); }
      `}</style>

      <div className="flex flex-row items-center gap-0.5 flex-wrap px-2 py-1.5 border-b border-zinc-500/15 bg-zinc-50/50 dark:bg-zinc-800/40">
        <ToolbarButton
          label="Grassetto"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          disabled={disabled}
        >
          <Bold className="size-3.5" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          label="Corsivo"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          disabled={disabled}
        >
          <Italic className="size-3.5" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          label="Barrato"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          disabled={disabled}
        >
          <Strikethrough className="size-3.5" strokeWidth={2.25} />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-zinc-500/20" />

        <ToolbarButton
          label="Elenco puntato"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          disabled={disabled}
        >
          <List className="size-3.5" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          label="Elenco numerato"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          disabled={disabled}
        >
          <ListOrdered className="size-3.5" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          label="Citazione"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          disabled={disabled}
        >
          <Quote className="size-3.5" strokeWidth={2.25} />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-zinc-500/20" />

        <ToolbarButton
          label={hasLink ? 'Modifica link' : 'Inserisci link'}
          onClick={promptLink}
          active={hasLink}
          disabled={disabled}
        >
          <LinkIcon className="size-3.5" strokeWidth={2.25} />
        </ToolbarButton>
        {hasLink && (
          <ToolbarButton label="Rimuovi link" onClick={unsetLink} disabled={disabled}>
            <Unlink className="size-3.5" strokeWidth={2.25} />
          </ToolbarButton>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  active = false,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex items-center justify-center size-7 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
          : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/60'
      }`}
    >
      {children}
    </button>
  );
}
