'use client';

import { useCallback, useEffect, useMemo } from 'react';
import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
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
  type LucideIcon,
} from 'lucide-react';
import { Tooltip } from './Tooltip';
import { Button } from './Button';
import { formatShortcut } from '@/lib/utils/platform';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string, plainText: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
}

const EDITOR_CLASSNAME =
  'text-sm leading-relaxed text-[var(--lume-text)] focus:outline-none px-3 py-2.5';

function promptLinkOnEditor(editor: Editor): void {
  const previous = editor.getAttributes('link').href as string | undefined;
  const input = window.prompt('URL del link', previous ?? 'https://');
  if (input === null) return;
  if (input === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  const href = /^(https?:|mailto:)/i.test(input) ? input : `https://${input}`;
  editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
}

const LinkWithShortcut = Link.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-k': () => {
        promptLinkOnEditor(this.editor);
        return true;
      },
    };
  },
});

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Scrivi…',
  disabled = false,
  minHeight = 120,
}: RichTextEditorProps) {
  const shortcuts = useMemo(
    () => ({
      bold: formatShortcut({ mod: true, key: 'B' }),
      italic: formatShortcut({ mod: true, key: 'I' }),
      strike: formatShortcut({ mod: true, shift: true, key: 'S' }),
      bulletList: formatShortcut({ mod: true, shift: true, key: '8' }),
      orderedList: formatShortcut({ mod: true, shift: true, key: '7' }),
      blockquote: formatShortcut({ mod: true, shift: true, key: 'B' }),
      link: formatShortcut({ mod: true, key: 'K' }),
    }),
    [],
  );

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
      LinkWithShortcut.configure({
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

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor?.isActive('bold') ?? false,
      isItalic: editor?.isActive('italic') ?? false,
      isStrike: editor?.isActive('strike') ?? false,
      isBulletList: editor?.isActive('bulletList') ?? false,
      isOrderedList: editor?.isActive('orderedList') ?? false,
      isBlockquote: editor?.isActive('blockquote') ?? false,
      isLink: editor?.isActive('link') ?? false,
    }),
  }) ?? {
    isBold: false,
    isItalic: false,
    isStrike: false,
    isBulletList: false,
    isOrderedList: false,
    isBlockquote: false,
    isLink: false,
  };

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
    promptLinkOnEditor(editor);
  }, [editor]);

  const unsetLink = useCallback(() => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
  }, [editor]);

  if (!editor) {
    return (
      <div
        className="rounded-lg bg-hover shadow-[inset_0_0_0_1px_var(--lume-edge)] motion-safe:animate-pulse"
        style={{ minHeight: minHeight + 40 }}
      />
    );
  }

  return (
    // The shared field surface (`control`); the editable area is a div, not an
    // input, so focus is drawn with focus-within.
    <div
      aria-disabled={disabled || undefined}
      className="control flex flex-col overflow-hidden focus-within:shadow-[inset_0_0_0_1px_var(--lume-ring-focus),inset_0_0_0_3px_var(--lume-accent-muted)]"
    >
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--lume-text-muted);
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
          border-left: 2px solid var(--lume-edge);
          color: var(--lume-text-secondary);
        }
        .tiptap code {
          background: var(--lume-active);
          padding: 0.1em 0.3em;
          border-radius: var(--radius-sm);
          font-size: 0.9em;
        }
        .tiptap a {
          color: var(--lume-accent);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
      `}</style>

      <div className="flex flex-row items-center gap-0.5 flex-wrap px-1.5 py-1 border-b border-line">
        <ToolbarButton
          label="Grassetto"
          shortcut={shortcuts.bold}
          icon={Bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={toolbarState.isBold}
          disabled={disabled}
        />
        <ToolbarButton
          label="Corsivo"
          shortcut={shortcuts.italic}
          icon={Italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={toolbarState.isItalic}
          disabled={disabled}
        />
        <ToolbarButton
          label="Barrato"
          shortcut={shortcuts.strike}
          icon={Strikethrough}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={toolbarState.isStrike}
          disabled={disabled}
        />

        <div className="mx-1 h-4 w-px bg-line" />

        <ToolbarButton
          label="Elenco puntato"
          shortcut={shortcuts.bulletList}
          icon={List}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={toolbarState.isBulletList}
          disabled={disabled}
        />
        <ToolbarButton
          label="Elenco numerato"
          shortcut={shortcuts.orderedList}
          icon={ListOrdered}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={toolbarState.isOrderedList}
          disabled={disabled}
        />
        <ToolbarButton
          label="Citazione"
          shortcut={shortcuts.blockquote}
          icon={Quote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={toolbarState.isBlockquote}
          disabled={disabled}
        />

        <div className="mx-1 h-4 w-px bg-line" />

        <ToolbarButton
          label={toolbarState.isLink ? 'Modifica link' : 'Inserisci link'}
          shortcut={shortcuts.link}
          icon={LinkIcon}
          onClick={promptLink}
          active={toolbarState.isLink}
          disabled={disabled}
        />
        {toolbarState.isLink && (
          <ToolbarButton label="Rimuovi link" icon={Unlink} onClick={unsetLink} disabled={disabled} />
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  label,
  shortcut,
  icon: Icon,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip label={label} shortcut={shortcut} side="bottom">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label={label}
        tooltip={false}
        pressed={active}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        disabled={disabled}
      >
        <Icon />
      </Button>
    </Tooltip>
  );
}
