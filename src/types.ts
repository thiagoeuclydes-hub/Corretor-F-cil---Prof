export type QuestionType = 'MC' | 'OPEN';

export interface Question {
  id: number;
  type: QuestionType;
  correctAnswer?: string; // For MC: 'A', 'B', etc.
  correctText?: string;   // For OPEN questions
}

export interface Gabarito {
  id: string;
  name: string;
  questions: Question[];
  createdAt: number;
  userId?: string;
}

export interface AnswerWithPosition {
  value: string;
  x?: number; // percentage 0-100
  y?: number; // percentage 0-100
}

export interface ScanResult {
  studentAnswers: Record<number, AnswerWithPosition>;
  score: number;
  total: number;
  percentage: number;
  timestamp: number;
  capturedImage?: string; // base64
}
