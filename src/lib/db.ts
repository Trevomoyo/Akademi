/**
 * AkademiDB — all persistence goes through Supabase.
 * localStorage is only used for the Supabase session token (handled by the SDK).
 */
import { supabase } from './supabase';
import { UserProfile, TopicProgress, Badge, PastPaper } from '../types';

// ── helpers ──────────────────────────────────────────────────

function dbRowToProfile(row: any): UserProfile {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    school: row.school ?? undefined,
    city: row.city ?? undefined,
    level: row.level,
    subjects: row.subjects ?? [],
    xp: row.xp,
    loginStreak: row.login_streak,
    lastLoginDate: row.last_login_date ?? new Date().toISOString(),
    subscriptionStatus: row.subscription_status,
    subscriptionExpiresAt: row.subscription_expires_at ?? undefined,
    isAdmin: row.is_admin ?? false,
    theme: row.theme ?? 'light',
  };
}

function profileToDbRow(p: UserProfile) {
  return {
    id: p.id,
    name: p.name,
    phone: p.phone ?? null,
    school: p.school ?? null,
    city: p.city ?? null,
    level: p.level,
    subjects: p.subjects,
    xp: p.xp,
    login_streak: p.loginStreak,
    last_login_date: p.lastLoginDate,
    subscription_status: p.subscriptionStatus,
    subscription_expires_at: p.subscriptionExpiresAt ?? null,
    is_admin: p.isAdmin ?? false,
    theme: p.theme,
  };
}

function dbRowToProgress(row: any): TopicProgress {
  return {
    topicId: row.topic_id,
    readComplete: row.read_complete,
    mcqScore: row.mcq_score,
    essayScore: row.essay_score ?? undefined,
  };
}

// ── profile ──────────────────────────────────────────────────

export async function getProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return dbRowToProfile(data);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert(profileToDbRow(profile), { onConflict: 'id' });

  if (error) throw new Error('saveProfile: ' + error.message);
}

// ── progress ─────────────────────────────────────────────────

export async function getProgress(topicId: string): Promise<TopicProgress | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('topic_id', topicId)
    .single();

  if (error || !data) return null;
  return dbRowToProgress(data);
}

export async function saveProgress(progress: TopicProgress): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('topic_progress')
    .upsert(
      {
        user_id: user.id,
        topic_id: progress.topicId,
        read_complete: progress.readComplete,
        mcq_score: progress.mcqScore,
        essay_score: progress.essayScore ?? null,
      },
      { onConflict: 'user_id,topic_id' }
    );

  if (error) throw new Error('saveProgress: ' + error.message);
}

export async function getAllProgress(): Promise<TopicProgress[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', user.id);

  if (error || !data) return [];
  return data.map(dbRowToProgress);
}

// ── badges ───────────────────────────────────────────────────

export async function getBadges(): Promise<Badge[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', user.id);

  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.badge_id,
    earnedAt: row.earned_at,
    // fill other badge fields from BADGES_DB at call site
  } as Badge));
}

export async function awardBadgeDB(badgeId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('user_badges')
    .upsert(
      { user_id: user.id, badge_id: badgeId },
      { onConflict: 'user_id,badge_id', ignoreDuplicates: true }
    );

  return !error;
}

// ── past papers ──────────────────────────────────────────────

export async function getPastPapers(): Promise<PastPaper[]> {
  const { data, error } = await supabase
    .from('past_papers')
    .select('*')
    .order('year', { ascending: false });

  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    subjectId: row.subject_id,
    year: row.year,
    paperNumber: row.paper_number,
    level: row.level,
    fileUrl: row.file_url ?? '#',
    title: row.title ?? undefined,
  }));
}

export async function addPastPaper(paper: Omit<PastPaper, 'id'>): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch('/api/admin/papers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify(paper),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to add paper');
  }
}

// ── theme (local only — purely cosmetic) ─────────────────────

export function getTheme(): 'light' | 'dark' {
  return (localStorage.getItem('akademi_theme') as 'light' | 'dark') || 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem('akademi_theme', theme);
}

// ── AkademiDB class wrapper (keeps all existing call sites working) ──

export const AkademiDB = {
  getProfile,
  saveProfile,
  getProgress,
  saveProgress,
  getAllProgress,
  getBadges,
  awardBadgeDB,
  getPastPapers,
  addPastPaper,
  getTheme,
  saveTheme,
  saveBadges: async () => {}, // deprecated — use awardBadgeDB
};
