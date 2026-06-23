import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SUBJECTS_DB } from '../lib/content';
import { XP_VALUES } from '../lib/xp';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const CITIES = ['Harare', 'Bulawayo', 'Gweru', 'Kwekwe', 'Mutare', 'Masvingo', 'Chinhoyi', 'Kadoma', 'Bindura', 'Other'];

export default function Onboarding({ navigate, onUpdateProfile, onCreateProfile }: any) {
  const createProfile = onCreateProfile || onUpdateProfile;

  // Grab the authenticated user's UUID — this is what goes into profiles.id
  const [authUserId, setAuthUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) setAuthUserId(data.user.id);
      });
    });
  }, []);
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<'o' | 'a'>('o');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubjectToggle = (id: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 10) return prev;
      return [...prev, id];
    });
  };

  const handleComplete = () => {
    if (!name.trim() || !authUserId) return;
    if (!authUserId) {
      // Shouldn't happen — auth guard in App.tsx ensures we have a session
      console.error('No auth user ID available');
      return;
    }
    const newProfile = {
      id: authUserId,                          // ← Supabase auth UUID
      name: name.trim(),
      phone: phone.trim(),
      school: school.trim(),
      city,
      level,
      subjects: selectedSubjects,
      xp: XP_VALUES.first_login,
      loginStreak: 1,
      lastLoginDate: new Date().toISOString(),
      subscriptionStatus: 'trial' as const,
      subscriptionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      theme: 'light' as const,
    };
    createProfile(newProfile); // App.tsx navigates to /dashboard after save
  };

  const currentSubjects = SUBJECTS_DB.filter(s => s.level === level);

  const slideVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
  };

  return (
    <div className="overflow-hidden bg-[var(--surface-light)] min-h-screen flex flex-col relative text-[var(--text-primary)]">
      {step > 0 && (
        <div className="absolute top-4 left-4 z-50">
          <button onClick={prevStep} className="p-2 hover:bg-black/5 rounded-full">
            <ArrowLeft size={24} />
          </button>
        </div>
      )}

      {/* Step indicator */}
      {step > 0 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-2 z-40">
          {[1,2,3].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${step >= i ? 'w-6 bg-[var(--primary)]' : 'w-2 bg-[var(--border)]'}`} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <motion.div
            key="welcome"
            variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col justify-center items-center px-6 text-center bg-[#12110E] min-h-screen star-field-bg"
          >
            <div className="font-display font-bold italic text-5xl text-[#14B8A6] mb-4">Akademì</div>
            <p className="text-[#A39E98] text-lg mb-12">Your secondary school, reimagined.</p>
            <button
              onClick={nextStep}
              className="bg-[var(--accent-warm)] text-white w-full max-w-xs py-4 rounded-full text-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Start free <ArrowRight size={20} />
            </button>
            <p className="text-[#A39E98] text-xs mt-4">7-day free trial · No card required</p>
          </motion.div>
        )}

        {/* Step 1: Level */}
        {step === 1 && (
          <motion.div
            key="level"
            variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full pt-16"
          >
            <h2 className="font-display text-4xl font-bold mb-8 text-center text-[var(--primary)]">Which level are you studying?</h2>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => { setLevel('o'); nextStep(); }}
                className={`bg-white p-6 rounded-2xl border shadow-sm text-left transition-colors ${level === 'o' ? 'border-[var(--primary)]' : 'border-[var(--border)] hover:border-[var(--primary)]'}`}
              >
                <div className="font-bold text-2xl mb-1">O-Level</div>
                <div className="text-[var(--text-muted)]">Form 3 &amp; 4</div>
              </button>
              <button
                onClick={() => { setLevel('a'); nextStep(); }}
                className={`bg-white p-6 rounded-2xl border shadow-sm text-left transition-colors ${level === 'a' ? 'border-[var(--primary)]' : 'border-[var(--border)] hover:border-[var(--primary)]'}`}
              >
                <div className="font-bold text-2xl mb-1">A-Level</div>
                <div className="text-[var(--text-muted)]">Lower &amp; Upper Sixth</div>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Subjects */}
        {step === 2 && (
          <motion.div
            key="subjects"
            variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col pt-16 pb-4 px-6 max-w-lg mx-auto w-full"
            style={{ height: '100dvh' }}
          >
            <h2 className="font-display text-3xl font-bold mb-1 text-center text-[var(--primary)]">Pick your subjects</h2>
            <p className="text-center text-[var(--text-muted)] mb-6 text-sm">Pick up to 10 — you can change this later</p>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0 pb-4">
              {currentSubjects.map(s => {
                const isSelected = selectedSubjects.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSubjectToggle(s.id)}
                    className={`flex items-center p-4 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-[var(--border)] bg-white'}`}
                  >
                    <div className="w-3 h-3 rounded-full mr-4 shrink-0" style={{ backgroundColor: s.themeColor }} />
                    <div className="flex-1 font-semibold">{s.name}</div>
                    <div className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-gray-300'}`}>
                      {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={nextStep}
              disabled={selectedSubjects.length === 0}
              className="w-full bg-[var(--primary)] text-white font-semibold py-4 rounded-full disabled:opacity-50 transition-opacity shrink-0 mt-2"
            >
              Continue ({selectedSubjects.length} selected)
            </button>
          </motion.div>
        )}

        {/* Step 3: Profile */}
        {step === 3 && (
          <motion.div
            key="profile"
            variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full pt-16 pb-8"
          >
            <h2 className="font-display text-3xl font-bold mb-2 text-center text-[var(--primary)]">Your profile</h2>
            <p className="text-center text-[var(--text-muted)] text-sm mb-8">Tell us a bit about yourself</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">First Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-xl p-4 bg-white outline-none focus:border-[var(--primary)] text-[var(--text-primary)]"
                  placeholder="e.g. Tinashe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Phone Number <span className="text-[#A39E98] font-normal text-xs">(optional)</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-xl p-4 bg-white outline-none focus:border-[var(--primary)] text-[var(--text-primary)]"
                  placeholder="077..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">School <span className="text-[var(--text-muted)] font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={school}
                  onChange={e => setSchool(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-xl p-4 bg-white outline-none focus:border-[var(--primary)] text-[var(--text-primary)]"
                  placeholder="e.g. Allan Wilson High"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">City <span className="text-[var(--text-muted)] font-normal">(optional)</span></label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-xl p-4 bg-white outline-none focus:border-[var(--primary)] text-[var(--text-primary)]"
                >
                  <option value="">Select city...</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleComplete}
              disabled={!name.trim() || !authUserId}
              className="w-full bg-[var(--accent-warm)] text-white font-semibold py-4 rounded-full mt-8 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              Let's go <ArrowRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
