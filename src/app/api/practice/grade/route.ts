import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeAnswer } from "@/lib/prompts";
import { recordAttempt } from "@/lib/gamification";
import { z } from "zod";

const bodySchema = z.object({
  attemptId: z.string().min(1),
  userAnswer: z.string().max(10000).optional(),
  quality: z.number().int().min(0).max(5).optional(),
  timeMs: z.number().int().positive().max(1000 * 60 * 60).optional(),
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

    const { attemptId, timeMs } = parsed.data;
    const userId = (session.user as { id: string }).id;

    const attempt = await prisma.attempt.findFirst({
      where: { id: attemptId, userId },
      include: { section: { include: { course: true } } },
    });
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }
    if (attempt.section.course.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (attempt.correct !== null) {
      return NextResponse.json({ error: "Attempt already graded" }, { status: 409 });
    }

    const correctAnswer = attempt.answer ?? "";
    let submittedAnswer = parsed.data.userAnswer?.trim() ?? "";

    // Grade the answer on server-side canonical attempt data.
    let gradeResult: { correct: boolean; score: number; feedback: string };
    if (attempt.mode === "flashcard") {
      const qualityFromAnswer = submittedAnswer.toLowerCase() === "unknown" ? 1 : 4;
      const quality = parsed.data.quality ?? qualityFromAnswer;
      const score = Math.max(0, Math.min(1, quality / 5));
      const correct = quality >= 3;
      submittedAnswer = submittedAnswer || (correct ? "known" : "unknown");
      gradeResult = {
        correct,
        score,
        feedback: correct ? "Good recall. Keep the streak going." : "Needs review. This card was queued again.",
      };
    } else if (!submittedAnswer) {
      return NextResponse.json({ error: "Answer is required" }, { status: 400 });
    } else if (attempt.mode === "quiz" && correctAnswer.match(/^[A-D]\)/)) {
      // MCQ: simple letter comparison
      const correctLetter = correctAnswer.charAt(0).toUpperCase();
      const userLetter = submittedAnswer.charAt(0).toUpperCase();
      const correct = correctLetter === userLetter;
      gradeResult = {
        correct,
        score: correct ? 1 : 0,
        feedback: correct ? "Correct!" : `Incorrect. The correct answer is ${correctAnswer}`,
      };
    } else if (!correctAnswer.trim()) {
      gradeResult = {
        correct: false,
        score: 0,
        feedback: "Reference answer is missing for this question.",
      };
    } else {
      // Short answer / code: use LLM grading with ownership-verified chunks.
      const chunks = await prisma.chunk.findMany({
        where: {
          id: { in: attempt.chunkIds },
          course: { userId },
        },
        select: { id: true, content: true, type: true, language: true },
      });
      const retrievedChunks = chunks.map((c) => ({
        id: c.id,
        content: c.content,
        type: c.type as "text" | "code",
        language: c.language ?? undefined,
        similarity: 1,
      }));
      gradeResult = await gradeAnswer(attempt.question, correctAnswer, submittedAnswer, retrievedChunks);
    }

    let result;
    try {
      // Finalize attempt and update gamification atomically.
      result = await recordAttempt({
        attemptId: attempt.id,
        userId,
        sectionId: attempt.sectionId,
        mode: attempt.mode,
        userAnswer: submittedAnswer,
        correct: gradeResult.correct,
        score: gradeResult.score,
        difficulty: attempt.difficulty,
        timeMs,
        feedback: gradeResult.feedback,
      });
    } catch (recordError) {
      if (recordError instanceof Error && recordError.message === "ATTEMPT_ALREADY_GRADED") {
        return NextResponse.json({ error: "Attempt already graded" }, { status: 409 });
      }
      throw recordError;
    }

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
