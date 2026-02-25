import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateReviewSchedule } from "@/lib/gamification";

const bodySchema = z.object({
  reviewId: z.string().min(1),
  quality: z.number().int().min(0).max(5),
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

    const userId = (session.user as { id: string }).id;
    const review = await prisma.reviewQueue.findFirst({
      where: { id: parsed.data.reviewId, userId },
      select: { id: true },
    });
    if (!review) {
      return NextResponse.json({ error: "Review item not found" }, { status: 404 });
    }

    await updateReviewSchedule(review.id, parsed.data.quality);

    const updated = await prisma.reviewQueue.findUnique({
      where: { id: review.id },
      select: {
        id: true,
        nextReview: true,
        interval: true,
        repetitions: true,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Review rate error:", error);
    return NextResponse.json({ error: "Failed to update review schedule" }, { status: 500 });
  }
}
