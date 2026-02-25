import { chatCompletion, isLLMConfigured, type LLMMessage } from "./llm";
import type { RetrievedChunk, GeneratedQuestion } from "@/types";

function formatChunks(chunks: RetrievedChunk[]): string {
  return chunks
    .map(
      (c, i) =>
        `[Chunk ${c.id}] (${c.type}${c.language ? `, ${c.language}` : ""}):\n${c.content}`
    )
    .join("\n\n---\n\n");
}

const GROUNDING_INSTRUCTION = `IMPORTANT: Base your response ONLY on the provided context chunks.
If the context is insufficient to create a good question/answer, respond with:
{"insufficient": true, "message": "Not found in your notes"}
Always include "chunkIds" array referencing which chunks you used.`;

/**
 * Generate a quiz question (MCQ or short answer) grounded in chunks.
 */
export async function generateQuizQuestion(
  textChunks: RetrievedChunk[],
  codeChunks: RetrievedChunk[],
  difficulty: string,
  sectionTitle: string
): Promise<GeneratedQuestion> {
  const allChunks = [...textChunks, ...codeChunks];
  if (allChunks.length === 0) {
    return {
      question: "Not found in your notes — no content available for this section.",
      difficulty: difficulty as "easy" | "medium" | "hard",
      chunkIds: [],
      type: "short_answer",
    };
  }

  // Stub mode when LLM not configured
  if (!isLLMConfigured()) {
    const chunk = allChunks[Math.floor(Math.random() * allChunks.length)];
    const snippet = chunk.content.slice(0, 300);
    return {
      question: `[Demo Mode - No LLM Key]\n\nBased on "${sectionTitle}", explain the following concept in your own words:\n\n"${snippet}..."`,
      answer: snippet,
      difficulty: difficulty as "easy" | "medium" | "hard",
      chunkIds: [chunk.id],
      type: "short_answer",
    };
  }

  const chooseMCQ = Math.random() > 0.4; // 60% MCQ, 40% short answer

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are an educational quiz generator. Create a ${difficulty} difficulty ${chooseMCQ ? "multiple choice (MCQ)" : "short answer"} question for the topic "${sectionTitle}".

${GROUNDING_INSTRUCTION}

Respond in JSON format:
${
  chooseMCQ
    ? `{
  "question": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "answer": "The correct option letter and explanation",
  "difficulty": "${difficulty}",
  "chunkIds": ["id1", "id2"],
  "type": "mcq"
}`
    : `{
  "question": "...",
  "answer": "Expected answer with key points",
  "difficulty": "${difficulty}",
  "chunkIds": ["id1", "id2"],
  "type": "short_answer"
}`
}`,
    },
    {
      role: "user",
      content: `Context from student notes:\n\n${formatChunks(allChunks)}`,
    },
  ];

  const response = await chatCompletion(messages, { jsonMode: true, temperature: 0.8 });

  try {
    const parsed = JSON.parse(response.content);
    if (parsed.insufficient) {
      return {
        question: parsed.message || "Not found in your notes",
        difficulty: difficulty as "easy" | "medium" | "hard",
        chunkIds: [],
        type: "short_answer",
      };
    }
    return parsed as GeneratedQuestion;
  } catch {
    return {
      question: response.content,
      difficulty: difficulty as "easy" | "medium" | "hard",
      chunkIds: allChunks.map((c) => c.id),
      type: "short_answer",
    };
  }
}

/**
 * Generate a flashcard grounded in chunks.
 */
export async function generateFlashcard(
  textChunks: RetrievedChunk[],
  codeChunks: RetrievedChunk[],
  sectionTitle: string
): Promise<GeneratedQuestion> {
  const allChunks = [...textChunks, ...codeChunks];
  if (allChunks.length === 0) {
    return {
      question: "Not found in your notes",
      answer: "",
      difficulty: "medium",
      chunkIds: [],
      type: "flashcard",
    };
  }

  if (!isLLMConfigured()) {
    const chunk = allChunks[Math.floor(Math.random() * allChunks.length)];
    const lines = chunk.content.split("\n").filter((l) => l.trim());
    return {
      question: `[Demo] What do you know about: ${lines[0]?.slice(0, 100) || sectionTitle}?`,
      answer: lines.slice(0, 5).join("\n"),
      difficulty: "medium",
      chunkIds: [chunk.id],
      type: "flashcard",
    };
  }

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are an educational flashcard creator. Create a concise flashcard for the topic "${sectionTitle}".
The front should be a clear question or prompt, the back should be a concise answer.

${GROUNDING_INSTRUCTION}

Respond in JSON:
{
  "question": "Front of card",
  "answer": "Back of card",
  "difficulty": "easy|medium|hard",
  "chunkIds": ["id1"],
  "type": "flashcard"
}`,
    },
    {
      role: "user",
      content: `Context:\n\n${formatChunks(allChunks)}`,
    },
  ];

  const response = await chatCompletion(messages, { jsonMode: true, temperature: 0.8 });

  try {
    const parsed = JSON.parse(response.content);
    if (parsed.insufficient) {
      return { question: parsed.message, answer: "", difficulty: "medium", chunkIds: [], type: "flashcard" };
    }
    return { ...parsed, type: "flashcard" };
  } catch {
    return {
      question: response.content,
      answer: "",
      difficulty: "medium",
      chunkIds: allChunks.map((c) => c.id),
      type: "flashcard",
    };
  }
}

