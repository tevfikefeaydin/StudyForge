export type ChunkType = "text" | "code";

export interface ChunkInput {
  content: string;
  type: ChunkType;
  language?: string;
  sectionId?: string;
  metadata?: Record<string, unknown>;
}

export interface SectionNode {
  id?: string;
  title: string;
  level: number;
  order: number;
  children: SectionNode[];
}

export interface RetrievedChunk {
  id: string;
  content: string;
  type: ChunkType;
  language?: string;
  similarity: number;
}

export interface PracticeRequest {
  mode: "quiz" | "flashcard" | "code_study";
  sectionId: string;
  difficulty?: "easy" | "medium" | "hard";
  subMode?: "explain" | "predict" | "bug" | "fill";
}

export interface GeneratedQuestion {
  attemptId?: string;
  question: string;
  answer?: string;
  options?: string[];
  difficulty: "easy" | "medium" | "hard";
  chunkIds: string[];
  type: "mcq" | "short_answer" | "flashcard" | "code_explain" | "code_predict" | "code_bug" | "code_fill";
}

export interface GradeRequest {
  attemptId: string;
  userAnswer?: string;
  quality?: number;
  timeMs?: number;
}

export interface GradeResult {
  correct: boolean;
  score: number;
  feedback: string;
  xpEarned: number;
}
