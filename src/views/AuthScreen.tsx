import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Loader2, Eye, EyeOff } from 'lucide-react';

type Tab = 'signin' | 'signup';

interface Props {
  onAuthSuccess: (userId: string, isNewUser: boolean) => void;
}

export default function AuthScreen({ onAuthSuccess }: Props) {
  const [tab, setTab]             = useState<Tab>('signin');
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // We use Supabase email auth but derive a private email from the username
  // so users only ever see/type their username. The email is never shown.
  function toEmail(u: string) {
    return `${u.toLowerCase().trim().replace(/[^a-z0-9_]/g, '')}@akademi.app`;
  }

  function validate(): string | null {
    const u = username.trim();
    if (!u) return 'Username is required';
    if (u.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Username can only contain letters, numbers and underscores';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (tab === 'signup' && password !== confirm) return 'Passwords do not match';
    return null;
  }

  async function handleSignIn() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setLoading(true);

    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    });
    setLoading(false);

    if (authErr || !data.user) {
      setError(authErr?.message === 'Invalid login credentials'
        ? 'Incorrect username or password'
        : (authErr?.message ?? 'Sign in failed'));
      return;
    }

    // Check if profile exists (should always exist for sign-in, but be safe)
    const { data: profile } = await supabase
      .from('profiles').select('id').eq('id', data.user.id).single();

    onAuthSuccess(data.user.id, !profile);
  }

  async function handleSignUp() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setLoading(true);

    // Check username isn't already taken (query profiles by name)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('name', username.trim())
      .limit(1);

    if (existing && existing.length > 0) {
      setLoading(false);
      setError('That username is already taken — try another');
      return;
    }

    const { data, error: authErr } = await supabase.auth.signUp({
      email: toEmail(username),
      password,
      options: {
        // Skip email confirmation — we trust the user directly
        data: { username: username.trim() },
      },
    });
    setLoading(false);

    if (authErr || !data.user) {
      setError(authErr?.message === 'User already registered'
        ? 'That username is already taken — try another'
        : (authErr?.message ?? 'Sign up failed'));
      return;
    }

    onAuthSuccess(data.user.id, true);
  }

  const handleSubmit = tab === 'signin' ? handleSignIn : handleSignUp;

  return (
    <div className="min-h-screen bg-[#12110E] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="font-display font-bold italic text-5xl text-[#14B8A6] mb-1">
            Akademì
          </div>
          <p className="text-[#A39E98] text-sm">Zimbabwe's study companion</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#1A1714] border border-[#3A3632] rounded-2xl p-1 mb-6">
          {(['signin', 'signup'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                tab === t
                  ? 'bg-[#14B8A6] text-[#12110E]'
                  : 'text-[#A39E98] hover:text-white'
              }`}
            >
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3"
          >
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-[#A39E98] uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                autoFocus
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="e.g. takunda_zw"
                className="w-full bg-[#1A1714] border border-[#3A3632] rounded-xl text-white px-4 py-3.5 outline-none focus:border-[#14B8A6] transition-colors placeholder-[#3A3632] text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#A39E98] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#1A1714] border border-[#3A3632] rounded-xl text-white px-4 py-3.5 pr-12 outline-none focus:border-[#14B8A6] transition-colors placeholder-[#3A3632] text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A39E98] hover:text-white p-1"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password (sign up only) */}
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-[#A39E98] uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Repeat your password"
                  className="w-full bg-[#1A1714] border border-[#3A3632] rounded-xl text-white px-4 py-3.5 outline-none focus:border-[#14B8A6] transition-colors placeholder-[#3A3632] text-sm"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#14B8A6] text-[#12110E] font-bold py-4 rounded-full text-base mt-1 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Please wait…</>
                : tab === 'signin' ? 'Sign In' : 'Create Account'
              }
            </button>

            {tab === 'signup' && (
              <p className="text-center text-[#A39E98] text-xs mt-1">
                7-day free trial · No credit card required
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
