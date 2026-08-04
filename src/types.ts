export interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type EducationLevel = "zjc" | "o" | "a";

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  summary: string;
  readXP: number;
  contentMarkdown: string;
  mcqs: MCQQuestion[];
  essayPrompt?: string;
  essayRubric?: string[];
  hasThreeDModel?: "benzene" | "dna-helix" | "electronconfiguration" | "voltmeter-circuit";
  hasMathEquations?: boolean;
  bannerIllustration?: string;
  /** Which term this topic is typically taught in (1-3). Undefined = any term. */
  term?: 1 | 2 | 3;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  level: EducationLevel;
  themeColor: string;
  vibeText: string;
  topics: Topic[];
}

export interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  school?: string;
  city?: string;
  level: EducationLevel;
  /** 1-6, mapping to Zimbabwe's Form 1 through Form 6 */
  formLevel: number;
  /** Year this profile was last auto-promoted, to prevent double-promotion */
  lastPromotedYear?: number;
  subjects: string[];
  xp: number;
  loginStreak: number;
  lastLoginDate: string;
  subscriptionStatus: "active" | "trial" | "expired";
  subscriptionExpiresAt?: string;
  isAdmin?: boolean;
  isTeacher?: boolean;
  theme: "light" | "dark";
}

export interface TopicProgress {
  topicId: string;
  readComplete: boolean;
  mcqScore: number;
  essayScore?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
}

export interface PastPaper {
  id: string;
  subjectId: string;
  year: number;
  paperNumber: number;
  level: EducationLevel;
  fileUrl: string;
  title?: string;
}
