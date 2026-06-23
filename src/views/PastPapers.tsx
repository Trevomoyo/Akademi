import React, { useState, useEffect } from 'react';
import { BottomNav } from '../components/BottomNav';
import { SUBJECTS_DB } from '../lib/content';
import { AkademiDB } from '../lib/db';
import { PastPaper } from '../types';
import { Download, Lock } from 'lucide-react';

// Seed papers shown to everyone (public preview)
const SEED_PAPERS: PastPaper[] = [
  { id: 'seed-1', subjectId: 'chemistry',    year: 2023, paperNumber: 1, level: 'o', fileUrl: '#' },
  { id: 'seed-2', subjectId: 'chemistry',    year: 2023, paperNumber: 2, level: 'o', fileUrl: '#' },
  { id: 'seed-3', subjectId: 'mathematics',  year: 2022, paperNumber: 1, level: 'o', fileUrl: '#' },
  { id: 'seed-4', subjectId: 'physics',      year: 2023, paperNumber: 1, level: 'o', fileUrl: '#' },
  { id: 'seed-5', subjectId: 'biology',      year: 2022, paperNumber: 2, level: 'o', fileUrl: '#' },
  { id: 'seed-6', subjectId: 'a-pure-maths', year: 2023, paperNumber: 1, level: 'a', fileUrl: '#' },
  { id: 'seed-7', subjectId: 'a-chemistry',  year: 2022, paperNumber: 1, level: 'a', fileUrl: '#' },
];

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018];

export default function PastPapers({ navigate, profile }: any) {
  const [level, setLevel]             = useState<'o' | 'a'>('o');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [yearFilter, setYearFilter]   = useState('');
  const [papers, setPapers]           = useState<PastPaper[]>([]);

  useEffect(() => {
    AkademiDB.getPastPapers().then(dbPapers => {
      setPapers([...SEED_PAPERS, ...dbPapers]);
    });
  }, []);

  const currentSubjects = SUBJECTS_DB.filter(s => s.level === level);

  const filtered = papers.filter(p =>
    p.level === level &&
    (subjectFilter ? p.subjectId === subjectFilter : true) &&
    (yearFilter    ? p.year.toString() === yearFilter : true)
  );

  const handleDownload = (p: PastPaper) => {
    if (!profile) {
      navigate('/onboarding');
      return;
    }
    if (p.fileUrl && p.fileUrl !== '#') {
      window.open(p.fileUrl, '_blank');
    } else {
      // placeholder — real URL not yet uploaded
      alert('This paper is not yet available for download. Check back soon.');
    }
  };

  return (
    <div className="bg-[var(--surface)] min-h-screen text-[var(--text-primary)] pb-24 font-body">
      {/* Header */}
      <div className="pt-10 px-6 pb-4 bg-[var(--surface)] border-b border-[var(--border)]">
        <h1 className="font-display font-bold text-3xl mb-4">Past Papers</h1>

        {/* Level toggle */}
        <div className="flex bg-[var(--surface-light)] p-1 rounded-full w-max mb-5 border border-[var(--border)]">
          <button
            onClick={() => { setLevel('o'); setSubjectFilter(''); }}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${level === 'o' ? 'bg-white shadow text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
          >O-Level</button>
          <button
            onClick={() => { setLevel('a'); setSubjectFilter(''); }}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${level === 'a' ? 'bg-white shadow text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
          >A-Level</button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="bg-white border border-[var(--border)] px-4 py-2 rounded-full text-sm font-medium outline-none text-[var(--text-primary)] shrink-0"
          >
            <option value="">All Subjects</option>
            {currentSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="bg-white border border-[var(--border)] px-4 py-2 rounded-full text-sm font-medium outline-none text-[var(--text-primary)] shrink-0"
          >
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Paper list */}
      <div className="p-6 flex flex-col gap-4 max-w-2xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] py-16">
            No papers found — try different filters
          </div>
        ) : (
          filtered.map(p => {
            const sub = SUBJECTS_DB.find(s => s.id === p.subjectId);
            if (!sub) return null;
            const canDownload = !!profile;
            return (
              <div
                key={p.id}
                className="bg-white border border-[var(--border)] rounded-2xl flex items-center p-4 shadow-sm"
                style={{ borderLeft: `5px solid ${sub.themeColor}` }}
              >
                <div className="flex-1">
                  <div className="font-bold text-base">{sub.name}</div>
                  <div className="text-[var(--text-muted)] text-sm mt-0.5">{p.year} · Paper {p.paperNumber}</div>
                </div>
                <button
                  onClick={() => handleDownload(p)}
                  className="w-12 h-12 min-w-[48px] rounded-full bg-[var(--surface-light)] border border-[var(--border)] flex justify-center items-center hover:bg-[var(--primary)] hover:text-white transition-colors"
                >
                  {canDownload ? <Download size={18} /> : <Lock size={18} />}
                </button>
              </div>
            );
          })
        )}

        {!profile && filtered.length > 0 && (
          <div className="mt-4 bg-[var(--accent-warm-light)] border border-[var(--accent-warm)]/30 rounded-2xl p-5 text-center">
            <p className="text-sm font-semibold text-[#92400E] mb-3">Create a free account to download papers</p>
            <button
              onClick={() => navigate('/onboarding')}
              className="bg-[var(--accent-warm)] text-white px-6 py-2 rounded-full text-sm font-bold"
            >Get started free</button>
          </div>
        )}
      </div>

      <BottomNav activeTab="/pastpapers" onNavigate={navigate} />
    </div>
  );
}
