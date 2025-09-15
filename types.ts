
export interface ScoreItem {
  score: number;
  justification: string;
}

export type QuestionKey = `A${number}` | `B${number}` | `C${number}`;

export type Scores = Record<`${'A' | 'B' | 'C'}${number}_${string}`, ScoreItem>;

export interface RepresentativeActivity {
  title: string;
  description: string;
}

export interface InquiryExample {
  tag: string;
  title: string;
  description: string;
}

export interface EvaluationResult {
  scores: Scores;
  studentName: string;
  tagline: string;
  coreCompetency: string;
  keyStrengths: string;
  suggestions: string;
  representativeActivities: RepresentativeActivity[];
  inquiryExcellentExamples: InquiryExample[];
  inquiryImprovementExample: InquiryExample;
}

export interface CategoryScores {
  key: 'A' | 'B' | 'C';
  name: string;
  average: number;
  totalScore: number;
  maxScore: number;
  items: {
    id: string;
    label: string;
    score: number;
    justification: string;
  }[];
}
