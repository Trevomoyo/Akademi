import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import CodeBlock from '@tiptap/extension-code-block';
import HardBreak from '@tiptap/extension-hard-break';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TurndownService from 'turndown';

// ── Turndown instance (HTML → Markdown) ──────────────────────
const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// Preserve table markdown
td.addRule('tables', {
  filter: ['table'],
  replacement(_content, node: any) {
    const rows = Array.from(node.querySelectorAll('tr')) as HTMLElement[];
    if (rows.length === 0) return '';
    const headerCells = Array.from(rows[0].querySelectorAll('th,td')).map(
      (cell: any) => cell.textContent?.trim() ?? ''
    );
    const separator = headerCells.map(() => '---');
    const bodyRows = rows.slice(1).map(row =>
      Array.from(row.querySelectorAll('td')).map((cell: any) => cell.textContent?.trim() ?? '')
    );
    const lines = [
      `| ${headerCells.join(' | ')} |`,
      `| ${separator.join(' | ')} |`,
      ...bodyRows.map(r => `| ${r.join(' | ')} |`),
    ];
    return '\n\n' + lines.join('\n') + '\n\n';
  },
});

// Preserve code blocks with language
td.addRule('codeBlocks', {
  filter(node: any) {
    return node.nodeName === 'PRE' && node.firstChild?.nodeName === 'CODE';
  },
  replacement(_content, node: any) {
    const code = node.firstChild;
    const lang = code?.getAttribute('class')?.replace('language-', '') ?? '';
    return `\n\n\`\`\`${lang}\n${code?.textContent ?? ''}\n\`\`\`\n\n`;
  },
});

// ── Toolbar button ────────────────────────────────────────────
function ToolbarBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-30 ${
        active
          ? 'bg-[var(--primary)] text-white'
          : 'text-[var(--text-muted)] hover:bg-[var(--surface-light)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────
interface RichEditorProps {
  value: string;           // markdown string
  onChange: (md: string) => void;
  placeholder?: string;
  minHeight?: number;
}

// ── Component ─────────────────────────────────────────────────
export default function RichEditor({ value, onChange, placeholder = 'Start writing...', minHeight = 320 }: RichEditorProps) {
  // Convert incoming markdown to basic HTML for TipTap
  // (TipTap works in HTML internally; we convert back to markdown on change)
  const mdToHtml = (md: string): string => {
    return md
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`{3}(\w*)\n([\s\S]*?)`{3}/gm, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`)
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n+/g, '</p><p>')
      .replace(/^(?!<[h|u|o|l|p|c|h])(.+)$/gm, '<p>$1</p>');
  };

  const editor = useEditor({
    extensions: [
      Document, Paragraph, Text, HardBreak,
      Bold, Italic, Underline,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList, OrderedList, ListItem,
      CodeBlock.configure({ languageClassPrefix: 'language-' }),
      HorizontalRule,
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
    ],
    content: mdToHtml(value),
    onUpdate({ editor }) {
      const html = editor.getHTML();
      // Create a temporary DOM element to run turndown on
      const div = document.createElement('div');
      div.innerHTML = html;
      const markdown = td.turndown(div);
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none prose-content px-5 py-4',
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  const insertTable = useCallback(() => {
    editor?.chain().focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const insertMath = useCallback(() => {
    const expr = prompt('Enter LaTeX expression (will be wrapped in $):');
    if (expr && editor) {
      editor.chain().focus().insertContent(`$${expr}$`).run();
    }
  }, [editor]);

  if (!editor) return null;

  const toolbarGroups = [
    // Text style
    [
      { label: 'B', title: 'Bold (Ctrl+B)', active: editor.isActive('bold'), action: () => editor.chain().focus().toggleBold().run() },
      { label: 'I', title: 'Italic (Ctrl+I)', active: editor.isActive('italic'), action: () => editor.chain().focus().toggleItalic().run() },
      { label: 'U', title: 'Underline', active: editor.isActive('underline'), action: () => editor.chain().focus().toggleUnderline().run() },
    ],
    // Headings
    [
      { label: 'H1', title: 'Heading 1', active: editor.isActive('heading', { level: 1 }), action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
      { label: 'H2', title: 'Heading 2', active: editor.isActive('heading', { level: 2 }), action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
      { label: 'H3', title: 'Heading 3', active: editor.isActive('heading', { level: 3 }), action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    ],
    // Lists
    [
      { label: '• List', title: 'Bullet list', active: editor.isActive('bulletList'), action: () => editor.chain().focus().toggleBulletList().run() },
      { label: '1. List', title: 'Numbered list', active: editor.isActive('orderedList'), action: () => editor.chain().focus().toggleOrderedList().run() },
    ],
    // Blocks
    [
      { label: '</>  Code', title: 'Code block', active: editor.isActive('codeBlock'), action: () => editor.chain().focus().toggleCodeBlock().run() },
      { label: '—', title: 'Horizontal rule', active: false, action: () => editor.chain().focus().setHorizontalRule().run() },
      { label: '⊞ Table', title: 'Insert 3×3 table', active: editor.isActive('table'), action: insertTable },
      { label: '∑ Math', title: 'Insert math expression', active: false, action: insertMath },
    ],
  ];

  return (
    <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-light)]">
        {toolbarGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="w-px bg-[var(--border)] mx-1 self-stretch" />}
            {group.map((btn) => (
              <ToolbarBtn
                key={btn.label}
                onClick={btn.action}
                active={btn.active}
                title={btn.title}
              >
                {btn.label}
              </ToolbarBtn>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Editor area */}
      <div
        className="text-[var(--text-primary)] text-sm leading-relaxed cursor-text"
        onClick={() => editor.commands.focus()}
      >
        {!editor.getText() && (
          <div className="absolute px-5 pt-4 text-[var(--text-muted)] pointer-events-none select-none text-sm">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>

      {/* Table controls (shown only when inside a table) */}
      {editor.isActive('table') && (
        <div className="flex gap-2 px-3 py-2 border-t border-[var(--border)] bg-[var(--surface-light)] flex-wrap">
          <span className="text-xs text-[var(--text-muted)] self-center mr-1">Table:</span>
          {[
            { label: '+Col →', action: () => editor.chain().focus().addColumnAfter().run() },
            { label: '-Col', action: () => editor.chain().focus().deleteColumn().run() },
            { label: '+Row ↓', action: () => editor.chain().focus().addRowAfter().run() },
            { label: '-Row', action: () => editor.chain().focus().deleteRow().run() },
            { label: '✕ Table', action: () => editor.chain().focus().deleteTable().run() },
          ].map(btn => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.action}
              className="text-xs px-2 py-1 rounded bg-white border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
