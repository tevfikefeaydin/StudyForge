import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeAnswer } from "@/lib/prompts";
import { recordAttempt } from "@/lib/gamification";
import { z } from "zod";

const bodySchema = z.object({
  sectionId: z.string().min(1),
  mode: z.string().min(1),
  question: z.string().min(1).max(10000),
  correctAnswer: z.string().max(10000),
  userAnswer: z.string().min(1).max(10000),
  chunkIds: z.array(z.string()),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  timeMs: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { sectionId, mode, question, correctAnswer, userAnswer, chunkIds, difficulty, timeMs } = parsed.data;
    const userId = (session.user as { id: string }).id;

    // Verify section access
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });
    if (!section || section.course.userId !== userId) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Grade the answer
    let gradeResult: { correct: boolean; score: number; feedback: string };

    if (mode === "quiz" && correctAnswer.match(/^[A-D]\)/)) {
      // MCQ: simple letter comparison
      const correctLetter = correctAnswer.charAt(0).toUpperCase();
      const userLetter = userAnswer.trim().charAt(0).toUpperCase();
      const correct = correctLetter === userLetter;
      gradeResult = {
        correct,
        score: correct ? 1 : 0,
        feedback: correct ? "Correct!" : `Incorrect. The correct answer is ${correctAnswer}`,
      };
    } else {
      // Short answer / code: use LLM grading
      const chunks = await prisma.chunk.findMany({
        where: { id: { in: chunkIds } },
      });
      const retrievedChunks = chunks.map((c) => ({
        id: c.id,
        content: c.content,
        type: c.type as "text" | "code",
        language: c.language ?? undefined,
        similarity: 1,
      }));
      gradeResult = await gradeAnswer(question, correctAnswer, userAnswer, retrievedChunks);
    }

    // Record attempt and update gamification
    const result = await recordAttempt({
      userId,
      sectionId,
      mode,
      question,
      answer: correctAnswer,
      userAnswer,
      correct: gradeResult.correct,
      score: gradeResult.score,
      difficulty,
      timeMs,
      chunkIds,
      feedback: gradeResult.feedback,
    });

    return NextResponse.json({
      correct: gradeResult.correct,
      score: gradeResult.score,
      feedback: gradeResult.feedback,
      xpEarned: result.xpEarned,
      streak: result.newStreak,
      mastery: result.mastery,
    });
  } catch (error) {
    console.error("Practice grade error:", error);
    return NextResponse.json({ error: "Failed to grade answer" }, { status: 500 });
  }
}
