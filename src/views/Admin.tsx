import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { SUBJECTS_DB } from '../lib/content';
import { AkademiDB } from '../lib/db';
import { supabase } from '../lib/supabase';
import { PastPaper } from '../types';
import RichEditor from '../components/RichEditor';

type Tab = 'metrics' | 'papers' | 'notes';

interface CustomTopic {
  id: string;
  subject_id: string;
  level: 'o' | 'a';
  title: string;
  summary: string;
  content_markdown: string;
  mcqs: any[];
  essay_prompt: string | null;
  essay_rubric: string[];
  read_xp: number;
  is_override: boolean;
  override_topic_id: string | null;
}

interface MCQDraft {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const emptyMCQ = (): MCQDraft => ({
  question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '',
});

export default function Admin({ navigate, showToast }: any) {
  const [activeTab, setActiveTab] = useState<Tab>('metrics');

  // ── Metrics ────────────────────────────────────────────────
  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [papers, setPapers] = useState<PastPaper[]>([]);

  // ── Papers ─────────────────────────────────────────────────
  const [pTitle, setPTitle] = useState('');
  const [pYear, setPYear] = useState('');
  const [pPaperNum, setPPaperNum] = useState('');
  const [pLevel, setPLevel] = useState<'o' | 'a'>('o');
  const [pSubjectId, setPSubjectId] = useState('');
  const [pFileUrl, setPFileUrl] = useState('');

  // ── Notes ──────────────────────────────────────────────────
  const [nLevel, setNLevel] = useState<'o' | 'a'>('o');
  const [nSubjectId, setNSubjectId] = useState('');
  const [nMode, setNMode] = useState<'new' | 'edit'>('new');
  const [nOverrideTopicId, setNOverrideTopicId] = useState('');
  const [nTitle, setNTitle] = useState('');
  const [nSummary, setNSummary] = useState('');
  const [nContent, setNContent] = useState('');
  const [nEssayPrompt, setNEssayPrompt] = useState('');
  const [nMCQs, setNMCQs] = useState<MCQDraft[]>([]);
  const [nReadXp, setNReadXp] = useState(10);
  const [customTopics, setCustomTopics] = useState<CustomTopic[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedMCQ, setExpandedMCQ] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setAllProgress(await AkademiDB.getAllProgress());
      setPapers(await AkademiDB.getPastPapers());
    })();
  }, [activeTab]);

  useEffect(() => {
    fetchCustomTopics();
  }, []);

  async function fetchCustomTopics() {
    const { data } = await supabase.from('custom_topics').select('*').order('created_at', { ascending: false });
    setCustomTopics(data ?? []);
  }

  async function getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    return { 'Authorization': `Bearer ${session?.access_token ?? ''}`, 'Content-Type': 'application/json' };
  }

  // ── Papers ─────────────────────────────────────────────────
  const handleAddPaper = async () => {
    if (!pTitle.trim() || !pYear || !pPaperNum || !pSubjectId) { showToast('Fill all required fields'); return; }
    if (!/^\d{4}$/.test(pYear)) { showToast('Year must be 4 digits'); return; }
    const pNum = parseInt(pPaperNum);
    if (pNum < 1 || pNum > 6) { showToast('Paper number must be 1–6'); return; }
    try {
      await AkademiDB.addPastPaper({ subjectId: pSubjectId, year: parseInt(pYear), paperNumber: pNum, level: pLevel, fileUrl: pFileUrl.trim() || '#', title: pTitle.trim() });
      setPapers(await AkademiDB.getPastPapers());
      showToast('Paper added!');
      setPTitle(''); setPYear(''); setPPaperNum(''); setPSubjectId(''); setPFileUrl('');
    } catch (e: any) { showToast(e.message ?? 'Failed'); }
  };

  // ── Notes: reset form ───────────────────────────────────────
  function resetNoteForm() {
    setNTitle(''); setNSummary(''); setNContent(''); setNEssayPrompt('');
    setNMCQs([]); setNReadXp(10); setNOverrideTopicId(''); setEditingId(null);
  }

  // ── Notes: load existing topic for editing ──────────────────
  function loadForEdit(ct: CustomTopic) {
    setNLevel(ct.level);
    setNSubjectId(ct.subject_id);
    setNMode(ct.is_override ? 'edit' : 'new');
    setNOverrideTopicId(ct.override_topic_id ?? '');
    setNTitle(ct.title);
    setNSummary(ct.summary);
    setNContent(ct.content_markdown);
    setNEssayPrompt(ct.essay_prompt ?? '');
    setNMCQs(ct.mcqs.map((q: any) => ({
      question: q.question ?? '',
      options: q.options ?? ['', '', '', ''],
      correctIndex: q.correctIndex ?? 0,
      explanation: q.explanation ?? '',
    })));
    setNReadXp(ct.read_xp);
    setEditingId(ct.id);
    setActiveTab('notes');
    window.scrollTo(0, 0);
  }

  // ── Notes: save ─────────────────────────────────────────────
  async function handleSaveTopic() {
    if (!nSubjectId) { showToast('Select a subject'); return; }
    if (!nTitle.trim()) { showToast('Title is required'); return; }
    if (!nContent.trim()) { showToast('Content is required'); return; }

    // Validate MCQs
    for (let i = 0; i < nMCQs.length; i++) {
      const q = nMCQs[i];
      if (!q.question.trim()) { showToast(`MCQ ${i + 1}: question is empty`); return; }
      if (q.options.some(o => !o.trim())) { showToast(`MCQ ${i + 1}: all 4 options required`); return; }
    }

    setSaving(true);
    const headers = await getAuthHeader();
    const payload = {
      subjectId: nSubjectId,
      level: nLevel,
      title: nTitle.trim(),
      summary: nSummary.trim(),
      contentMarkdown: nContent,
      mcqs: nMCQs.map(q => ({ ...q, options: q.options.map(o => o.trim()) })),
      essayPrompt: nEssayPrompt.trim() || null,
      readXp: nReadXp,
      isOverride: nMode === 'edit' && !!nOverrideTopicId,
      overrideTopicId: nMode === 'edit' && nOverrideTopicId ? nOverrideTopicId : null,
    };

    try {
      const url = editingId ? `/api/admin/topics/${editingId}` : '/api/admin/topics';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      showToast(editingId ? 'Topic updated!' : 'Topic saved!');
      resetNoteForm();
      fetchCustomTopics();
    } catch (e: any) {
      showToast(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTopic(id: string) {
    if (!confirm('Delete this topic? This cannot be undone.')) return;
    const headers = await getAuthHeader();
    const res = await fetch(`/api/admin/topics/${id}`, { method: 'DELETE', headers });
    if (res.ok) { showToast('Deleted'); fetchCustomTopics(); }
    else showToast('Delete failed');
  }

  // ── MCQ helpers ─────────────────────────────────────────────
  function updateMCQ(i: number, field: keyof MCQDraft, value: any) {
    setNMCQs(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  }
  function updateMCQOption(qi: number, oi: number, value: string) {
    setNMCQs(prev => prev.map((q, idx) => idx === qi ? { ...q, options: q.options.map((o, j) => j === oi ? value : o) } : q));
  }

  const currentSubjects = SUBJECTS_DB.filter(s => s.level === nLevel);
  const selectedSubject = SUBJECTS_DB.find(s => s.id === nSubjectId);
  const builtInTopics = selectedSubject?.topics ?? [];
  const readComplete = allProgress.filter(p => p.readComplete).length;
  const essaysGraded = allProgress.filter(p => p.essayScore !== undefined).length;
  const tc = 'var(--primary)';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'metrics', label: 'Metrics' },
    { key: 'papers', label: 'Past Papers' },
    { key: 'notes', label: 'Notes Editor' },
  ];

  return (
    <div className="bg-[var(--surface-light)] min-h-screen text-[var(--text-primary)] font-body pb-20">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-black/5 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div className="font-bold text-lg">Admin Panel</div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-white border-b border-[var(--border)] overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 min-w-[100px] py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === t.key ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-muted)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-3xl mx-auto">

        {/* ── METRICS ──────────────────────────────────── */}
        {activeTab === 'metrics' && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Topics Read', value: readComplete },
              { label: 'Essays Graded', value: essaysGraded },
              { label: 'Papers Added', value: papers.length },
              { label: 'Custom Topics', value: customTopics.length },
            ].map(m => (
              <div key={m.label} className="bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">{m.label}</div>
                <div className="text-4xl font-display font-bold">{m.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── PAST PAPERS ──────────────────────────────── */}
        {activeTab === 'papers' && (
          <div className="bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm">
            <h2 className="font-bold text-xl mb-6">Add a past paper</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Level</label>
                <div className="flex bg-[var(--surface-light)] p-1 rounded-xl border border-[var(--border)]">
                  <button onClick={() => { setPLevel('o'); setPSubjectId(''); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${pLevel === 'o' ? 'bg-white shadow' : 'text-[var(--text-muted)]'}`}>O-Level</button>
                  <button onClick={() => { setPLevel('a'); setPSubjectId(''); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${pLevel === 'a' ? 'bg-white shadow' : 'text-[var(--text-muted)]'}`}>A-Level</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Subject <span className="text-red-500">*</span></label>
                <select value={pSubjectId} onChange={e => setPSubjectId(e.target.value)} className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none focus:border-[var(--primary)]">
                  <option value="">Select subject</option>
                  {SUBJECTS_DB.filter(s => s.level === pLevel).map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Title / Session <span className="text-red-500">*</span></label>
                <input value={pTitle} onChange={e => setPTitle(e.target.value)} placeholder="e.g. November 2024" className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none focus:border-[var(--primary)]" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2">Year <span className="text-red-500">*</span></label>
                  <input type="number" value={pYear} onChange={e => setPYear(e.target.value)} placeholder="2024" className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2">Paper # <span className="text-red-500">*</span></label>
                  <input type="number" value={pPaperNum} onChange={e => setPPaperNum(e.target.value)} placeholder="1" min="1" max="6" className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none focus:border-[var(--primary)]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">File URL <span className="text-[var(--text-muted)] font-normal text-xs">(Google Drive or R2 link)</span></label>
                <input type="url" value={pFileUrl} onChange={e => setPFileUrl(e.target.value)} placeholder="https://..." className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none focus:border-[var(--primary)]" />
              </div>
              <button onClick={handleAddPaper} className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold">Add Paper</button>
            </div>

            {papers.length > 0 && (
              <div className="mt-8">
                <h3 className="font-bold text-sm uppercase text-[var(--text-muted)] tracking-wider mb-3">Added Papers ({papers.length})</h3>
                <div className="flex flex-col gap-2">
                  {papers.map(p => {
                    const sub = SUBJECTS_DB.find(s => s.id === p.subjectId);
                    return (
                      <div key={p.id} className="flex items-center p-3 border border-[var(--border)] rounded-xl text-sm" style={{ borderLeft: `4px solid ${sub?.themeColor || '#ccc'}` }}>
                        <div className="flex-1"><span className="font-semibold">{sub?.name || p.subjectId}</span> · {p.year} · Paper {p.paperNumber}</div>
                        <span className="text-xs text-[var(--text-muted)] uppercase">{p.level}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── NOTES EDITOR ─────────────────────────────── */}
        {activeTab === 'notes' && (
          <div className="flex flex-col gap-6">

            {/* Existing custom topics list */}
            {customTopics.length > 0 && !editingId && (
              <div className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm">
                <h3 className="font-bold text-base mb-4">Your Custom Topics ({customTopics.length})</h3>
                <div className="flex flex-col gap-2">
                  {customTopics.map(ct => {
                    const sub = SUBJECTS_DB.find(s => s.id === ct.subject_id);
                    return (
                      <div key={ct.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]" style={{ borderLeft: `4px solid ${sub?.themeColor ?? '#ccc'}` }}>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{ct.title}</div>
                          <div className="text-xs text-[var(--text-muted)]">{sub?.name ?? ct.subject_id} · {ct.level.toUpperCase()} {ct.is_override ? '· Override' : '· New topic'}</div>
                        </div>
                        <button onClick={() => loadForEdit(ct)} className="p-2 hover:bg-[var(--surface-light)] rounded-lg text-[var(--primary)] transition-colors">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDeleteTopic(ct.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Form */}
            <div className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl">{editingId ? 'Edit Topic' : 'New Topic'}</h2>
                {editingId && (
                  <button onClick={resetNoteForm} className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] underline">
                    Cancel edit
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-5">

                {/* Level + Subject */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Level</label>
                  <div className="flex bg-[var(--surface-light)] p-1 rounded-xl border border-[var(--border)] mb-3">
                    <button onClick={() => { setNLevel('o'); setNSubjectId(''); setNOverrideTopicId(''); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${nLevel === 'o' ? 'bg-white shadow' : 'text-[var(--text-muted)]'}`}>O-Level</button>
                    <button onClick={() => { setNLevel('a'); setNSubjectId(''); setNOverrideTopicId(''); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${nLevel === 'a' ? 'bg-white shadow' : 'text-[var(--text-muted)]'}`}>A-Level</button>
                  </div>
                  <select value={nSubjectId} onChange={e => { setNSubjectId(e.target.value); setNOverrideTopicId(''); }} className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none focus:border-[var(--primary)]">
                    <option value="">Select subject</option>
                    {currentSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>

                {/* New vs Override toggle */}
                {nSubjectId && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Topic type</label>
                    <div className="flex bg-[var(--surface-light)] p-1 rounded-xl border border-[var(--border)]">
                      <button onClick={() => { setNMode('new'); setNOverrideTopicId(''); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${nMode === 'new' ? 'bg-white shadow text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                        + Add new topic
                      </button>
                      <button onClick={() => setNMode('edit')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${nMode === 'edit' ? 'bg-white shadow text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                        ✎ Replace existing
                      </button>
                    </div>

                    {nMode === 'edit' && builtInTopics.length > 0 && (
                      <select value={nOverrideTopicId} onChange={e => {
                        setNOverrideTopicId(e.target.value);
                        const topic = builtInTopics.find((t: any) => t.id === e.target.value) as any;
                        if (topic && !nTitle) {
                          setNTitle(topic.title);
                          setNSummary(topic.summary ?? '');
                          setNContent(topic.contentMarkdown ?? '');
                        }
                      }} className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none focus:border-[var(--primary)] mt-3">
                        <option value="">Select topic to replace</option>
                        {builtInTopics.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                    )}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Topic Title <span className="text-red-500">*</span></label>
                  <input value={nTitle} onChange={e => setNTitle(e.target.value)} placeholder="e.g. Organic Chemistry: Alkanes and Alkenes" className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none focus:border-[var(--primary)]" />
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Learning objectives <span className="text-xs text-[var(--text-muted)] font-normal">(shown at the top of the lesson)</span></label>
                  <input value={nSummary} onChange={e => setNSummary(e.target.value)} placeholder="By the end of this topic, students should be able to..." className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none focus:border-[var(--primary)]" />
                </div>

                {/* Rich editor */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Notes Content <span className="text-red-500">*</span>
                    <span className="text-xs text-[var(--text-muted)] font-normal ml-2">Use $...$ for inline math, $$...$$ for display equations</span>
                  </label>
                  <RichEditor
                    value={nContent}
                    onChange={setNContent}
                    placeholder="Write full lesson notes here. Use the toolbar for headings, lists, tables, code blocks and math..."
                    minHeight={400}
                    subjectName={selectedSubject?.name}
                    topicTitle={nTitle}
                  />
                </div>

                {/* XP */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold">Read XP reward</label>
                  <input type="number" value={nReadXp} onChange={e => setNReadXp(parseInt(e.target.value) || 10)} min={5} max={100} className="w-24 border border-[var(--border)] rounded-xl p-2 text-center bg-white outline-none focus:border-[var(--primary)]" />
                </div>

                {/* Essay prompt */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Essay / Structured question <span className="text-[var(--text-muted)] font-normal text-xs">(optional)</span></label>
                  <textarea value={nEssayPrompt} onChange={e => setNEssayPrompt(e.target.value)} placeholder="e.g. With reference to the ZIMSEC syllabus, explain the importance of..." rows={3} className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none resize-none focus:border-[var(--primary)] text-sm" />
                </div>

                {/* MCQs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold">Multiple Choice Questions ({nMCQs.length})</label>
                    <button
                      onClick={() => { setNMCQs(prev => [...prev, emptyMCQ()]); setExpandedMCQ(nMCQs.length); }}
                      className="flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                    >
                      <Plus size={14} /> Add MCQ
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {nMCQs.map((q, qi) => (
                      <div key={qi} className="border border-[var(--border)] rounded-xl overflow-hidden">
                        {/* MCQ header */}
                        <div
                          className="flex items-center justify-between px-4 py-3 bg-[var(--surface-light)] cursor-pointer"
                          onClick={() => setExpandedMCQ(expandedMCQ === qi ? null : qi)}
                        >
                          <span className="text-sm font-semibold">Q{qi + 1}. {q.question.slice(0, 50) || 'Untitled question'}{q.question.length > 50 ? '…' : ''}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={e => { e.stopPropagation(); setNMCQs(prev => prev.filter((_, i) => i !== qi)); }} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 size={14} />
                            </button>
                            {expandedMCQ === qi ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>

                        {/* MCQ body */}
                        {expandedMCQ === qi && (
                          <div className="p-4 flex flex-col gap-3">
                            <input
                              value={q.question}
                              onChange={e => updateMCQ(qi, 'question', e.target.value)}
                              placeholder="Question text"
                              className="w-full border border-[var(--border)] rounded-xl p-3 text-sm outline-none focus:border-[var(--primary)]"
                            />
                            <div className="flex flex-col gap-2">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${qi}`}
                                    checked={q.correctIndex === oi}
                                    onChange={() => updateMCQ(qi, 'correctIndex', oi)}
                                    className="accent-[var(--primary)] shrink-0"
                                    title="Mark as correct answer"
                                  />
                                  <span className="text-xs font-bold text-[var(--text-muted)] w-5 shrink-0">{['A','B','C','D'][oi]}</span>
                                  <input
                                    value={opt}
                                    onChange={e => updateMCQOption(qi, oi, e.target.value)}
                                    placeholder={`Option ${['A','B','C','D'][oi]}`}
                                    className={`flex-1 border rounded-xl p-2.5 text-sm outline-none ${q.correctIndex === oi ? 'border-green-400 bg-green-50' : 'border-[var(--border)]'}`}
                                  />
                                </div>
                              ))}
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1 text-[var(--text-muted)]">Explanation (shown after student answers)</label>
                              <textarea
                                value={q.explanation}
                                onChange={e => updateMCQ(qi, 'explanation', e.target.value)}
                                placeholder="Explain why the correct answer is correct..."
                                rows={2}
                                className="w-full border border-[var(--border)] rounded-xl p-3 text-sm outline-none resize-none focus:border-[var(--primary)]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={handleSaveTopic}
                  disabled={saving}
                  className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold disabled:opacity-50 mt-2"
                >
                  {saving ? 'Saving…' : editingId ? 'Update Topic' : 'Save Topic'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
