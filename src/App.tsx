import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import AuthScreen    from './views/AuthScreen';
import Onboarding   from './views/Onboarding';
import Dashboard    from './views/Dashboard';
import SubjectDetail from './views/SubjectDetail';
import NotesView    from './views/NotesView';
import Profile      from './views/Profile';
import PastPapers   from './views/PastPapers';
import Subscribe    from './views/Subscribe';
import Admin        from './views/Admin';
import Landing      from './views/Landing';

import { supabase }          from './lib/supabase';
import { AkademiDB }         from './lib/db';
import { UserProfile }       from './types';
import { calculateLevel, processDailyLogin, awardBadge, BADGES_DB } from './lib/xp';

type AppState = 'loading' | 'auth' | 'onboarding' | 'app';

export default function App() {
  const [appState, setAppState]     = useState<AppState>('loading');
  const [route, setRoute]           = useState('/');
  const [profile, setProfile]       = useState<UserProfile | null>(null);
  const [toastMsg, setToastMsg]     = useState<string | null>(null);
  const toastTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loginProcessed              = useRef(false);

  // ── Boot: check existing Supabase session ──────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setAppState('auth');
        return;
      }

      // Existing session — load profile
      const p = await AkademiDB.getProfile();
      if (!p) {
        // Authenticated but no profile row yet — go to onboarding
        setAppState('onboarding');
        return;
      }

      setProfile(p);
      setAppState('app');
      handleDailyLogin(p);
    };

    init();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setAppState('auth');
          navigate('/');
        }
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          // Handled by onAuthSuccess callback from AuthScreen
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Hash-based routing ────────────────────────────────────
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      setRoute(hash);
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // ── Theme ─────────────────────────────────────────────────
  useEffect(() => {
    const theme = profile?.theme ?? AkademiDB.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
  }, [profile?.theme]);

  // ── Daily login XP ────────────────────────────────────────
  const handleDailyLogin = async (p: UserProfile) => {
    if (loginProcessed.current) return;
    loginProcessed.current = true;

    const { xpGained, newStreak, badgeId } = processDailyLogin(p);
    if (xpGained === 0) return;

    const prevLevel = calculateLevel(p.xp);
    const updated: UserProfile = {
      ...p,
      xp: p.xp + xpGained,
      loginStreak: newStreak,
      lastLoginDate: new Date().toISOString(),
    };

    await AkademiDB.saveProfile(updated);
    setProfile(updated);

    setTimeout(() => showToast(`+${xpGained} XP — Daily login`), 800);

    const newLevel = calculateLevel(updated.xp);
    if (newLevel > prevLevel) {
      setTimeout(() => showToast(`🎉 Level up! You're now Level ${newLevel}`), 2500);
    }

    if (badgeId) {
      const badge = await awardBadge(badgeId);
      if (badge) setTimeout(() => showToast(`🏅 New badge: ${badge.name}`), 4000);
    }
  };

  // ── Navigation ────────────────────────────────────────────
  const navigate = (r: string) => {
    window.location.hash = r;
  };

  // ── Toast ─────────────────────────────────────────────────
  const showToast = (message: string) => {
    setToastMsg(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
  };

  // ── Profile update (save to DB + React state) ─────────────
  const handleProfileUpdate = async (p: UserProfile) => {
    try {
      await AkademiDB.saveProfile(p);
    } catch (e) {
      console.error('Profile save failed:', e);
    }
    setProfile(p);
  };

  // ── Called by AuthScreen on successful OTP verification ───
  const handleAuthSuccess = async (userId: string, isNewUser: boolean) => {
    if (isNewUser) {
      setAppState('onboarding');
    } else {
      const p = await AkademiDB.getProfile();
      if (p) {
        setProfile(p);
        setAppState('app');
        handleDailyLogin(p);
        navigate('/dashboard');
      } else {
        // Rare: auth exists but profile row missing
        setAppState('onboarding');
      }
    }
  };

  // ── Called by Onboarding when profile is created ──────────
  const handleProfileCreate = async (p: UserProfile) => {
    try {
      await AkademiDB.saveProfile(p);
    } catch (e) {
      console.error('Profile creation failed:', e);
    }
    setProfile(p);
    setAppState('app');
    await awardBadge('pioneer');
    setTimeout(() => showToast('🌟 Welcome to Akademì! Pioneer badge earned.'), 600);
    navigate('/dashboard');
  };

  // ── Render ────────────────────────────────────────────────

  // Full-screen loader while checking session
  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-[#12110E] flex items-center justify-center">
        <div className="text-center">
          <div className="font-display font-bold italic text-4xl text-[#14B8A6] mb-4">Akademì</div>
          <div className="w-8 h-8 border-2 border-[#14B8A6] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Auth gate
  if (appState === 'auth') {
    return <AuthScreen navigate={navigate} onAuthSuccess={handleAuthSuccess} />;
  }

  // Onboarding (authenticated but no profile yet)
  if (appState === 'onboarding') {
    return (
      <Onboarding
        navigate={navigate}
        onUpdateProfile={handleProfileCreate}
        onCreateProfile={handleProfileCreate}
        showToast={showToast}
      />
    );
  }

  // ── Authenticated app shell ───────────────────────────────
  // Route → component
  let View: React.ComponentType<any> = Dashboard;

  if (route.startsWith('/lesson/'))     View = NotesView;
  else if (route.startsWith('/subject/')) View = SubjectDetail;
  else if (route === '/profile')        View = Profile;
  else if (route === '/pastpapers')     View = PastPapers;
  else if (route === '/subscribe')      View = Subscribe;
  else if (route === '/landing')        View = Landing;
  else if (route === '/admin') {
    if (!profile?.isAdmin) { navigate('/dashboard'); View = Dashboard; }
    else View = Admin;
  }

  return (
    <>
      <View
        route={route}
        navigate={navigate}
        profile={profile}
        onUpdateProfile={handleProfileUpdate}
        onCreateProfile={handleProfileCreate}
        showToast={showToast}
      />

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            key={toastMsg + Date.now()}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-[#1A1714] border border-[#3A3632] text-white px-6 py-3 rounded-full text-sm font-medium shadow-xl whitespace-nowrap"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
