import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, GraduationCap, CheckCircle2, Clock, XCircle } from 'lucide-react';

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return { 'Authorization': `Bearer ${session?.access_token ?? ''}`, 'Content-Type': 'application/json' };
}

export default function TeacherApply({ navigate, profile, showToast }: any) {
  const [loading, setLoading] = useState(true);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState(profile?.name ?? '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [school, setSchool] = useState(profile?.school ?? '');
  const [subjectSpecialisation, setSubjectSpecialisation] = useState('');
  const [credentialsNote, setCredentialsNote] = useState('');

  useEffect(() => {
    (async () => {
      const headers = await getAuthHeader();
      const res = await fetch('/api/teacher/my-application', { headers });
      const data = await res.json();
      setExistingApplication(data.application);
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async () => {
    if (!fullName.trim()) { showToast('Full name is required'); return; }
    setSubmitting(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/teacher/apply', {
        method: 'POST', headers,
        body: JSON.stringify({ fullName, email, phone, school, subjectSpecialisation, credentialsNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Application failed');
      setExistingApplication(data.application);
      showToast('Application submitted! We\'ll review it soon.');
    } catch (e: any) {
      showToast(e.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] min-h-screen text-[var(--text-primary)] font-body pb-20">
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/profile')} className="p-2 hover:bg-black/5 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div className="font-bold text-lg">Become a Teacher</div>
      </div>

      <div className="p-6 max-w-lg mx-auto">
        {existingApplication ? (
          <div className="bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm text-center">
            {existingApplication.status === 'pending' && (
              <>
                <Clock size={40} className="mx-auto mb-4 text-[var(--accent-warm)]" />
                <h2 className="font-bold text-xl mb-2">Application under review</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  We've received your application. You'll be notified once it's reviewed.
                </p>
              </>
            )}
            {existingApplication.status === 'approved' && (
              <>
                <CheckCircle2 size={40} className="mx-auto mb-4 text-[var(--primary)]" />
                <h2 className="font-bold text-xl mb-2">You're an approved teacher!</h2>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Head over to your teacher dashboard to create your first classroom.
                </p>
                <button
                  onClick={() => navigate('/teacher-dashboard')}
                  className="bg-[var(--primary)] text-white px-6 py-3 rounded-full font-bold text-sm"
                >
                  Go to Teacher Dashboard
                </button>
              </>
            )}
            {existingApplication.status === 'rejected' && (
              <>
                <XCircle size={40} className="mx-auto mb-4 text-red-400" />
                <h2 className="font-bold text-xl mb-2">Application not approved</h2>
                {existingApplication.rejection_reason && (
                  <p className="text-sm text-[var(--text-muted)] mb-4">{existingApplication.rejection_reason}</p>
                )}
                <p className="text-xs text-[var(--text-muted)]">Contact support if you'd like to reapply.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={28} className="text-[var(--primary)]" />
              </div>
              <h1 className="font-display font-bold text-2xl mb-2">Teach on Akademì</h1>
              <p className="text-sm text-[var(--text-muted)]">
                Create virtual classrooms, assign work, and guide students through the syllabus. Applications are reviewed manually.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name <span className="text-red-500">*</span></label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-[var(--border)] rounded-xl p-3 outline-none focus:border-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full border border-[var(--border)] rounded-xl p-3 outline-none focus:border-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-[var(--border)] rounded-xl p-3 outline-none focus:border-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">School</label>
                <input value={school} onChange={e => setSchool(e.target.value)} placeholder="e.g. Prince Edward High School" className="w-full border border-[var(--border)] rounded-xl p-3 outline-none focus:border-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Subject Specialisation</label>
                <input value={subjectSpecialisation} onChange={e => setSubjectSpecialisation(e.target.value)} placeholder="e.g. Mathematics, Chemistry" className="w-full border border-[var(--border)] rounded-xl p-3 outline-none focus:border-[var(--primary)]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Credentials / Experience</label>
                <textarea
                  value={credentialsNote}
                  onChange={e => setCredentialsNote(e.target.value)}
                  placeholder="Tell us about your teaching background, qualifications, or experience..."
                  rows={4}
                  className="w-full border border-[var(--border)] rounded-xl p-3 outline-none resize-none focus:border-[var(--primary)]"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold disabled:opacity-50 mt-2"
              >
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
