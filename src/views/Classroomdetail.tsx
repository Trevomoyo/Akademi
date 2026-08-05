import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SUBJECTS_DB } from '../lib/content';
import { ArrowLeft, Copy, Users, Send, Plus, Trash2, X, Calendar } from 'lucide-react';
import RichEditor from '../components/RichEditor';

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return { 'Authorization': `Bearer ${session?.access_token ?? ''}`, 'Content-Type': 'application/json' };
}

type Tab = 'feed' | 'assignments' | 'roster';

export default function ClassroomDetail({ route, navigate, profile, showToast }: any) {
  const idMatch = route.match(/\/classroom\/(.+)/);
  const classroomId = idMatch ? idMatch[1] : null;

  const [classroom, setClassroom] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('feed');

  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addUsername, setAddUsername] = useState('');

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMode, setAssignMode] = useState<'custom' | 'existing'>('custom');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignContent, setAssignContent] = useState('');
  const [assignTopicId, setAssignTopicId] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assigning, setAssigning] = useState(false);

  const isTeacherOwner = profile?.isTeacher;

  useEffect(() => { if (classroomId) fetchAll(); }, [classroomId]);

  async function fetchAll() {
    setLoading(true);
    const headers = await getAuthHeader();

    // Get classroom info — teachers list their own, students get it via "mine"
    let found: any = null;
    if (profile?.isTeacher) {
      const res = await fetch('/api/teacher/classrooms', { headers });
      const data = await res.json();
      found = (data.classrooms ?? []).find((c: any) => c.id === classroomId);
    }
    if (!found) {
      const res = await fetch('/api/classrooms/mine', { headers });
      const data = await res.json();
      found = (data.classrooms ?? []).find((c: any) => c.id === classroomId);
    }
    setClassroom(found);

    const [postsRes, assignRes] = await Promise.all([
      fetch(`/api/classrooms/${classroomId}/posts`, { headers }),
      fetch(`/api/classrooms/${classroomId}/assignments`, { headers }),
    ]);
    setPosts((await postsRes.json()).posts ?? []);
    setAssignments((await assignRes.json()).assignments ?? []);

    if (found && profile?.isTeacher && found.teacher_id === profile.id) {
      const membersRes = await fetch(`/api/teacher/classrooms/${classroomId}/members`, { headers });
      setMembers((await membersRes.json()).members ?? []);
    }

    setLoading(false);
  }

  async function handlePost() {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/teacher/classrooms/${classroomId}/posts`, {
        method: 'POST', headers, body: JSON.stringify({ content: newPost.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to post');
      setPosts(prev => [{ ...data.post, author: { id: profile.id, name: profile.name } }, ...prev]);
      setNewPost('');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to post');
    } finally {
      setPosting(false);
    }
  }

  async function handleAddMember() {
    if (!addUsername.trim()) return;
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/teacher/classrooms/${classroomId}/add-member`, {
        method: 'POST', headers, body: JSON.stringify({ username: addUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add student');
      showToast('Student added!');
      setAddUsername('');
      setAddMemberOpen(false);
      fetchAll();
    } catch (e: any) {
      showToast(e.message ?? 'Failed to add student');
    }
  }

  async function handleRemoveMember(studentId: string) {
    if (!confirm('Remove this student from the class?')) return;
    const headers = await getAuthHeader();
    await fetch(`/api/teacher/classrooms/${classroomId}/members/${studentId}`, { method: 'DELETE', headers });
    fetchAll();
  }

  async function handleCreateAssignment() {
    if (assignMode === 'custom' && (!assignTitle.trim() || !assignContent.trim())) {
      showToast('Title and content are required'); return;
    }
    if (assignMode === 'existing' && !assignTopicId) {
      showToast('Select a topic'); return;
    }
    setAssigning(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/teacher/classrooms/${classroomId}/assignments`, {
        method: 'POST', headers,
        body: JSON.stringify({
          topicRefId: assignMode === 'existing' ? assignTopicId : null,
          customTitle: assignMode === 'custom' ? assignTitle.trim() : null,
          customContentMarkdown: assignMode === 'custom' ? assignContent : null,
          dueDate: assignDueDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create assignment');
      showToast('Assignment created!');
      setAssignOpen(false);
      setAssignTitle(''); setAssignContent(''); setAssignTopicId(''); setAssignDueDate('');
      fetchAll();
    } catch (e: any) {
      showToast(e.message ?? 'Failed to create assignment');
    } finally {
      setAssigning(false);
    }
  }

  function copyCode() {
    navigator.clipboard?.writeText(classroom.join_code);
    showToast(`Copied "${classroom.join_code}"`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-[var(--text-muted)] mb-4">Classroom not found or you don't have access.</p>
          <button onClick={() => navigate('/dashboard')} className="text-[var(--primary)] font-semibold underline">Go back</button>
        </div>
      </div>
    );
  }

  const subject = SUBJECTS_DB.find(s => s.id === classroom.subject_id);
  const isOwner = profile?.isTeacher && classroom.teacher_id === profile.id;
  const allTopics = subject?.topics ?? [];

  return (
    <div className="bg-[var(--surface-light)] min-h-screen text-[var(--text-primary)] font-body pb-24">
      {/* Header */}
      <div
        className="px-6 pt-8 pb-6 text-white"
        style={{ background: `linear-gradient(135deg, ${subject?.themeColor ?? '#1A6B5A'}, ${subject?.themeColor ?? '#1A6B5A'}cc)` }}
      >
        <button onClick={() => navigate(isOwner ? '/teacher-dashboard' : '/dashboard')} className="mb-4 p-2 -ml-2 hover:bg-white/10 rounded-full inline-block">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display font-bold text-2xl mb-1">{classroom.name}</h1>
        <p className="text-white/80 text-sm mb-4">{subject?.name} · {classroom.level.toUpperCase()}</p>
        {isOwner && (
          <button onClick={copyCode} className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold">
            <Copy size={12} /> {classroom.join_code}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-[var(--border)] sticky top-0 z-30">
        {(['feed', 'assignments', ...(isOwner ? ['roster'] : [])] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3.5 font-bold text-sm border-b-2 transition-colors capitalize ${tab === t ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-muted)]'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-5 max-w-2xl mx-auto">
        {/* FEED */}
        {tab === 'feed' && (
          <div className="flex flex-col gap-4">
            {isOwner && (
              <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="Post an announcement to your class..."
                  rows={3}
                  className="w-full outline-none resize-none text-sm mb-3"
                />
                <button
                  onClick={handlePost}
                  disabled={posting || !newPost.trim()}
                  className="flex items-center gap-1.5 bg-[var(--primary)] text-white px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50"
                >
                  <Send size={14} /> {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            )}

            {posts.length === 0 ? (
              <div className="text-center text-[var(--text-muted)] py-12">No announcements yet.</div>
            ) : (
              posts.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-warm)] flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {p.author?.name?.charAt(0).toUpperCase() ?? 'T'}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{p.author?.name ?? 'Teacher'}</div>
                      <div className="text-xs text-[var(--text-muted)]">{new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* ASSIGNMENTS */}
        {tab === 'assignments' && (
          <div className="flex flex-col gap-4">
            {isOwner && (
              <button
                onClick={() => setAssignOpen(true)}
                className="flex items-center justify-center gap-2 bg-[var(--primary)] text-white py-3.5 rounded-2xl font-bold text-sm"
              >
                <Plus size={16} /> New Assignment
              </button>
            )}

            {assignments.length === 0 ? (
              <div className="text-center text-[var(--text-muted)] py-12">No assignments yet.</div>
            ) : (
              assignments.map(a => (
                <div key={a.id} className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                  <div className="font-bold text-sm mb-1">
                    {a.custom_title || allTopics.find((t: any) => t.id === a.topic_ref_id)?.title || 'Assignment'}
                  </div>
                  {a.due_date && (
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Calendar size={12} /> Due {new Date(a.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ROSTER (teacher only) */}
        {tab === 'roster' && isOwner && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setAddMemberOpen(true)}
              className="flex items-center justify-center gap-2 bg-[var(--primary)] text-white py-3.5 rounded-2xl font-bold text-sm"
            >
              <Plus size={16} /> Add Student
            </button>

            {members.length === 0 ? (
              <div className="text-center text-[var(--text-muted)] py-12">
                <Users size={32} className="mx-auto mb-3 opacity-40" />
                No students yet. Share the join code <strong>{classroom.join_code}</strong> or add manually.
              </div>
            ) : (
              members.map(m => (
                <div key={m.id} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-[var(--accent-warm)] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {m.student?.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{m.student?.name ?? 'Unknown'}</div>
                    <div className="text-xs text-[var(--text-muted)]">{m.student?.school || 'No school'} · {m.student?.xp ?? 0} XP</div>
                  </div>
                  <button onClick={() => handleRemoveMember(m.student.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add member modal */}
      {addMemberOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAddMemberOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Add Student</h3>
            <input
              value={addUsername}
              onChange={e => setAddUsername(e.target.value)}
              placeholder="Enter student's username"
              className="w-full border border-[var(--border)] rounded-xl p-3 outline-none focus:border-[var(--primary)] mb-4"
            />
            <button onClick={handleAddMember} className="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-bold text-sm">
              Add to Class
            </button>
          </div>
        </div>
      )}

      {/* New assignment modal */}
      {assignOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setAssignOpen(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-xl">New Assignment</h3>
              <button onClick={() => setAssignOpen(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={18} /></button>
            </div>

            <div className="flex bg-[var(--surface-light)] p-1 rounded-xl border border-[var(--border)] mb-4">
              <button onClick={() => setAssignMode('custom')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${assignMode === 'custom' ? 'bg-white shadow' : 'text-[var(--text-muted)]'}`}>Write Custom</button>
              <button onClick={() => setAssignMode('existing')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${assignMode === 'existing' ? 'bg-white shadow' : 'text-[var(--text-muted)]'}`}>Assign Existing Topic</button>
            </div>

            {assignMode === 'existing' ? (
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Topic</label>
                <select value={assignTopicId} onChange={e => setAssignTopicId(e.target.value)} className="w-full border border-[var(--border)] rounded-xl p-3 outline-none focus:border-[var(--primary)]">
                  <option value="">Select a topic</option>
                  {allTopics.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Title</label>
                  <input value={assignTitle} onChange={e => setAssignTitle(e.target.value)} className="w-full border border-[var(--border)] rounded-xl p-3 outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Content</label>
                  <RichEditor value={assignContent} onChange={setAssignContent} minHeight={200} subjectName={subject?.name} topicTitle={assignTitle} />
                </div>
              </>
            )}

            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2">Due Date <span className="text-xs text-[var(--text-muted)] font-normal">(optional)</span></label>
              <input type="date" value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)} className="w-full border border-[var(--border)] rounded-xl p-3 outline-none focus:border-[var(--primary)]" />
            </div>

            <button
              onClick={handleCreateAssignment}
              disabled={assigning}
              className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold disabled:opacity-50"
            >
              {assigning ? 'Creating…' : 'Create Assignment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
