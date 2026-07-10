import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { AkademiDB } from '../lib/db';

const FEATURES = [
  'All topics unlocked — every subject, every level',
  'Unlimited AI essay grading with examiner feedback',
  'Past paper downloads — offline access',
  'AI study tutor — ask anything mid-lesson',
  'XP, badges & progress certificates',
  'Priority support via WhatsApp',
];

export default function Subscribe({ navigate, profile, onUpdateProfile, showToast }: any) {
  const [currency, setCurrency] = useState<'USD' | 'ZiG'>('USD');
  const [method, setMethod] = useState<'ecocash' | 'innbucks'>('ecocash');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'waiting' | 'success'>('idle');
  const [pollToken, setPollToken] = useState<string | null>(null);

  const price = currency === 'USD' ? '$1/month' : 'ZiG 36/month';

  useEffect(() => {
    if (profile?.isAdmin) {
      showToast('Admins have unlimited access — no subscription needed.');
      navigate('/dashboard');
    }
  }, [profile?.isAdmin]);

  if (profile?.isAdmin) return null;

  const handlePay = async () => {
    if (!phone.trim()) return;
    setPaymentStatus('processing');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';

      const res = await fetch('/api/subscriptions/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phone, method, currency: currency.toLowerCase() }),
      });
      const data = await res.json();
      setPollToken(data.pollToken);
      showToast('Check your phone for a payment prompt.');
      setPaymentStatus('waiting');

      // Poll for status every 3 seconds (max 20 attempts = 60s)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch(
            `/api/subscriptions/status?token=${data.pollToken}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          const statusData = await statusRes.json();
          if (statusData.status === 'paid') {
            clearInterval(poll);
            completePayment();
          } else if (statusData.status === 'failed' || attempts >= 20) {
            clearInterval(poll);
            showToast('Payment not confirmed. Please try again.');
            setPaymentStatus('idle');
          }
        } catch {
          clearInterval(poll);
          setPaymentStatus('idle');
        }
      }, 3000);
    } catch (err: any) {
      console.error('Payment initiation failed:', err);
      showToast('Could not connect to payment server. Please try again.');
      setPaymentStatus('idle');
    }
  };

  const completePayment = async () => {
    setPaymentStatus('success');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    showToast('🎉 Payment successful! Welcome to Akademì');

    // Reload profile from DB — server has already updated subscription_status to 'active'
    const freshProfile = await AkademiDB.getProfile();
    if (freshProfile) onUpdateProfile(freshProfile);

    setTimeout(() => navigate('/dashboard'), 2000);
  };

  return (
    <div className="bg-[#12110E] min-h-screen text-white font-body pb-20">
      <div className="px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(profile ? '/dashboard' : '/')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="px-6 pt-2 max-w-md mx-auto">
        <h1 className="font-display font-bold text-4xl mb-2">Unlock everything.</h1>
        <p className="text-[#A39E98] mb-8 leading-relaxed">
          Full access to all topics, AI essay grading, and offline past papers.
        </p>

        {paymentStatus === 'success' ? (
          <div className="bg-[#1A1714] border border-[#14B8A6] rounded-3xl p-10 flex flex-col items-center text-center">
            <CheckCircle2 size={64} className="text-[#14B8A6] mb-6" />
            <h2 className="text-2xl font-display font-bold mb-2">You're in!</h2>
            <p className="text-[#A39E98]">Your subscription is now active. Redirecting...</p>
          </div>
        ) : (
          <div className="bg-[#1A1714] border border-[#3A3632] rounded-3xl p-6 shadow-xl">
            {/* Currency toggle */}
            <div className="flex bg-[#12110E] p-1 rounded-full mb-6 w-max border border-[#3A3632]">
              <button onClick={() => setCurrency('USD')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${currency === 'USD' ? 'bg-white text-black' : 'text-[#A39E98]'}`}>USD</button>
              <button onClick={() => setCurrency('ZiG')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${currency === 'ZiG' ? 'bg-white text-black' : 'text-[#A39E98]'}`}>ZiG</button>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-5xl font-display font-bold">{currency === 'USD' ? '$1' : 'ZiG 36'}</span>
              <span className="text-[#A39E98] text-lg font-body">/month</span>
            </div>

            {/* Features */}
            <ul className="flex flex-col gap-2 mb-6">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#D4CFCA]">
                  <Check size={16} className="text-[#14B8A6] mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Payment method */}
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setMethod('ecocash')}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-colors ${method === 'ecocash' ? 'border-[#14B8A6] bg-[#14B8A6]/10 text-[#14B8A6]' : 'border-[#3A3632] text-[#A39E98]'}`}
              >EcoCash</button>
              <button
                onClick={() => setMethod('innbucks')}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-colors ${method === 'innbucks' ? 'border-[#14B8A6] bg-[#14B8A6]/10 text-[#14B8A6]' : 'border-[#3A3632] text-[#A39E98]'}`}
              >InnBucks</button>
            </div>

            {/* Phone input */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-[#A39E98] uppercase tracking-wider mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="077..."
                disabled={paymentStatus !== 'idle'}
                className="w-full bg-[#12110E] border border-[#3A3632] p-4 rounded-xl text-white outline-none focus:border-[#14B8A6] disabled:opacity-50"
              />
              <p className="text-xs text-[#A39E98] mt-1">A payment prompt will be sent to this number.</p>
            </div>

            <button
              onClick={handlePay}
              disabled={paymentStatus !== 'idle' || !phone.trim()}
              className="w-full bg-[var(--accent-warm)] py-4 rounded-full font-bold text-[#1A1714] hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {paymentStatus === 'processing' ? <><Loader2 size={18} className="animate-spin" /> Initiating...</>
               : paymentStatus === 'waiting'    ? <><Loader2 size={18} className="animate-spin" /> Waiting for confirmation...</>
               : `Pay ${price} securely`}
            </button>

            <p className="text-center text-xs text-[#A39E98] mt-3">Merchant code: #907102 · Secured by Paynow</p>
          </div>
        )}

        <div className="text-center mt-6 text-sm text-[#A39E98]">
          Having trouble?{' '}
          <a href="https://wa.me/263778354848" className="text-[#14B8A6] hover:underline">WhatsApp support</a>
        </div>
      </div>
    </div>
  );
}