/**
 * Generate a code study task grounded in code chunks.
 */
export async function generateCodeStudy(
  textChunks: RetrievedChunk[],
  codeChunks: RetrievedChunk[],
  subMode: string,
  sectionTitle: string
): Promise<GeneratedQuestion> {
  const allChunks = [...textChunks, ...codeChunks];
  if (codeChunks.length === 0) {
    return {
      question: "No code snippets found in your notes for this section.",
      difficulty: "medium",
      chunkIds: [],
      type: `code_${subMode}` as GeneratedQuestion["type"],
    };
  }

  if (!isLLMConfigured()) {
    const chunk = codeChunks[Math.floor(Math.random() * codeChunks.length)];
    return {
      question: `[Demo Mode]\n\nExplain what this code does:\n\n${chunk.content.slice(0, 500)}`,
      answer: `This is ${chunk.language || "code"} related to ${sectionTitle}.`,
      difficulty: "medium",
      chunkIds: [chunk.id],
      type: `code_${subMode}` as GeneratedQuestion["type"],
    };
  }

  const subModeInstructions: Record<string, string> = {
    explain: `Present a code snippet and ask the student to explain what it does, step by step.`,
    predict: `Present a code snippet and ask the student to predict its output. Include the correct output in the answer.`,
    bug: `Take a code snippet and introduce a subtle bug. Ask the student to find and fix the bug. Include the original correct code in the answer.`,
    fill: `Take a code snippet and remove a key part (replace with ___). Ask the student to fill in the missing code. Include the correct code in the answer.`,
  };

  const instruction = subModeInstructions[subMode] || subModeInstructions.explain;

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are a code study exercise creator for the topic "${sectionTitle}".
Task: ${instruction}

${GROUNDING_INSTRUCTION}

Respond in JSON:
{
  "question": "The exercise prompt with code",
  "answer": "The correct answer/solution",
  "difficulty": "easy|medium|hard",
  "chunkIds": ["id1"],
  "type": "code_${subMode}"
}`,
    },
    {
      role: "user",
      content: `Context:\n\n${formatChunks(allChunks)}`,
    },
  ];

  const response = await chatCompletion(messages, { jsonMode: true, temperature: 0.7 });

  try {
    const parsed = JSON.parse(response.content);
    if (parsed.insufficient) {
      return {
        question: parsed.message,
        difficulty: "medium",
        chunkIds: [],
        type: `code_${subMode}` as GeneratedQuestion["type"],
      };
    }
    return parsed;
  } catch {
    return {
      question: response.content,
      difficulty: "medium",
      chunkIds: allChunks.map((c) => c.id),
      type: `code_${subMode}` as GeneratedQuestion["type"],
    };
  }
}

/**
 * Grade a short answer using LLM with rubric.
 */
export async function gradeAnswer(
  question: string,
  correctAnswer: string,
  userAnswer: string,
  chunks: RetrievedChunk[]
): Promise<{ correct: boolean; score: number; feedback: string }> {
  if (!isLLMConfigured()) {
    // Simple heuristic grading: check if user answer has some overlap with correct answer
    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedCorrect = correctAnswer.toLowerCase().trim();
    const words = normalizedCorrect.split(/\s+/).filter((w) => w.length > 3);
    const matchCount = words.filter((w) => normalizedUser.includes(w)).length;
    const score = words.length > 0 ? Math.min(1, matchCount / Math.max(words.length * 0.5, 1)) : 0.5;
    return {
      correct: score >= 0.5,
      score,
      feedback: `[Demo Mode] Keyword overlap grading: ${matchCount}/${words.length} key terms matched. Add an LLM API key for AI-powered grading.`,
    };
  }

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are a fair grader. Grade the student's answer against the correct answer.
Use the provided context chunks as additional reference.
Be generous with partial credit for answers that show understanding.

Respond in JSON:
{
  "correct": true/false,
  "score": 0.0-1.0,
  "feedback": "Brief constructive feedback explaining what was right/wrong"
}

A score >= 0.7 counts as correct.`,
    },
    {
      role: "user",
      content: `Question: ${question}

Correct Answer: ${correctAnswer}

Student's Answer: ${userAnswer}

Reference Context:
${formatChunks(chunks)}`,
    },
  ];

  const response = await chatCompletion(messages, { jsonMode: true, temperature: 0.3 });

  try {
    const parsed = JSON.parse(response.content);
    return {
      correct: parsed.score >= 0.7,
      score: Math.max(0, Math.min(1, parsed.score)),
      feedback: parsed.feedback || "",
    };
  } catch {
    return { correct: false, score: 0, feedback: "Unable to grade answer." };
  }
}
