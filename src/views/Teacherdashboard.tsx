import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SUBJECTS_DB } from '../lib/content';
import { formLevelLabel } from '../lib/xp';
import { ArrowLeft, Plus, Users, Copy, ChevronRight, X } from 'lucide-react';

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return { 'Authorization': `Bearer ${session?.access_token ?? ''}`, 'Content-Type': 'application/json' };
}

const LEVEL_TABS: { key: 'zjc' | 'o' | 'a'; label: string; forms: number[] }[] = [
  { key: 'zjc', label: 'ZJC',     forms: [1, 2] },
  { key: 'o',   label: 'O-Level', forms: [3, 4] },
  { key: 'a',   label: 'A-Level', forms: [5, 6] },
];

export default function TeacherDashboard({ navigate, profile, showToast }: any) {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const [name, setName] = useState('');
  const [level, setLevel] = useState<'zjc' | 'o' | 'a'>('o');
  const [subjectId, setSubjectId] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchClassrooms(); }, []);

  async function fetchClassrooms() {
    const headers = await getAuthHeader();
    const res = await fetch('/api/teacher/classrooms', { headers });
    const data = await res.json();
    setClassrooms(data.classrooms ?? []);
    setLoading(false);
  }

  const currentSubjects = SUBJECTS_DB.filter(s => s.level === level);

  async function handleCreate() {
    if (!name.trim() || !subjectId) { showToast('Name and subject are required'); return; }
    setCreating(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/teacher/classrooms', {
        method: 'POST', headers,
        body: JSON.stringify({ name: name.trim(), subjectId, level, description: description.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create classroom');
      showToast(`Classroom created! Join code: ${data.classroom.join_code}`);
      setCreateOpen(false);
      setName(''); setSubjectId(''); setDescription('');
      fetchClassrooms();
    } catch (e: any) {
      showToast(e.message ?? 'Something went wrong');
    } finally {
      setCreating(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code);
    showToast(`Copied "${code}" to clipboard`);
  }

  return (
    <div className="bg-[var(--surface-light)] min-h-screen text-[var(--text-primary)] font-body pb-24">
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-black/5 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div className="font-bold text-lg">My Classrooms</div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 bg-[var(--primary)] text-white px-4 py-2 rounded-full text-sm font-bold"
        >
          <Plus size={16} /> New Class
        </button>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center text-[var(--text-muted)] py-16">Loading…</div>
        ) : classrooms.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-[var(--border)] text-center">
            <p className="text-[var(--text-muted)] mb-4">You haven't created any classrooms yet.</p>
            <button onClick={() => setCreateOpen(true)} className="bg-[var(--primary)] text-white px-6 py-3 rounded-full font-bold text-sm">
              Create your first classroom
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {classrooms.map(c => {
              const subject = SUBJECTS_DB.find(s => s.id === c.subject_id);
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/classroom/${c.id}`)}
                  className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm cursor-pointer hover:border-[var(--primary)] transition-colors"
                  style={{ borderLeft: `5px solid ${subject?.themeColor ?? '#ccc'}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-lg">{c.name}</div>
                    <ChevronRight size={18} className="text-[var(--text-muted)] shrink-0" />
                  </div>
                  <div className="text-sm text-[var(--text-muted)] mb-3">{subject?.name ?? c.subject_id} · {c.level.toUpperCase()}</div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={e => { e.stopPropagation(); copyCode(c.join_code); }}
                      className="flex items-center gap-1.5 bg-[var(--surface-light)] px-3 py-1.5 rounded-full text-xs font-bold text-[var(--primary)]"
                    >
                      <Copy size={12} /> {c.join_code}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create classroom modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setCreateOpen(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-xl">New Classroom</h3>
              <button onClick={() => setCreateOpen(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Level</label>
                <div className="flex bg-[var(--surface-light)] p-1 rounded-xl border border-[var(--border)]">
                  {LEVEL_TABS.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => { setLevel(tab.key); setSubjectId(''); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${level === tab.key ? 'bg-white shadow' : 'text-[var(--text-muted)]'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Subject <span className="text-red-500">*</span></label>
                <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full border border-[var(--border)] rounded-xl p-3 outline-none focus:border-[var(--primary)]">
                  <option value="">Select subject</option>
                  {currentSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Class Name <span className="text-red-500">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Form 4 Chemistry — Blue Group" className="w-full border border-[var(--border)] rounded-xl p-3 outline-none focus:border-[var(--primary)]" />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description <span className="text-xs text-[var(--text-muted)] font-normal">(optional)</span></label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border border-[var(--border)] rounded-xl p-3 outline-none resize-none focus:border-[var(--primary)]" />
              </div>

              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold disabled:opacity-50 mt-2"
              >
                {creating ? 'Creating…' : 'Create Classroom'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
