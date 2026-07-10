import React, { useEffect, useState } from 'react';
import { useMergedSubjects } from '../lib/useSubjects';
import { AkademiDB } from '../lib/db';
import { evaluateTopicStars } from '../lib/xp';
import { ArrowLeft, Lock, ChevronRight } from 'lucide-react';

export default function SubjectDetail({ route, navigate, profile, showToast }: any) {
  const { subjects } = useMergedSubjects();
  const [progress, setProgress] = useState<any>({});

  const idMatch = route.match(/\/subject\/(.+)/);
  const subjectId = idMatch ? idMatch[1] : null;
  const subject = subjects.find(s => s.id === subjectId);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!subject) return;

    (async () => {
      const pData: any = {};
      await Promise.all(
        subject.topics.map(async (t: any) => {
          const p = await AkademiDB.getProgress(t.id);
          if (p) pData[t.id] = p;
        })
      );
      setProgress(pData);
    })();
  }, [subject]);

  if (!subject) {
    return <div className="p-8 text-center">Subject not found. <button onClick={() => navigate('/dashboard')}>Go back</button></div>;
  }

  const handleTopicClick = (topicId: string, isLocked: boolean) => {
    if (isLocked) {
      navigate('/subscribe');
      return;
    }
    navigate(`/lesson/${topicId}`);
  };

  if (!profile) { navigate('/onboarding'); return null; }

  return (
    <div className="min-h-screen bg-[var(--surface)] font-body pb-10">
      <div className="sticky top-0 z-40 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-black/5 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div className="font-bold flex items-center">
          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: subject.themeColor }}></div>
          {subject.name}
        </div>
      </div>

      <div 
        className="h-[160px] flex flex-col justify-end p-6 text-white"
        style={{ background: `linear-gradient(to bottom right, ${subject.themeColor}, ${subject.themeColor}88), url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
      >
        <div className="text-sm font-semibold uppercase tracking-widest opacity-80">{subject.code}</div>
        <h1 className="font-display text-3xl font-bold mt-1">{subject.name}</h1>
        <p className="mt-2 text-sm opacity-90">{subject.vibeText}</p>
      </div>

      <div className="px-4 py-6 flex flex-col gap-3 max-w-2xl mx-auto">
        {subject.topics.map((topic, index) => {
          // Trial paywall logic: block anything after topic index 1 if trial
          const isLocked = profile.subscriptionStatus === 'trial' && index >= 2;
          const userProg = progress[topic.id];
          const stars = evaluateTopicStars(userProg);
          
          return (
            <div 
              key={topic.id}
              onClick={() => handleTopicClick(topic.id, isLocked)}
              className={`bg-white border ${isLocked ? 'border-gray-200' : 'border-[var(--border)]'} rounded-xl p-4 flex items-center cursor-pointer ${isLocked ? 'opacity-70' : 'hover:border-[var(--primary)]'} transition-colors shadow-sm`}
            >
              <div className="flex-1">
                <div className="font-bold text-lg mb-1 flex items-center">
                  Topic {index + 1}: {topic.title}
                </div>
                <div className="flex items-center text-[var(--text-muted)] text-sm mt-2">
                  <div className="flex mr-4">
                    <span className={stars >= 1 ? "text-[var(--accent-warm)]" : "text-gray-300"}>★</span>
                    <span className={stars >= 2 ? "text-[var(--accent-warm)]" : "text-gray-300"}>★</span>
                    <span className={stars >= 3 ? "text-[var(--accent-warm)]" : "text-gray-300"}>★</span>
                  </div>
                  <span>15 min read</span>
                </div>
              </div>
              
              {isLocked ? (
                <div className="bg-gray-100 text-gray-500 rounded-full px-3 py-1 flex items-center text-xs font-bold border border-gray-200">
                  <Lock size={12} className="mr-1" />
                  LOCKED
                </div>
              ) : (
                <ChevronRight size={18} className="text-[var(--primary)] shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      
      {profile.subscriptionStatus === 'trial' && subject.topics.length > 2 && (
        <div className="max-w-2xl mx-auto mt-4 px-4">
           <button 
             onClick={() => navigate('/subscribe')}
             className="w-full bg-[var(--primary-light)] text-[var(--primary)] font-bold py-4 rounded-xl border border-[var(--primary)]/30 hover:bg-[var(--primary)] hover:text-white transition-colors"
           >
             Upgrade to unlock all topics
           </button>
        </div>
      )}
    </div>
  );
}
