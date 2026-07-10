import React, { useState, useEffect } from 'react';
import { BottomNav } from '../components/BottomNav';
import { calculateLevel, BADGES_DB, awardBadge } from '../lib/xp';
import { AkademiDB } from '../lib/db';
import { supabase } from '../lib/supabase';
import { SUBJECTS_DB } from '../lib/content';
import { ThreeCertificate } from '../components/ThreeCertificate';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Profile({ navigate, profile, onUpdateProfile, showToast }: any) {
  if (!profile) return null;

  const level = calculateLevel(profile.xp);
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
  const mySubjects = SUBJECTS_DB.filter(s => profile.subjects.includes(s.id));

  useEffect(() => {
    AkademiDB.getBadges().then(setEarnedBadges);
  }, []);
  const [editingSubjects, setEditingSubjects] = useState(false);
  const [draftSubjects,   setDraftSubjects]   = useState<string[]>(profile.subjects);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // App.tsx onAuthStateChange listener handles redirect to AuthScreen
  };

  const toggleSubject = (id: string) => {
    setDraftSubjects(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 10) return prev;
      return [...prev, id];
    });
  };

  const saveSubjects = () => {
    onUpdateProfile({ ...profile, subjects: draftSubjects });
    setEditingSubjects(false);
    showToast('Subjects updated');
  };

  const handleClaimCertificate = () => {
    awardBadge('graduate');
    onUpdateProfile({ ...profile, xp: profile.xp + 500 });
    confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 } });
    showToast('🎓 Certificate claimed! +500 XP');
  };

  const currentSubjects = SUBJECTS_DB.filter(s => s.level === profile.level);

  return (
    <div className="bg-[var(--surface-light)] min-h-screen text-[var(--text-primary)] pb-24 font-body">
      {/* Header */}
      <div className="bg-[var(--primary)] text-white pt-12 pb-20 px-6 rounded-b-[3rem] shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <h1 className="font-display font-bold text-3xl">Profile</h1>
          {profile.isAdmin && (
            <button onClick={() => navigate('/admin')} className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/30">
              Admin Panel
            </button>
          )}
        </div>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-[var(--accent-warm)] rounded-full flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-white/20 shrink-0">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <div className="text-white/80 text-sm mt-0.5">{profile.school || 'Student'} · {profile.city || 'Zimbabwe'}</div>
            <div className="text-white/60 text-xs mt-0.5">{profile.level === 'o' ? 'O-Level' : 'A-Level'}</div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-10 flex flex-col gap-5 max-w-2xl mx-auto">
        {/* XP / Level card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[var(--border)] flex justify-between items-center">
          <div>
            <div className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-wider mb-1">Level</div>
            <div className="text-3xl font-display font-bold text-[var(--primary)]">Level {level}</div>
          </div>
          <div className="text-right">
            <div className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-wider mb-1">Total XP</div>
            <div className="text-3xl font-display font-bold text-[var(--highlight)]">{profile.xp.toLocaleString()}</div>
          </div>
        </div>

        {/* Subjects card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[var(--border)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">My Subjects</h3>
            <button onClick={() => { setDraftSubjects(profile.subjects); setEditingSubjects(true); }} className="text-[var(--primary)] text-sm font-semibold hover:underline">
              Edit
            </button>
          </div>
          {mySubjects.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No subjects selected.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mySubjects.map(s => (
                <div key={s.id} className="bg-[var(--surface-light)] border border-[var(--border)] px-3 py-1.5 rounded-full text-sm font-medium flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: s.themeColor }} />
                  {s.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[var(--border)]">
          <h3 className="font-bold text-lg mb-4">Badges</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {BADGES_DB.map(b => {
              const isEarned = earnedBadges.some((e: any) => e.id === b.id);
              return (
                <div key={b.id} className={`flex flex-col items-center p-3 rounded-xl border transition-all ${isEarned ? 'border-[var(--accent-warm)] bg-[#FEF3E2]' : 'border-[var(--border)] opacity-40 grayscale'}`}>
                  <div className="text-2xl mb-1">{b.icon}</div>
                  <div className="text-[9px] text-center font-bold leading-tight">{b.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certificate */}
        {level >= 5 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
            <h3 className="font-bold text-lg mb-4">Certificate</h3>
            <ThreeCertificate name={profile.name} level={level} />
            <div className="mt-4 text-center">
              <button
                onClick={handleClaimCertificate}
                className="bg-[#1A1714] text-white px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Claim Certificate (+500 XP)
              </button>
            </div>
          </div>
        )}

        {/* Subscription status */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1">Subscription</div>
            {profile.isAdmin ? (
              <div className="font-bold text-lg text-[var(--primary)] flex items-center gap-2">
                Unlimited Access
                <span className="text-xs font-bold bg-[var(--primary-light)] text-[var(--primary)] px-2 py-0.5 rounded-full">ADMIN</span>
              </div>
            ) : (
              <div className={`font-bold text-lg capitalize ${profile.subscriptionStatus === 'active' ? 'text-[var(--primary)]' : 'text-[var(--accent-warm)]'}`}>
                {profile.subscriptionStatus}
                {profile.subscriptionStatus === 'active' && profile.subscriptionExpiresAt && (
                  <span className="text-xs font-normal text-[var(--text-muted)] ml-2">
                    · expires {new Date(profile.subscriptionExpiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
          {!profile.isAdmin && profile.subscriptionStatus !== 'active' && (
            <button onClick={() => navigate('/subscribe')} className="bg-[var(--accent-warm)] text-white px-4 py-2 rounded-full text-sm font-bold">
              Upgrade
            </button>
          )}
        </div>

        <button onClick={handleLogout} className="w-full py-4 text-red-500 font-bold bg-white rounded-2xl border border-[var(--border)] hover:bg-red-50 transition-colors">
          Log Out
        </button>
      </div>

      {/* Edit subjects modal */}
      {editingSubjects && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-[var(--surface)] w-full max-w-lg rounded-t-3xl p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-xl">Edit Subjects</h3>
              <button onClick={() => setEditingSubjects(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-4">Pick up to 10</p>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
              {currentSubjects.map(s => {
                const isSelected = draftSubjects.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleSubject(s.id)}
                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-[var(--border)] bg-white'}`}
                  >
                    <div className="w-3 h-3 rounded-full mr-3 shrink-0" style={{ backgroundColor: s.themeColor }} />
                    <div className="flex-1 font-semibold text-sm">{s.name}</div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-gray-300'}`}>
                      {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={saveSubjects}
              disabled={draftSubjects.length === 0}
              className="w-full bg-[var(--primary)] text-white py-4 rounded-full font-bold mt-4 disabled:opacity-50"
            >
              Save ({draftSubjects.length} selected)
            </button>
          </div>
        </div>
      )}

      <BottomNav activeTab="/profile" onNavigate={navigate} />
    </div>
  );
}
