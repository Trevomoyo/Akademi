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
import Blockquote from '@tiptap/extension-blockquote';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import TurndownService from 'turndown';
import { supabase } from '../lib/supabase';

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

// Preserve images as markdown ![alt](url)
td.addRule('images', {
  filter: 'img',
  replacement(_content, node: any) {
    const alt = node.getAttribute('alt') || 'diagram';
    const src = node.getAttribute('src') || '';
    return `\n\n![${alt}](${src})\n\n`;
  },
});

// Blockquote → "> " prefix (used for Key Point callouts)
td.addRule('blockquote', {
  filter: 'blockquote',
  replacement(content: string) {
    const text = content.replace(/\n+$/, '').trim();
    // Force single-line "> " format (Key Point callouts are always one line)
    return `\n\n> ${text}\n\n`;
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
  subjectName?: string;     // context for AI formatting/generation
  topicTitle?: string;      // context for AI formatting/generation
}

// ── Component ─────────────────────────────────────────────────
export default function RichEditor({ value, onChange, placeholder = 'Start writing...', minHeight = 320, subjectName, topicTitle }: RichEditorProps) {
  const [imageModalOpen, setImageModalOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  const [aiModalOpen, setAiModalOpen] = React.useState(false);
  const [aiMode, setAiMode] = React.useState<'format' | 'generate'>('format');
  const [aiRawText, setAiRawText] = React.useState('');
  const [aiInstructions, setAiInstructions] = React.useState('');
  const [aiWorking, setAiWorking] = React.useState(false);
  const [imageUploading, setImageUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Convert incoming markdown to basic HTML for TipTap
  // (TipTap works in HTML internally; we convert back to markdown on change)
  const mdToHtml = (md: string): string => {
    return md
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/!\[(.*?)\]\((.+?)\)/g, '<img src="$2" alt="$1" />')
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
      HorizontalRule, Blockquote,
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
      Image.configure({ HTMLAttributes: { class: 'rounded-xl max-w-full' } }),
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

  const insertKeyPoint = useCallback(() => {
    if (!editor) return;
    editor.chain().focus()
      .insertContent({
        type: 'blockquote',
        content: [{
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Key point: ' },
            { type: 'text', text: 'Type your key point here...' },
          ],
        }],
      })
      .run();
  }, [editor]);

  const handleAiFormat = useCallback(async () => {
    if (!editor) return;
    if (aiMode === 'format' && !aiRawText.trim()) return;
    if (aiMode === 'generate' && !topicTitle?.trim()) return;

    setAiWorking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/format-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          mode: aiMode,
          rawText: aiRawText,
          subjectName,
          topicTitle,
          instructions: aiInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'AI formatting failed');

      // Convert the returned markdown to HTML and load it into the editor
      const html = mdToHtml(data.markdown);
      editor.commands.setContent(html);
      onChange(data.markdown);

      setAiModalOpen(false);
      setAiRawText('');
      setAiInstructions('');
    } catch (e: any) {
      alert(e.message ?? 'AI formatting failed. Please try again.');
    } finally {
      setAiWorking(false);
    }
  }, [editor, aiMode, aiRawText, aiInstructions, subjectName, topicTitle, onChange]);

  const insertMath = useCallback(() => {
    const expr = prompt('Enter LaTeX expression (will be wrapped in $):');
    if (expr && editor) {
      editor.chain().focus().insertContent(`$${expr}$`).run();
    }
  }, [editor]);

  const insertImageFromUrl = useCallback(() => {
    if (imageUrl.trim() && editor) {
      editor.chain().focus().setImage({ src: imageUrl.trim(), alt: 'diagram' }).run();
      setImageUrl('');
      setImageModalOpen(false);
    }
  }, [editor, imageUrl]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!editor) return;
    setImageUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token ?? ''}` },
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Upload failed');

      editor.chain().focus().setImage({ src: data.url, alt: 'diagram' }).run();
      setImageModalOpen(false);
    } catch (e: any) {
      alert(e.message ?? 'Upload failed. Please try again.');
    } finally {
      setImageUploading(false);
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
      { label: '🖼 Image', title: 'Insert diagram / image', active: false, action: () => setImageModalOpen(true) },
      { label: '💡 Key Point', title: 'Insert Key Point callout box', active: editor.isActive('blockquote'), action: insertKeyPoint },
      { label: '✨ AI Format', title: 'Format or generate notes with AI', active: false, action: () => setAiModalOpen(true) },
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

      {/* Image insert modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setImageModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Insert Diagram</h3>

            {/* Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              className="w-full border-2 border-dashed border-[var(--border)] rounded-xl py-6 flex flex-col items-center gap-2 hover:border-[var(--primary)] transition-colors mb-4 disabled:opacity-50"
            >
              <span className="text-2xl">📤</span>
              <span className="text-sm font-semibold text-[var(--text-muted)]">
                {imageUploading ? 'Uploading…' : 'Click to upload an image'}
              </span>
              <span className="text-xs text-[var(--text-muted)]">PNG, JPG, WEBP, SVG — max 8MB</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />

            <div className="flex items-center gap-2 my-4">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-xs text-[var(--text-muted)] font-semibold">OR PASTE URL</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            {/* Paste URL */}
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && insertImageFromUrl()}
                placeholder="https://..."
                className="flex-1 border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
              <button
                type="button"
                onClick={insertImageFromUrl}
                disabled={!imageUrl.trim()}
                className="px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-bold disabled:opacity-40"
              >
                Insert
              </button>
            </div>

            <button
              type="button"
              onClick={() => setImageModalOpen(false)}
              className="w-full mt-4 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* AI Format / Generate modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => !aiWorking && setAiModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">✨ AI Notes Assistant</h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              {topicTitle ? `Topic: ${topicTitle}` : 'Set a topic title first for best results'}
            </p>

            {/* Mode toggle */}
            <div className="flex bg-[var(--surface-light)] p-1 rounded-xl border border-[var(--border)] mb-4">
              <button
                type="button"
                onClick={() => setAiMode('format')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${aiMode === 'format' ? 'bg-white shadow text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
              >
                Format my notes
              </button>
              <button
                type="button"
                onClick={() => setAiMode('generate')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${aiMode === 'generate' ? 'bg-white shadow text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
              >
                Write for me
              </button>
            </div>

            {aiMode === 'format' ? (
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Paste your rough notes</label>
                <textarea
                  value={aiRawText}
                  onChange={e => setAiRawText(e.target.value)}
                  placeholder="Paste unformatted notes, textbook content, or messy text here. The AI will clean it up, fix math notation, add headings, a Key Point, and an exercise section — without changing the facts."
                  rows={8}
                  className="w-full border border-[var(--border)] rounded-xl p-3 text-sm outline-none resize-none focus:border-[var(--primary)]"
                />
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
                The AI will write complete lesson notes from scratch for <strong className="text-[var(--text-primary)]">{topicTitle || '(set a topic title first)'}</strong>, including explanations, a worked example, a Key Point, and an exercise section.
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2">
                Extra instructions <span className="text-xs text-[var(--text-muted)] font-normal">(optional)</span>
              </label>
              <input
                value={aiInstructions}
                onChange={e => setAiInstructions(e.target.value)}
                placeholder="e.g. Focus on worked examples, keep it concise, emphasise the ZIMSEC exam angle..."
                className="w-full border border-[var(--border)] rounded-xl p-3 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-amber-600 text-sm shrink-0">⚠️</span>
              <p className="text-xs text-amber-800">
                This will <strong>replace</strong> the current editor content. Review the AI's output carefully before saving — always fact-check generated notes.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAiFormat}
              disabled={aiWorking || (aiMode === 'format' && !aiRawText.trim()) || (aiMode === 'generate' && !topicTitle?.trim())}
              className="w-full bg-[var(--primary)] text-white py-3.5 rounded-xl font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {aiWorking ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {aiMode === 'format' ? 'Formatting…' : 'Writing…'}
                </>
              ) : (
                aiMode === 'format' ? 'Format Notes' : 'Generate Notes'
              )}
            </button>

            <button
              type="button"
              onClick={() => !aiWorking && setAiModalOpen(false)}
              disabled={aiWorking}
              className="w-full mt-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
