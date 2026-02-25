import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retrieveContext } from "@/lib/rag";
import { generateQuizQuestion, generateFlashcard, generateCodeStudy } from "@/lib/prompts";
import { z } from "zod";

const bodySchema = z.object({
  mode: z.enum(["quiz", "flashcard", "code_study"]),
  sectionId: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  subMode: z.enum(["explain", "predict", "bug", "fill"]).optional(),
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

    const { mode, sectionId, difficulty, subMode } = parsed.data;

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Verify user owns the course
    const userId = (session.user as { id: string }).id;
    if (section.course.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Retrieve context
    const { textChunks, codeChunks } = await retrieveContext(
      section.courseId,
      sectionId,
      section.title,
      { topKText: 5, topKCode: 3 }
    );

    let question;
    switch (mode) {
      case "quiz":
        question = await generateQuizQuestion(textChunks, codeChunks, difficulty, section.title);
        break;
      case "flashcard":
        question = await generateFlashcard(textChunks, codeChunks, section.title);
        break;
      case "code_study":
        question = await generateCodeStudy(textChunks, codeChunks, subMode || "explain", section.title);
        break;
    }

    const allowedChunkIds = new Set([...textChunks, ...codeChunks].map((c) => c.id));
    const chunkIds = [...new Set((question.chunkIds || []).filter((id) => allowedChunkIds.has(id)))];
    const normalizedDifficulty = ["easy", "medium", "hard"].includes(question.difficulty)
      ? question.difficulty
      : difficulty;

    const pendingAttempt = await prisma.attempt.create({
      data: {
        userId,
        sectionId,
        mode,
        question: question.question,
        answer: question.answer ?? "",
        difficulty: normalizedDifficulty,
        chunkIds,
      },
    });

    return NextResponse.json({
      question: {
        ...question,
        difficulty: normalizedDifficulty,
        chunkIds,
        attemptId: pendingAttempt.id,
      },
    });
  } catch (error) {
    console.error("Practice generate error:", error);
    return NextResponse.json({ error: "Failed to generate question" }, { status: 500 });
  }
}
