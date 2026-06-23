import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { SUBJECTS_DB } from '../lib/content';
import { AkademiDB } from '../lib/db';
import { PastPaper } from '../types';

export default function Admin({ navigate, showToast }: any) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'papers'>('metrics');

  // Paper form
  const [title,     setTitle]     = useState('');
  const [year,      setYear]      = useState('');
  const [paperNum,  setPaperNum]  = useState('');
  const [level,     setLevel]     = useState<'o' | 'a'>('o');
  const [subjectId, setSubjectId] = useState('');
  const [fileUrl,   setFileUrl]   = useState('');

  // Metrics
  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [papers,      setPapers]      = useState<PastPaper[]>([]);

  useEffect(() => {
    (async () => {
      setAllProgress(await AkademiDB.getAllProgress());
      setPapers(await AkademiDB.getPastPapers());
    })();
  }, [activeTab]);

  const currentSubjects = SUBJECTS_DB.filter(s => s.level === level);

  const handleAddPaper = async () => {
    if (!title.trim() || !year || !paperNum || !subjectId) {
      showToast('Please fill all required fields');
      return;
    }
    if (!/^\d{4}$/.test(year)) {
      showToast('Year must be 4 digits');
      return;
    }
    const pNum = parseInt(paperNum);
    if (pNum < 1 || pNum > 6) {
      showToast('Paper number must be 1–6');
      return;
    }
    try {
      await AkademiDB.addPastPaper({
        subjectId,
        year: parseInt(year),
        paperNumber: pNum,
        level,
        fileUrl: fileUrl.trim() || '#',
        title: title.trim(),
      });
      const refreshed = await AkademiDB.getPastPapers();
      setPapers(refreshed);
      showToast('Paper added!');
      setTitle(''); setYear(''); setPaperNum(''); setSubjectId(''); setFileUrl('');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to add paper');
    }
  };

  const readComplete   = allProgress.filter(p => p.readComplete).length;
  const essaysGraded   = allProgress.filter(p => p.essayScore !== undefined).length;
  const papersAdded    = papers.length;

  return (
    <div className="bg-[var(--surface-light)] min-h-screen text-[var(--text-primary)] font-body">
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-black/5 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div className="font-bold text-lg">Admin Panel</div>
      </div>

      <div className="flex bg-white border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'metrics' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-muted)]'}`}
        >Metrics</button>
        <button
          onClick={() => setActiveTab('papers')}
          className={`flex-1 py-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'papers' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-muted)]'}`}
        >Past Papers</button>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {activeTab === 'metrics' && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Topics Read',   value: readComplete },
              { label: 'Essays Graded', value: essaysGraded },
              { label: 'Papers Added',  value: papersAdded },
              { label: 'XP Events',     value: allProgress.length },
            ].map(m => (
              <div key={m.label} className="bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">{m.label}</div>
                <div className="text-4xl font-display font-bold">{m.value}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'papers' && (
          <div className="bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm">
            <h2 className="font-bold text-xl mb-6">Add a past paper</h2>

            <div className="flex flex-col gap-4">
              {/* Level toggle */}
              <div>
                <label className="block text-sm font-semibold mb-2">Level</label>
                <div className="flex bg-[var(--surface-light)] p-1 rounded-xl border border-[var(--border)]">
                  <button onClick={() => { setLevel('o'); setSubjectId(''); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${level === 'o' ? 'bg-white shadow' : 'text-[var(--text-muted)]'}`}>O-Level</button>
                  <button onClick={() => { setLevel('a'); setSubjectId(''); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${level === 'a' ? 'bg-white shadow' : 'text-[var(--text-muted)]'}`}>A-Level</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Subject <span className="text-red-500">*</span></label>
                <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full border border-[var(--border)] rounded-xl p-3 bg-white text-[var(--text-primary)] outline-none focus:border-[var(--primary)]">
                  <option value="">Select subject</option>
                  {currentSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Title / Session <span className="text-red-500">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. November" className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none focus:border-[var(--primary)]" />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2">Year <span className="text-red-500">*</span></label>
                  <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2024" className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2">Paper <span className="text-red-500">*</span></label>
                  <input type="number" value={paperNum} onChange={e => setPaperNum(e.target.value)} placeholder="1" min="1" max="6" className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none focus:border-[var(--primary)]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">File URL <span className="text-[var(--text-muted)] font-normal">(optional — Cloudflare R2 link)</span></label>
                <input type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." className="w-full border border-[var(--border)] rounded-xl p-3 bg-white outline-none focus:border-[var(--primary)]" />
              </div>

              <button onClick={handleAddPaper} className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold mt-2">
                Add Paper
              </button>
            </div>

            {/* List of added papers */}
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
      </div>
    </div>
  );
}
