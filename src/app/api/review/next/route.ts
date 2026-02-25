import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const reviewItem = await prisma.reviewQueue.findFirst({
    where: {
      userId,
      nextReview: { lte: new Date() },
    },
    orderBy: { nextReview: "asc" },
  });

  if (!reviewItem) {
    return NextResponse.json({ item: null });
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id: reviewItem.attemptId },
    include: {
      section: { select: { id: true, title: true, courseId: true } },
    },
  });

  if (!attempt) {
    // Clean up orphaned review item
    await prisma.reviewQueue.delete({ where: { id: reviewItem.id } });
    return NextResponse.json({ item: null });
  }

  return NextResponse.json({
    item: {
      reviewId: reviewItem.id,
      attemptId: attempt.id,
      question: attempt.question,
      answer: attempt.answer,
      mode: attempt.mode,
      section: attempt.section,
      repetitions: reviewItem.repetitions,
      interval: reviewItem.interval,
    },
  });
}
