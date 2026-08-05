import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SUBJECTS_DB } from '../lib/content';
import { BottomNav } from '../components/BottomNav';
import { MessageSquare, Plus, X, ChevronRight } from 'lucide-react';

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return { 'Authorization': `Bearer ${session?.access_token ?? ''}`, 'Content-Type': 'application/json' };
}

export default function DiscussionGroups({ navigate, profile, showToast }: any) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchGroups(); }, [subjectFilter]);

  async function fetchGroups() {
    setLoading(true);
    const headers = await getAuthHeader();
    const url = subjectFilter ? `/api/discussion-groups?subjectId=${subjectFilter}` : '/api/discussion-groups';
    const res = await fetch(url, { headers });
    const data = await res.json();
    setGroups(data.groups ?? []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!name.trim() || !subjectId) { showToast('Name and subject are required'); return; }
    setCreating(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/discussion-groups', {
        method: 'POST', headers,
        body: JSON.stringify({ subjectId, name: name.trim(), description: description.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create group');
      showToast('Discussion group created!');
      setCreateOpen(false);
      setName(''); setSubjectId(''); setDescription('');
      fetchGroups();
      navigate(`/discussion/${data.group.id}`);
    } catch (e: any) {
      showToast(e.message ?? 'Something went wrong');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="bg-[var(--surface)] min-h-screen text-[var(--text-primary)] pb-24 font-body">
      <div className="pt-10 px-6 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={26} className="text-[var(--primary)]" />
            <h1 className="font-display font-bold text-3xl">Discussions</h1>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 bg-[var(--primary)] text-white px-4 py-2 rounded-full text-sm font-bold"
          >
            <Plus size={16} /> New
          </button>
        </div>

        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="bg-white border border-[var(--border)] px-4 py-2 rounded-full text-sm font-medium outline-none"
        >
          <option value="">All Subjects</option>
          {SUBJECTS_DB.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="p-6 max-w-2xl mx-auto flex flex-col gap-3">
        {loading ? (
          <div className="text-center text-[var(--text-muted)] py-16">Loading…</div>
        ) : groups.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] py-16">
            No discussion groups yet.{subjectFilter ? ' Try a different subject or ' : ' '}Be the first to create one!
          </div>
        ) : (
          groups.map(g => {
            const subject = SUBJECTS_DB.find(s => s.id === g.subject_id);
            return (
              <div
                key={g.id}
                onClick={() => navigate(`/discussion/${g.id}`)}
                className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm cursor-pointer hover:border-[var(--primary)] transition-colors flex items-center gap-3"
                style={{ borderLeft: `4px solid ${subject?.themeColor ?? '#ccc'}` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base truncate">{g.name}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {subject?.name ?? g.subject_id} · started by {g.creator?.name ?? 'a student'}
                  </div>
                  {g.description && <p className="text-sm text-[var(--text-muted)] mt-1.5 line-clamp-2">{g.description}</p>}
                </div>
                <ChevronRight size={18} className="text-[var(--text-muted)] shrink-0" />
              </div>
            );
          })
        )}
      </div>

      {/* Create group modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setCreateOpen(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-xl">New Discussion Group</h3>
              <button onClick={() => setCreateOpen(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Subject <span className="text-red-500">*</span></label>
                <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full border border-[var(--border)] rounded-xl p-3 outline-none focus:border-[var(--primary)]">
                  <option value="">Select subject</option>
                  {SUBJECTS_DB.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Group Name <span className="text-red-500">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Organic Chemistry Study Group" className="w-full border border-[var(--border)] rounded-xl p-3 outline-none focus:border-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Description <span className="text-xs text-[var(--text-muted)] font-normal">(optional)</span></label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border border-[var(--border)] rounded-xl p-3 outline-none resize-none focus:border-[var(--primary)]" />
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab="/discussions" onNavigate={navigate} />
    </div>
  );
}
