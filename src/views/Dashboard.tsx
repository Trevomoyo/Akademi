import React, { useState, useEffect } from 'react';
import { UserProfile, TopicProgress } from '../types';
import { SUBJECTS_DB } from '../lib/content';
import { AkademiDB } from '../lib/db';
import { calculateLevel, BADGES_DB } from '../lib/xp';
import { BottomNav } from '../components/BottomNav';
import { Moon, Sun } from 'lucide-react';

export default function Dashboard({ route, navigate, profile, onUpdateProfile }: { route: string, navigate: (r: string) => void, profile: UserProfile, onUpdateProfile: (p: UserProfile) => void }) {
  const [greeting, setGreeting] = useState('');
  const [progressData, setProgressData] = useState<TopicProgress[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    (async () => {
      const allProgress = await AkademiDB.getAllProgress();
      setProgressData(allProgress);

      const b = await AkademiDB.getBadges();
      const badges = BADGES_DB.filter(db => b.some((earned: any) => earned.id === db.id)).map(db => {
        const earned = b.find((e: any) => e.id === db.id);
        return { ...db, earnedAt: earned?.earnedAt };
      });
      setEarnedBadges(badges);
    })();
  }, []);

  const toggleTheme = () => {
    const newTheme: 'light' | 'dark' = profile.theme === 'light' ? 'dark' : 'light';
    const newProfile = { ...profile, theme: newTheme };
    onUpdateProfile(newProfile);
    AkademiDB.saveTheme(newTheme);
  };

  const level = calculateLevel(profile.xp);
  
  const mySubjects = SUBJECTS_DB.filter(s => profile.subjects.includes(s.id));

  // Find last topic with progress (most recently read)
  const lastTopicId = progressData.filter(p => p.readComplete).slice(-1)[0]?.topicId;
  let lastTopic: any = null;
  let lastSubject: any = null;
  if (lastTopicId) {
    for (const s of mySubjects) {
      const t = s.topics.find((x: any) => x.id === lastTopicId);
      if (t) { lastTopic = t; lastSubject = s; break; }
    }
  }

  if (!profile) { navigate('/onboarding'); return null; }

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)] pb-24 font-body">
      {/* HEADER */}
      <div className="pt-10 px-6 pb-4 flex justify-between items-start">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--primary)]">{greeting}, {profile.name}</h1>
          {profile.school && <p className="text-[var(--text-muted)] text-sm">{profile.school}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={toggleTheme} className="p-2 bg-[var(--surface-light)] rounded-full border border-[var(--border)]">
            {profile.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <div className="w-10 h-10 bg-[var(--accent-warm)] rounded-full flex items-center justify-center text-white font-bold cursor-pointer" onClick={() => navigate('/profile')}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="flex px-4 gap-2 mb-8 overflow-x-auto hide-scrollbar">
        <div className="flex-1 min-w-[100px] bg-white border border-[var(--border)] rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
          <div className="text-2xl mb-1">🔥 {profile.loginStreak}</div>
          <div className="text-xs text-[var(--text-muted)] font-medium">days</div>
        </div>
        <div className="flex-1 min-w-[100px] bg-white border border-[var(--border)] rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
          <div className="text-2xl mb-1 text-[var(--highlight)]">⚡ {profile.xp}</div>
          <div className="text-xs text-[var(--text-muted)] font-medium">XP</div>
        </div>
        <div className="flex-1 min-w-[100px] bg-white border border-[var(--border)] rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
          <div className="text-2xl mb-1 text-[var(--primary)]">★ Lv{level}</div>
          <div className="text-xs text-[var(--text-muted)] font-medium">Scholar</div>
        </div>
      </div>

      <div className="px-6 space-y-8">

        {/* CONTINUE STUDYING */}
        {lastTopic && lastSubject && (
          <div>
            <h2 className="font-bold text-xl mb-3">Continue studying</h2>
            <div
              onClick={() => navigate(`/lesson/${lastTopic.id}`)}
              className="bg-white border border-[var(--border)] rounded-2xl p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:border-[var(--primary)] transition-colors relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl" style={{ backgroundColor: lastSubject.themeColor }} />
              <div className="pl-3 flex-1 min-w-0">
                <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">{lastSubject.name}</div>
                <div className="font-bold truncate">{lastTopic.title}</div>
              </div>
              <div className="text-[var(--primary)] font-bold text-xl shrink-0">→</div>
            </div>
          </div>
        )}
        <div>
          <h2 className="font-bold text-xl mb-4" id="subjects">My Subjects</h2>
          {mySubjects.length === 0 ? (
            <div className="bg-white border mb-4 border-[var(--border)] rounded-2xl p-6 text-center text-sm text-[var(--text-muted)]">
              No subjects selected.<br/>
              <button 
                onClick={() => navigate('/profile')}
                className="mt-2 text-[var(--primary)] font-semibold underline"
              >
                Add subjects in your profile to see them here
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {mySubjects.map(sub => {
                const totalTopics = sub.topics.length;
                const completedTopics = progressData.filter(p => 
                  sub.topics.some(t => t.id === p.topicId) && p.readComplete
                ).length;
                const pct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
                
                return (
                  <div 
                    key={sub.id} 
                    onClick={() => navigate(`/subject/${sub.id}`)}
                    className="bg-white border border-[var(--border)] rounded-2xl p-4 shadow-sm relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: sub.themeColor }}></div>
                    <div className="font-bold text-lg mt-2 mb-1">{sub.name}</div>
                    <div className="text-xs text-[var(--text-muted)] mb-3">{completedTopics} of {totalTopics} topics done</div>
                    <div className="w-full bg-[var(--surface-light)] h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: sub.themeColor }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RECENT BADGES */}
        {earnedBadges.length > 0 && (
          <div>
            <h2 className="font-bold text-xl mb-4">Recent Badges</h2>
            <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
              {earnedBadges.map((b, i) => (
                <div key={i} className="flex-shrink-0 flex items-center bg-white border border-[var(--border)] rounded-full px-4 py-2 shadow-sm font-semibold text-sm">
                  <span className="mr-2 text-lg">{b.icon}</span> {b.name}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <BottomNav activeTab="/dashboard" onNavigate={navigate} />
    </div>
  );
}
