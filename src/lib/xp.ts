import { Badge, UserProfile, EducationLevel } from '../types';
import { awardBadgeDB } from './db';

// ── Form-level → education tier mapping ────────────────────────
// Form 1-2 = ZJC, Form 3-4 = O-Level, Form 5-6 = A-Level
export function formLevelToTier(formLevel: number): EducationLevel {
  if (formLevel <= 2) return 'zjc';
  if (formLevel <= 4) return 'o';
  return 'a';
}

export function formLevelLabel(formLevel: number): string {
  const tier = formLevelToTier(formLevel);
  if (tier === 'zjc') return `Form ${formLevel} (ZJC)`;
  if (tier === 'o') return `Form ${formLevel} (O-Level)`;
  const sixthLabel = formLevel === 5 ? 'Lower Sixth' : 'Upper Sixth';
  return `Form ${formLevel} · ${sixthLabel} (A-Level)`;
}

/**
 * Checks whether a student should be auto-promoted to the next form.
 * Promotion happens once per calendar year, triggered on first login of that year
 * (intended to align with the Zimbabwean school year starting in January).
 * Students at Form 6 are not promoted further (they graduate — subscription/UI handles that separately).
 */
export function checkFormPromotion(profile: UserProfile): {
  shouldPromote: boolean;
  newFormLevel: number;
  newLevel: EducationLevel;
} {
  const currentYear = new Date().getFullYear();
  const alreadyPromotedThisYear = profile.lastPromotedYear === currentYear;

  if (alreadyPromotedThisYear || profile.formLevel >= 6) {
    return { shouldPromote: false, newFormLevel: profile.formLevel, newLevel: profile.level };
  }

  // Only promote once we're actually into a new calendar year relative to
  // when the profile was created/last promoted. If lastPromotedYear is unset
  // (older accounts), treat account creation year as the baseline via lastLoginDate's year.
  const baselineYear = profile.lastPromotedYear
    ?? new Date(profile.lastLoginDate || Date.now()).getFullYear();

  if (currentYear <= baselineYear) {
    return { shouldPromote: false, newFormLevel: profile.formLevel, newLevel: profile.level };
  }

  const newFormLevel = Math.min(profile.formLevel + 1, 6);
  return {
    shouldPromote: true,
    newFormLevel,
    newLevel: formLevelToTier(newFormLevel),
  };
}


export const XP_VALUES = {
  first_login: 25,
  read_notes: 5,
  mcq_correct: 10,
  mcq_perfect: 60,
  essay_submit: 20,
  essay_high_score: 40,
  daily_login: 8,
  streak_3: 30,
  streak_7: 80,
  streak_14: 150,
  certificate_claim: 200,
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
  // Steeper curve than before — divisor increased from 100 to 250,
  // meaning roughly 2.5x more XP is needed to reach the same level.
  return Math.min(Math.floor(Math.sqrt(xp / 250)) + 1, 50);
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
