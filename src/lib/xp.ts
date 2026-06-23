import { Badge, UserProfile } from '../types';
import { awardBadgeDB } from './db';

export const XP_VALUES = {
  first_login: 50,
  read_notes: 10,
  mcq_correct: 25,
  mcq_perfect: 150,
  essay_submit: 50,
  essay_high_score: 100,
  daily_login: 20,
  streak_3: 75,
  streak_7: 200,
  streak_14: 400,
  certificate_claim: 500,
};

export const BADGES_DB: Badge[] = [
  { id: 'pioneer',        name: 'Pioneer',       description: 'First profile creation',             icon: '🌟' },
  { id: 'flame_3',        name: '3-Day Streak',  description: 'Studied 3 days in a row',            icon: '🔥' },
  { id: 'flame_7',        name: '7-Day Streak',  description: 'Studied 7 days in a row',            icon: '🔥🔥' },
  { id: 'flame_14',       name: '14-Day Streak', description: 'Studied 14 days in a row',           icon: '🔥🔥🔥' },
  { id: 'perfect_score',  name: 'Perfect Score', description: 'Got 100% on MCQs',                  icon: '💯' },
  { id: 'benzene_master', name: 'Benzene Master',description: 'Completed organic chemistry topic',  icon: '⬡' },
  { id: 'equation_king',  name: 'Equation King', description: 'Completed a maths topic',            icon: '🧮' },
  { id: 'essayist',       name: 'Essayist',      description: 'First essay submitted',              icon: '✍️' },
  { id: 'top_grade',      name: 'Top Grade',     description: 'Essay score ≥ 80%',                  icon: '🏆' },
  { id: 'graduate',       name: 'Graduate',      description: 'Claimed a certificate',              icon: '🎓' },
];

export function calculateLevel(xp: number): number {
  return Math.min(Math.floor(Math.sqrt(xp / 100)) + 1, 50);
}

export function evaluateTopicStars(
  progress: { readComplete?: boolean; mcqScore?: number; essayScore?: number } | null | undefined
): number {
  if (!progress) return 0;
  if (progress.mcqScore === 100 || progress.essayScore !== undefined) return 3;
  if (progress.mcqScore !== undefined && progress.mcqScore >= 60) return 2;
  if (progress.readComplete) return 1;
  return 0;
}

/** Award a badge — async, idempotent (duplicate silently ignored in DB). */
export async function awardBadge(id: string): Promise<Badge | null> {
  const awarded = await awardBadgeDB(id);
  if (!awarded) return null;
  return BADGES_DB.find(b => b.id === id) ?? null;
}

/**
 * Process daily login XP and streaks.
 * Returns { xpGained, newStreak, badgeId? } for the caller to apply.
 */
export function processDailyLogin(profile: UserProfile): {
  xpGained: number;
  newStreak: number;
  badgeId: string | null;
} {
  const today = new Date().toDateString();
  const lastLogin = profile.lastLoginDate
    ? new Date(profile.lastLoginDate).toDateString()
    : null;

  if (lastLogin === today) {
    return { xpGained: 0, newStreak: profile.loginStreak, badgeId: null };
  }

  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const newStreak = lastLogin === yesterday ? profile.loginStreak + 1 : 1;

  let xpGained = XP_VALUES.daily_login;
  let badgeId: string | null = null;

  if (newStreak === 3)  { xpGained += XP_VALUES.streak_3;  badgeId = 'flame_3'; }
  if (newStreak === 7)  { xpGained += XP_VALUES.streak_7;  badgeId = 'flame_7'; }
  if (newStreak === 14) { xpGained += XP_VALUES.streak_14; badgeId = 'flame_14'; }

  return { xpGained, newStreak, badgeId };
}
