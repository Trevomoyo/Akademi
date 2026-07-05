import React, { useState, useEffect, useRef } from 'react';
import { SUBJECTS_DB } from '../lib/content';
import { AkademiDB } from '../lib/db';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, BookOpen, PenLine, ClipboardList, MessageCircle, X, ChevronRight, Lightbulb, AlertTriangle, CheckCircle, Target, Maximize2, Minimize2 } from 'lucide-react';
import { ThreeModelEmbed } from '../components/ThreeModelEmbed';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { calculateLevel, awardBadge } from '../lib/xp';
import confetti from 'canvas-confetti';

// ── Markdown + KaTeX renderer ──────────────────────────────────────────────

function renderMarkdownWithKaTeX(markdown: string, themeColor: string) {
  const segments: { text: string; math: boolean; display: boolean }[] = [];
  let remaining = markdown;
  const displayRe = /\$\$([\s\S]*?)\$\$/g;
  const inlineRe = /\$((?:[^$\\]|\\.)+?)\$/g;

  let last = 0;
  let m: RegExpExecArray | null;
  displayRe.lastIndex = 0;
  while ((m = displayRe.exec(remaining)) !== null) {
    if (m.index > last) segments.push({ text: remaining.slice(last, m.index), math: false, display: false });
    segments.push({ text: m[1], math: true, display: true });
    last = m.index + m[0].length;
  }
  segments.push({ text: remaining.slice(last), math: false, display: false });

  const finalSegments: { text: string; math: boolean; display: boolean }[] = [];
  for (const seg of segments) {
    if (seg.math) { finalSegments.push(seg); continue; }
    let l = 0;
    inlineRe.lastIndex = 0;
    while ((m = inlineRe.exec(seg.text)) !== null) {
      if (m.index > l) finalSegments.push({ text: seg.text.slice(l, m.index), math: false, display: false });
      finalSegments.push({ text: m[1], math: true, display: false });
      l = m.index + m[0].length;
    }
    finalSegments.push({ text: seg.text.slice(l), math: false, display: false });
  }

  // Parse table from markdown
  function parseTable(rows: string[]): React.ReactNode {
    const header = rows[0].split('|').map(c => c.trim()).filter(Boolean);
    const body = rows.slice(2).map(r => r.split('|').map(c => c.trim()).filter(Boolean));
    return (
      <div className="overflow-x-auto my-6 rounded-xl border border-[var(--border)] shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: themeColor + '18' }}>
              {header.map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-bold border-b border-[var(--border)]" style={{ color: themeColor }}>
                  {renderInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-[var(--surface-light)]'}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-3 border-b border-[var(--border)] last:border-b-0">
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderInline(text: string): React.ReactNode {
    const boldParts = text.split(/\*\*(.*?)\*\*/g);
    return boldParts.map((p, j) =>
      j % 2 === 1 ? <strong key={j} className="font-semibold">{p}</strong> : p
    );
  }

  return finalSegments.map((seg, index) => {
    if (seg.math) {
      try {
        const html = katex.renderToString(seg.text, { throwOnError: false, displayMode: seg.display });
        if (seg.display) {
          return (
            <div
              key={index}
              className="my-6 py-5 px-4 rounded-2xl overflow-x-auto text-center"
              style={{ backgroundColor: themeColor + '0D', border: `1px solid ${themeColor}30` }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return <span key={index} className="text-red-500 text-sm">[Math error]</span>;
      }
    }

    const lines = seg.text.split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Detect table block
      if (line.startsWith('|') && lines[i + 1]?.includes('---')) {
        const tableRows: string[] = [];
        while (i < lines.length && lines[i].startsWith('|')) {
          tableRows.push(lines[i]);
          i++;
        }
        nodes.push(<React.Fragment key={`table-${i}`}>{parseTable(tableRows)}</React.Fragment>);
        continue;
      }

      // H2
      if (line.startsWith('## ')) {
        nodes.push(
          <h2 key={i} className="font-display font-bold text-2xl mt-10 mb-4 pb-2" style={{ color: themeColor, borderBottom: `2px solid ${themeColor}30` }}>
            {line.slice(3)}
          </h2>
        );
      }
      // H3
      else if (line.startsWith('### ')) {
        nodes.push(
          <h3 key={i} className="font-display font-bold text-lg mt-7 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full inline-block shrink-0" style={{ backgroundColor: themeColor }} />
            {line.slice(4)}
          </h3>
        );
      }
      // H4
      else if (line.startsWith('#### ')) {
        nodes.push(
          <h4 key={i} className="font-bold text-base mt-5 mb-2 text-[var(--text-primary)]">
            {line.slice(5)}
          </h4>
        );
      }
      // Key point callout
      else if (line.startsWith('> **Key point:**')) {
        const content = line.replace('> **Key point:**', '').trim();
        nodes.push(
          <div key={i} className="flex gap-3 my-5 p-4 rounded-2xl" style={{ backgroundColor: themeColor + '12', border: `1.5px solid ${themeColor}40` }}>
            <Lightbulb size={18} className="shrink-0 mt-0.5" style={{ color: themeColor }} />
            <div className="text-sm leading-relaxed" style={{ color: themeColor }}>
              <span className="font-bold">Key Point: </span>{content}
            </div>
          </div>
        );
      }
      // Generic blockquote
      else if (line.startsWith('> ')) {
        nodes.push(
          <blockquote key={i} className="border-l-4 pl-4 py-1 my-4 italic text-[var(--text-muted)] text-sm" style={{ borderColor: themeColor }}>
            {renderInline(line.slice(2))}
          </blockquote>
        );
      }
      // Worked Example / Solution / Definition headers
      else if (/^\*\*Worked Example.*\*\*$/.test(line.trim()) || /^\*\*Example \d+.*\*\*$/.test(line.trim())) {
        nodes.push(
          <div key={i} className="mt-7 mb-3 flex items-center gap-2">
            <div className="h-px flex-1" style={{ backgroundColor: themeColor + '40' }} />
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ backgroundColor: themeColor + '15', color: themeColor }}>
              {line.replace(/\*\*/g, '')}
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: themeColor + '40' }} />
          </div>
        );
      }
      else if (/^\*\*Solution.*\*\*$/.test(line.trim())) {
        nodes.push(
          <div key={i} className="mt-4 mb-3 flex items-center gap-2">
            <CheckCircle size={15} style={{ color: themeColor }} />
            <span className="font-bold text-sm" style={{ color: themeColor }}>Solution</span>
          </div>
        );
      }
      else if (/^\*\*Definition.*\*\*$/.test(line.trim()) || /^\*\*Note.*\*\*$/.test(line.trim())) {
        const content = line.replace(/\*\*/g, '');
        nodes.push(
          <div key={i} className="flex gap-3 my-5 p-4 rounded-2xl bg-blue-50 border border-blue-200">
            <AlertTriangle size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <span className="text-sm text-blue-800 font-medium">{content}</span>
          </div>
        );
      }
      // Bullet list
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        const items: string[] = [];
        while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
          items.push(lines[i].slice(2));
          i++;
        }
        nodes.push(
          <ul key={`ul-${i}`} className="my-4 flex flex-col gap-2">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-base leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full mt-2.5 shrink-0" style={{ backgroundColor: themeColor }} />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }
      // Numbered list
      else if (/^\d+\. /.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) {
          items.push(lines[i].replace(/^\d+\. /, ''));
          i++;
        }
        nodes.push(
          <ol key={`ol-${i}`} className="my-4 flex flex-col gap-2 list-none">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-base leading-relaxed">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5" style={{ backgroundColor: themeColor }}>
                  {idx + 1}
                </span>
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }
      // HR
      else if (line.startsWith('---')) {
        nodes.push(<hr key={i} className="my-8 border-[var(--border)]" />);
      }
      // Empty line
      else if (line.trim() === '') {
        nodes.push(<div key={i} className="h-3" />);
      }
      // Normal paragraph line
      else {
        const boldParts = line.split(/\*\*(.*?)\*\*/g);
        nodes.push(
          <p key={i} className="text-base leading-[1.8] text-[var(--text-primary)]">
            {boldParts.map((p, j) => j % 2 === 1 ? <strong key={j} className="font-semibold">{p}</strong> : p)}
          </p>
        );
      }

      i++;
    }

    return <React.Fragment key={index}>{nodes}</React.Fragment>;
  });
}

// ── Lightweight markdown renderer for chat messages ───────────────────────
function renderChatMarkdown(text: string): React.ReactNode {
  // ── Step 1: extract fenced code blocks FIRST before any other processing ──
  // This prevents ``` from being processed as inline markdown
  const CODE_FENCE = /^```(\w*)\n?([\s\S]*?)```/gm;
  const parts: { type: 'text' | 'code'; content: string; lang?: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  CODE_FENCE.lastIndex = 0;
  while ((match = CODE_FENCE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', lang: match[1] || 'code', content: match[2].trimEnd() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  // ── Step 2: render each part ──────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-1">
      {parts.map((part, pi) => {
        if (part.type === 'code') {
          return (
            <div key={pi} className="my-2 rounded-xl overflow-hidden border border-[var(--border)]">
              {part.lang && part.lang !== 'code' && (
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#1A1714] text-[#A39E98]">
                  {part.lang}
                </div>
              )}
              <pre className="bg-[#12110E] text-[#E8E3DC] p-4 overflow-x-auto text-xs leading-relaxed font-mono whitespace-pre">
                {part.content}
              </pre>
            </div>
          );
        }

        // ── Text part — process line by line ─────────────────────────────
        const lines = part.content.split('\n');
        const nodes: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];
          const trimmed = line.trim();

          // Empty line
          if (!trimmed) { nodes.push(<div key={i} className="h-2" />); i++; continue; }

          // Headings ### ## #
          if (trimmed.startsWith('### ')) {
            nodes.push(<p key={i} className="font-bold text-base mt-3 mb-1 text-[var(--text-primary)]">{renderInline(trimmed.slice(4))}</p>);
            i++; continue;
          }
          if (trimmed.startsWith('## ')) {
            nodes.push(<p key={i} className="font-bold text-lg mt-4 mb-1 text-[var(--text-primary)]">{renderInline(trimmed.slice(3))}</p>);
            i++; continue;
          }
          if (trimmed.startsWith('# ')) {
            nodes.push(<p key={i} className="font-bold text-xl mt-4 mb-1 text-[var(--text-primary)]">{renderInline(trimmed.slice(2))}</p>);
            i++; continue;
          }

          // Horizontal rule --- (only if the whole line is dashes)
          if (/^-{3,}$/.test(trimmed)) {
            nodes.push(<hr key={i} className="my-3 border-[var(--border)]" />);
            i++; continue;
          }

          // Skip ASCII art tables (lines starting with |) — render as plain text instead
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            // Collect all consecutive pipe lines
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
              tableLines.push(lines[i].trim());
              i++;
            }
            // Try to render as a proper table if it has a separator row
            const hasSeparator = tableLines.some(l => /^\|[\s\-|:]+\|$/.test(l));
            if (hasSeparator && tableLines.length >= 3) {
              const headerCells = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
              const bodyRows = tableLines.slice(2).map(r => r.split('|').slice(1, -1).map(c => c.trim()));
              nodes.push(
                <div key={`table-${i}`} className="overflow-x-auto my-3 rounded-xl border border-[var(--border)] text-xs">
                  <table className="w-full">
                    <thead className="bg-[var(--surface-light)]">
                      <tr>{headerCells.map((h, hi) => <th key={hi} className="px-3 py-2 text-left font-bold border-b border-[var(--border)]">{renderInline(h)}</th>)}</tr>
                    </thead>
                    <tbody>
                      {bodyRows.map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-[var(--surface-light)]'}>
                          {row.map((cell, ci) => <td key={ci} className="px-3 py-2 border-b border-[var(--border)]">{renderInline(cell)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            } else {
              // ASCII art / diagram — render as code block
              nodes.push(
                <pre key={`ascii-${i}`} className="bg-[var(--surface-light)] border border-[var(--border)] rounded-xl p-3 text-xs overflow-x-auto font-mono my-2 text-[var(--text-muted)]">
                  {tableLines.join('\n')}
                </pre>
              );
            }
            continue;
          }

          // Numbered list
          if (/^\d+\.\s/.test(trimmed)) {
            const items: string[] = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
              items.push(lines[i].replace(/^\d+\.\s/, ''));
              i++;
            }
            nodes.push(
              <ol key={`ol-${i}`} className="flex flex-col gap-1.5 my-2">
                {items.map((item, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="font-bold shrink-0 text-[var(--text-muted)]">{idx + 1}.</span>
                    <span>{renderInline(item)}</span>
                  </li>
                ))}
              </ol>
            );
            continue;
          }

          // Bullet list (-, *, •)
          if (/^[-*•]\s/.test(trimmed)) {
            const items: string[] = [];
            while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
              items.push(lines[i].replace(/^[-*•]\s/, ''));
              i++;
            }
            nodes.push(
              <ul key={`ul-${i}`} className="flex flex-col gap-1.5 my-2">
                {items.map((item, idx) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] inline-block" />
                    <span>{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
            continue;
          }

          // Normal paragraph
          nodes.push(
            <p key={i} className="leading-relaxed text-[var(--text-primary)]">
              {renderInline(trimmed)}
            </p>
          );
          i++;
        }

        return <React.Fragment key={pi}>{nodes}</React.Fragment>;
      })}
    </div>
  );

  // ── Inline renderer: $math$, **bold**, *italic*, `code` ──────────────────
  function renderInline(text: string): React.ReactNode {
    // Remove lone stray backticks that aren't part of a pair
    const cleaned = text.replace(/(?<!`)`(?!`)/g, (match, offset, str) => {
      // Keep backtick only if there's a matching closing one
      const after = str.slice(offset + 1);
      return after.includes('`') ? match : '';
    });

    const tokens = cleaned.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\*\*[^*]+?\*\*|\*[^*\n]+?\*|`[^`]+?`)/g);
    return tokens.map((token, idx) => {
      // Display math $$...$$
      if (token.startsWith('$$') && token.endsWith('$$') && token.length > 4) {
        try {
          const html = katex.renderToString(token.slice(2, -2), { throwOnError: false, displayMode: true });
          return <span key={idx} className="block overflow-x-auto py-1 text-center" dangerouslySetInnerHTML={{ __html: html }} />;
        } catch { return <span key={idx} className="text-red-400 text-xs">[math error]</span>; }
      }
      // Inline math $...$
      if (token.startsWith('$') && token.endsWith('$') && token.length > 2) {
        try {
          const html = katex.renderToString(token.slice(1, -1), { throwOnError: false, displayMode: false });
          return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch { return <span key={idx} className="text-red-400 text-xs">[math error]</span>; }
      }
      if (token.startsWith('**') && token.endsWith('**'))
        return <strong key={idx} className="font-semibold">{token.slice(2, -2)}</strong>;
      if (token.startsWith('*') && token.endsWith('*'))
        return <em key={idx}>{token.slice(1, -1)}</em>;
      if (token.startsWith('`') && token.endsWith('`'))
        return <code key={idx} className="bg-[var(--surface-light)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[0.82em] font-mono">{token.slice(1, -1)}</code>;
      return <span key={idx}>{token}</span>;
    });
  }
}

// ── MCQ option label A B C D ───────────────────────────────────────────────
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

// ── Component ──────────────────────────────────────────────────────────────
export default function NotesView({ route, navigate, profile, showToast, onUpdateProfile }: any) {
  if (!profile) { navigate('/onboarding'); return null; }

  const idMatch = route.match(/\/lesson\/(.+)/);
  const topicId = idMatch ? idMatch[1] : null;

  let topic: any = null;
  let subject: any = null;
  for (const s of SUBJECTS_DB) {
    const t = s.topics.find((x: any) => x.id === topicId);
    if (t) { topic = t; subject = s; break; }
  }

  const hasPractice = (topic?.mcqs && topic.mcqs.length > 0) || !!topic?.essayPrompt;
  const [activeTab, setActiveTab] = useState<'notes' | 'practice'>('notes');
  const [progress, setProgress] = useState<any>(null);
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<number[]>([]);
  const [essayText, setEssayText] = useState('');
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFullscreen, setChatFullscreen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const tc = subject?.themeColor ?? '#1A6B5A';

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!topic) return;
    (async () => {
      const existing = await AkademiDB.getProgress(topic.id);
      const p = existing || { topicId: topic.id, readComplete: false, mcqScore: 0 };
      if (!p.readComplete) {
        const updatedProg = { ...p, readComplete: true };
        await AkademiDB.saveProgress(updatedProg);
        setProgress(updatedProg);
        onUpdateProfile({ ...profile, xp: (profile.xp || 0) + topic.readXP });
        showToast(`+${topic.readXP} XP`);
      } else {
        setProgress(p);
      }
    })();
  }, [topic?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatting]);

  if (!topic || !subject) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-[var(--text-muted)] mb-4">Lesson not found.</p>
          <button onClick={() => navigate('/dashboard')} className="text-[var(--primary)] font-semibold underline">Go back</button>
        </div>
      </div>
    );
  }

  const handleMcqSelect = async (optIndex: number) => {
    if (mcqAnswers[mcqIndex] !== undefined) return;
    const newAnswers = [...mcqAnswers];
    newAnswers[mcqIndex] = optIndex;
    setMcqAnswers(newAnswers);

    const isCorrect = optIndex === topic.mcqs[mcqIndex].correctIndex;
    let xpDelta = 0;
    if (isCorrect) { xpDelta += 25; showToast('+25 XP'); }

    if (mcqIndex === topic.mcqs.length - 1) {
      const correctCount = newAnswers.filter((a: number, i: number) => a === topic.mcqs[i].correctIndex).length;
      const pct = Math.round((correctCount / topic.mcqs.length) * 100);
      const newProg = { ...progress, mcqScore: Math.max(progress?.mcqScore || 0, pct) };
      await AkademiDB.saveProgress(newProg);
      setProgress(newProg);
      if (pct === 100) {
        xpDelta += 150;
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => showToast('🎉 Perfect Score! +150 XP'), 500);
        awardBadge('perfect_score');
      }
      if (topic.id === 'chem-benzene') awardBadge('benzene_master');
      if (topic.hasMathEquations) awardBadge('equation_king');
    }

    if (xpDelta > 0) {
      const prevLevel = calculateLevel(profile.xp);
      const newXp = profile.xp + xpDelta;
      const newLevel = calculateLevel(newXp);
      onUpdateProfile({ ...profile, xp: newXp });
      if (newLevel > prevLevel) setTimeout(() => showToast(`🎉 Level up! Level ${newLevel}`), 1500);
    }
  };

  const submitEssay = async () => {
    if (!essayText.trim()) return;
    setGrading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/grade-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ topicId: topic.id, topicTitle: topic.title, essay: essayText, prompt: topic.essayPrompt, rubric: topic.essayRubric }),
      });
      const data = await res.json();
      setGradeResult(data);
      const scorePct = Math.round(data.score ?? 0);
      const newProg = { ...(progress || { topicId: topic.id, readComplete: false, mcqScore: 0 }), essayScore: Math.max((progress?.essayScore || 0), scorePct) };
      await AkademiDB.saveProgress(newProg);
      setProgress(newProg);
      showToast('+50 XP (Essay Submitted)');
      awardBadge('essayist');
      if (scorePct >= 80) { awardBadge('top_grade'); showToast('Top Grade! +100 XP'); }
      onUpdateProfile({ ...profile, xp: profile.xp + 50 + (scorePct >= 80 ? 100 : 0) });
    } catch { showToast('Error grading essay'); }
    finally { setGrading(false); }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    const newMsg = { role: 'user', content: chatMessage };
    setChatHistory(prev => [...prev, newMsg]);
    setChatMessage('');
    setIsChatting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ message: newMsg.content, history: chatHistory, topicTitle: topic.title, subjectName: subject?.name }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setChatHistory(prev => [...prev, { role: 'model', content: data.error ?? 'Something went wrong. Please try again.' }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'model', content: data.reply }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatHistory(prev => [...prev, { role: 'model', content: 'Network error — check your connection and try again.' }]);
    } finally { setIsChatting(false); }
  };

  const mcqProgress = topic.mcqs?.length > 0
    ? Math.round((mcqAnswers.filter((a: number, i: number) => a === topic.mcqs[i]?.correctIndex).length / topic.mcqs.length) * 100)
    : 0;

  return (
    <div className="bg-[var(--surface)] min-h-screen font-body pb-24 relative">

      {/* ── STICKY HEADER ─────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(`/subject/${subject.id}`)} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>

          {/* Tab bar */}
          {hasPractice ? (
            <div className="flex bg-[var(--surface-light)] rounded-full p-0.5 border border-[var(--border)]">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'notes' ? 'text-white shadow-sm' : 'text-[var(--text-muted)]'}`}
                style={activeTab === 'notes' ? { backgroundColor: tc } : {}}
              >
                <BookOpen size={13} /> Notes
              </button>
              <button
                onClick={() => setActiveTab('practice')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'practice' ? 'text-white shadow-sm' : 'text-[var(--text-muted)]'}`}
                style={activeTab === 'practice' ? { backgroundColor: tc } : {}}
              >
                <ClipboardList size={13} /> Practice
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5" style={{ color: tc }}>
              <BookOpen size={14} />
              <span className="text-xs font-bold">Notes</span>
            </div>
          )}

          <div className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: tc + '18', color: tc }}>
            {progress?.readComplete ? '✓ Read' : 'Reading'}
          </div>
        </div>
      </div>

      {/* ── HERO BANNER ───────────────────────────────── */}
      <div
        className="relative px-6 pt-8 pb-12 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${tc}, ${tc}cc)` }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-10 bg-white" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 mb-4">
            <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">{subject.name}</span>
            {subject.code && <span className="text-white/60 text-xs">· {subject.code}</span>}
          </div>
          <h1 className="font-display text-2xl font-bold text-white leading-snug mb-2">
            {topic.title}
          </h1>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
              <Target size={12} className="text-white/80" />
              <span className="text-white/90 text-xs font-medium">+{topic.readXP} XP</span>
            </div>
            {topic.mcqs?.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                <ClipboardList size={12} className="text-white/80" />
                <span className="text-white/90 text-xs font-medium">{topic.mcqs.length} questions</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT CARD ──────────────────────────────── */}
      <div className="bg-[var(--surface)] rounded-t-3xl -mt-6 relative z-10 shadow-sm min-h-screen">

        {/* ── NOTES TAB ─────────────────────────────── */}
        {activeTab === 'notes' && (
          <div className="px-5 pt-6 pb-10 max-w-2xl mx-auto">

            {/* Objectives */}
            <div className="flex gap-3 p-4 rounded-2xl mb-8" style={{ backgroundColor: tc + '10', border: `1.5px solid ${tc}30` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: tc }}>
                <Target size={15} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: tc }}>Learning Objectives</p>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">{topic.summary}</p>
              </div>
            </div>

            {/* Main content */}
            <div className="prose-content">
              {renderMarkdownWithKaTeX(topic.contentMarkdown, tc)}
            </div>

            {topic.hasThreeDModel && (
              <div className="my-8 rounded-2xl overflow-hidden border border-[var(--border)]">
                <ThreeModelEmbed modelType={topic.hasThreeDModel as any} />
              </div>
            )}

            {/* Go to Practice CTA */}
            {hasPractice && (
              <button
                onClick={() => setActiveTab('practice')}
                className="mt-10 w-full flex items-center justify-between text-white px-6 py-4 rounded-2xl font-bold shadow-lg transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${tc}, ${tc}cc)` }}
              >
                <div className="flex items-center gap-2">
                  <ClipboardList size={18} />
                  <span>Go to Practice Questions</span>
                </div>
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        )}

        {/* ── PRACTICE TAB ──────────────────────────── */}
        {activeTab === 'practice' && (
          <div className="px-5 pt-6 pb-10 max-w-2xl mx-auto flex flex-col gap-10">

            {/* MCQ section */}
            {topic.mcqs && topic.mcqs.length > 0 && (
              <div>
                {/* Progress bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={18} style={{ color: tc }} />
                    <span className="font-display font-bold text-lg">Multiple Choice</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    {mcqIndex + 1} / {topic.mcqs.length}
                  </span>
                </div>

                {/* Progress dots */}
                <div className="flex gap-1.5 mb-6">
                  {topic.mcqs.map((_: any, idx: number) => (
                    <div
                      key={idx}
                      className="h-1.5 flex-1 rounded-full transition-all"
                      style={{
                        backgroundColor: mcqAnswers[idx] !== undefined
                          ? (mcqAnswers[idx] === topic.mcqs[idx].correctIndex ? '#22c55e' : '#ef4444')
                          : idx === mcqIndex ? tc : 'var(--border)',
                      }}
                    />
                  ))}
                </div>

                {/* Question */}
                <div className="p-5 rounded-2xl mb-5" style={{ backgroundColor: tc + '08', border: `1px solid ${tc}20` }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: tc }}>Question {mcqIndex + 1}</p>
                  <p className="font-medium text-base leading-relaxed text-[var(--text-primary)]">
                    {topic.mcqs[mcqIndex].question}
                  </p>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-3 mb-4">
                  {topic.mcqs[mcqIndex].options.map((opt: string, i: number) => {
                    const hasAnswered = mcqAnswers[mcqIndex] !== undefined;
                    const isSelected = mcqAnswers[mcqIndex] === i;
                    const isCorrect = topic.mcqs[mcqIndex].correctIndex === i;

                    let bg = 'bg-white border-[var(--border)]';
                    let labelBg = tc + '20';
                    let labelColor = tc;
                    if (hasAnswered) {
                      if (isCorrect) { bg = 'bg-green-50 border-green-400'; labelBg = '#22c55e'; labelColor = '#fff'; }
                      else if (isSelected) { bg = 'bg-red-50 border-red-400'; labelBg = '#ef4444'; labelColor = '#fff'; }
                      else { bg = 'bg-white border-[var(--border)] opacity-50'; }
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleMcqSelect(i)}
                        disabled={hasAnswered}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all ${bg} font-medium text-sm`}
                      >
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                          style={{ backgroundColor: labelBg, color: labelColor }}
                        >
                          {OPTION_LABELS[i]}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {mcqAnswers[mcqIndex] !== undefined && (
                  <div className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 mb-4 animate-fade-in">
                    <Lightbulb size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <span className="font-bold">Explanation: </span>
                      {topic.mcqs[mcqIndex].explanation}
                    </div>
                  </div>
                )}

                {/* Next / Complete */}
                {mcqAnswers[mcqIndex] !== undefined && mcqIndex < topic.mcqs.length - 1 && (
                  <button
                    onClick={() => setMcqIndex(i => i + 1)}
                    className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: tc }}
                  >
                    Next Question <ChevronRight size={18} />
                  </button>
                )}

                {mcqAnswers[mcqIndex] !== undefined && mcqIndex === topic.mcqs.length - 1 && (
                  <div
                    className="mt-4 p-5 rounded-2xl text-center"
                    style={{ backgroundColor: tc + '10', border: `1.5px solid ${tc}30` }}
                  >
                    <div className="text-3xl font-display font-bold mb-1" style={{ color: tc }}>
                      {mcqProgress}%
                    </div>
                    <p className="text-sm font-medium text-[var(--text-muted)]">
                      {mcqAnswers.filter((a: number, i: number) => a === topic.mcqs[i].correctIndex).length} / {topic.mcqs.length} correct
                    </p>
                    <button
                      onClick={() => { setMcqIndex(0); setMcqAnswers([]); }}
                      className="mt-4 text-xs font-bold underline"
                      style={{ color: tc }}
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Essay section */}
            {topic.essayPrompt && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <PenLine size={18} style={{ color: tc }} />
                  <span className="font-display font-bold text-lg">Structured Question</span>
                </div>

                <div className="p-5 rounded-2xl mb-5" style={{ backgroundColor: tc + '08', border: `1px solid ${tc}20` }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: tc }}>Question</p>
                  <p className="text-sm leading-relaxed text-[var(--text-primary)]">{topic.essayPrompt}</p>
                  {topic.essayRubric?.length > 0 && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: tc + '30' }}>
                      <p className="text-xs font-bold mb-2" style={{ color: tc }}>Award marks for:</p>
                      <ul className="flex flex-col gap-1">
                        {topic.essayRubric.map((r: string, i: number) => (
                          <li key={i} className="text-xs text-[var(--text-muted)] flex gap-2">
                            <span className="font-bold" style={{ color: tc }}>[{i + 1}]</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <textarea
                  value={essayText}
                  onChange={e => setEssayText(e.target.value)}
                  placeholder="Write your answer here. Be specific and use examples..."
                  className="w-full h-52 p-4 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] resize-none text-sm leading-relaxed focus:outline-none focus:border-[var(--primary)] font-body mb-4 transition-colors"
                  style={{ '--tw-ring-color': tc } as any}
                />

                <button
                  onClick={submitEssay}
                  disabled={grading || !essayText.trim()}
                  className="w-full py-4 rounded-xl font-bold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: tc }}
                >
                  {grading ? 'Grading with AI…' : 'Submit for AI Grading'}
                </button>

                {gradeResult && (
                  <div className="mt-6 animate-fade-in">
                    {/* Score card */}
                    <div
                      className="p-5 rounded-2xl mb-4 flex items-center gap-4"
                      style={{ backgroundColor: tc + '10', border: `1.5px solid ${tc}30` }}
                    >
                      <div>
                        <div className="text-4xl font-display font-bold" style={{ color: tc }}>{gradeResult.score}</div>
                        <div className="text-xs text-[var(--text-muted)]">out of 100</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold mb-1">{gradeResult.grade}</div>
                        <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${gradeResult.score}%`, backgroundColor: tc }} />
                        </div>
                      </div>
                    </div>

                    <p className="text-sm bg-[var(--surface-light)] p-4 rounded-xl border border-[var(--border)] leading-relaxed mb-4">
                      {gradeResult.feedback}
                    </p>

                    {gradeResult.strengths?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-2">Strengths</p>
                        <ul className="flex flex-col gap-1.5">
                          {gradeResult.strengths.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {gradeResult.improvements?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-2">Improve On</p>
                        <ul className="flex flex-col gap-1.5">
                          {gradeResult.improvements.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <AlertTriangle size={14} className="text-orange-400 shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FLOATING TUTOR ────────────────────────────── */}

      {/* FAB button — only show when chat is closed */}
      {!chatOpen && (
        <div className="fixed bottom-6 right-4 z-50">
          <button
            onClick={() => setChatOpen(true)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
            style={{ backgroundColor: tc }}
          >
            <MessageCircle size={22} className="text-white" />
          </button>
        </div>
      )}

      {/* Chat panel — renders as floating window OR fullscreen */}
      {chatOpen && (
        <div
          className={`
            z-50 bg-[var(--surface)] flex flex-col overflow-hidden animate-fade-in
            ${chatFullscreen
              ? 'fixed inset-0'
              : 'fixed bottom-6 right-4 w-80 h-[420px] rounded-2xl border border-[var(--border)] shadow-2xl'
            }
          `}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between text-white shrink-0"
            style={{ backgroundColor: tc }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={16} />
              <span className={`font-bold ${chatFullscreen ? 'text-base' : 'text-sm'}`}>
                AI Tutor · {topic.title.split(':')[0]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Expand / collapse */}
              <button
                onClick={() => setChatFullscreen(f => !f)}
                className="hover:opacity-70 transition-opacity p-1"
                title={chatFullscreen ? 'Minimise' : 'Fullscreen'}
              >
                {chatFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              {/* Close */}
              <button
                onClick={() => { setChatOpen(false); setChatFullscreen(false); }}
                className="hover:opacity-70 transition-opacity p-1"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto flex flex-col bg-[var(--surface)] ${chatFullscreen ? 'px-6 py-4 gap-5 max-w-2xl w-full mx-auto' : 'p-3 gap-3'}`}>

            {/* Empty state — quick prompts */}
            {chatHistory.length === 0 && (
              <div className="flex flex-col gap-2 my-auto">
                <p className={`text-center text-[var(--text-muted)] ${chatFullscreen ? 'text-sm' : 'text-xs'}`}>
                  Ask anything — I'm here to help 👋
                </p>
                {[
                  'Explain the key concept simply',
                  'Give me a worked example',
                  'What might ZIMSEC ask on this?',
                  'I\'m stressed about exams, any advice?',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => setChatMessage(q)}
                    className={`text-left px-3 py-2 rounded-xl border bg-[var(--surface-light)] hover:bg-white transition-colors ${chatFullscreen ? 'text-sm' : 'text-xs'}`}
                    style={{ borderColor: tc + '40', color: tc }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Message list */}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'user' ? (
                  // User — bubble
                  <div
                    className={`text-white rounded-2xl rounded-tr-sm leading-relaxed max-w-[80%] ${chatFullscreen ? 'px-5 py-3 text-sm' : 'px-3 py-2.5 text-xs max-w-[85%]'}`}
                    style={{ backgroundColor: tc }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  // AI — no bubble, just text with a subtle name label
                  <div className={`w-full ${chatFullscreen ? 'text-sm' : 'text-xs'}`}>
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: tc }}
                    >
                      Tutor
                    </p>
                    <div className="text-[var(--text-primary)] leading-relaxed">
                      {renderChatMarkdown(msg.content)}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isChatting && (
              <div className="flex flex-col items-start">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: tc }}>Tutor</p>
                <div className="flex gap-1 py-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: tc, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className={`border-t border-[var(--border)] flex gap-2 bg-[var(--surface)] shrink-0 ${chatFullscreen ? 'px-6 py-4 max-w-2xl w-full mx-auto' : 'p-3'}`}>
            <input
              type="text"
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
              placeholder="Ask the tutor..."
              className={`flex-1 bg-[var(--surface-light)] border border-[var(--border)] rounded-full outline-none transition-colors ${chatFullscreen ? 'px-5 py-3 text-sm' : 'px-3 py-2 text-xs'}`}
            />
            <button
              onClick={sendChatMessage}
              disabled={isChatting || !chatMessage.trim()}
              className={`rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0 ${chatFullscreen ? 'w-12 h-12' : 'w-9 h-9'}`}
              style={{ backgroundColor: tc }}
            >
              <Send size={chatFullscreen ? 18 : 14} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
