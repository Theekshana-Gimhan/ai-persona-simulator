
export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

export enum AppState {
  IDLE,
  GENERATING_PERSONA,
  READY_FOR_CALL,
  IN_CALL,
  EVALUATING,
  REPORT_READY,
}

export interface Persona {
  name: string;
  age: number;
  background: string;
  interests: string;
  topicOfInterest: string;
  concerns: string[];
  personality: string;
}

export interface EvaluationCriteria {
  criteria: string;
  score: number;
  feedback: string;
}

export interface EvaluationReport {
  overallScore: number;
  overallFeedback: string;
  evaluation: EvaluationCriteria[];
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}