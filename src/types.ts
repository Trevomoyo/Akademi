export interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

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
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  level: "o" | "a";
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
  level: "o" | "a";
  subjects: string[];
  xp: number;
  loginStreak: number;
  lastLoginDate: string;
  subscriptionStatus: "active" | "trial" | "expired";
  subscriptionExpiresAt?: string;
  isAdmin?: boolean;
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
  level: "o" | "a";
  fileUrl: string;
  title?: string;
}
