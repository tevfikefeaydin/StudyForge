import { prisma } from "./prisma";

interface XPCalcInput {
  correct: boolean;
  difficulty: string;
  streak: number;
  timeMs?: number;
}

/**
 * Calculate XP earned for an attempt.
 * +10 correct, +20 hard correct, streak bonus
 */
export function calculateXP(input: XPCalcInput): number {
  if (!input.correct) return 0;

  let xp = 10;

  // Difficulty bonus
  if (input.difficulty === "hard") xp = 20;
  else if (input.difficulty === "medium") xp = 15;

  // Streak bonus: +2 per streak level, max +20
  const streakBonus = Math.min(input.streak * 2, 20);
  xp += streakBonus;

  // Speed bonus: if answered in under 10 seconds, +5
  if (input.timeMs && input.timeMs < 10000) xp += 5;

  return xp;
}

/**
 * Update mastery for a section based on last N attempts.
 * Uses accuracy, difficulty weighting, and recency.
 */
export async function updateMastery(
  userId: string,
  sectionId: string
): Promise<number> {
  const recentAttempts = await prisma.attempt.findMany({
    where: { userId, sectionId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (recentAttempts.length === 0) return 0;

  let weightedScore = 0;
  let totalWeight = 0;

  for (let i = 0; i < recentAttempts.length; i++) {
    const attempt = recentAttempts[i];
    const recencyWeight = 1 / (1 + i * 0.1); // More recent = higher weight
    const difficultyWeight =
      attempt.difficulty === "hard" ? 1.5 : attempt.difficulty === "medium" ? 1.0 : 0.7;
    const weight = recencyWeight * difficultyWeight;

    const score = attempt.correct ? (attempt.score ?? 1) : 0;
    weightedScore += score * weight;
    totalWeight += weight;
  }

  const mastery = Math.round((weightedScore / totalWeight) * 100);

  await prisma.progress.upsert({
    where: { userId_sectionId: { userId, sectionId } },
    update: { mastery },
    create: { userId, sectionId, mastery },
  });

  return mastery;
}

/**
 * Record an attempt and update XP, streak, mastery, and review queue.
 */
export async function recordAttempt(params: {
  userId: string;
  sectionId: string;
  mode: string;
  question: string;
  answer: string;
  userAnswer: string;
  correct: boolean;
  score: number;
  difficulty: string;
  timeMs?: number;
  chunkIds: string[];
  feedback: string;
}): Promise<{ xpEarned: number; newStreak: number; mastery: number }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });

  // Check if streak continues (active within last 24h)
  const now = new Date();
  const lastActive = user.lastActiveAt;
  const hoursSinceActive = lastActive
    ? (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60)
    : Infinity;

  let newStreak = user.streak;
  if (params.correct) {
    newStreak = hoursSinceActive <= 24 ? user.streak + 1 : 1;
  } else {
    newStreak = 0;
  }

  const xpEarned = calculateXP({
    correct: params.correct,
    difficulty: params.difficulty,
    streak: newStreak,
    timeMs: params.timeMs,
  });

  // Create attempt
  const attempt = await prisma.attempt.create({
    data: {
      userId: params.userId,
      sectionId: params.sectionId,
      mode: params.mode,
      question: params.question,
      answer: params.answer,
      userAnswer: params.userAnswer,
      correct: params.correct,
      score: params.score,
      difficulty: params.difficulty,
      timeMs: params.timeMs,
      chunkIds: params.chunkIds,
      feedback: params.feedback,
    },
  });

  // Update user XP and streak
  await prisma.user.update({
    where: { id: params.userId },
    data: {
      xp: { increment: xpEarned },
      streak: newStreak,
      lastActiveAt: now,
    },
  });

  // Update progress XP
  await prisma.progress.upsert({
    where: { userId_sectionId: { userId: params.userId, sectionId: params.sectionId } },
    update: { xpEarned: { increment: xpEarned } },
    create: { userId: params.userId, sectionId: params.sectionId, xpEarned },
  });

  // Add to review queue if wrong
  if (!params.correct) {
    await prisma.reviewQueue.create({
      data: {
        userId: params.userId,
        attemptId: attempt.id,
        nextReview: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
      },
    });
  }

  // Update mastery
  const mastery = await updateMastery(params.userId, params.sectionId);

  return { xpEarned, newStreak, mastery };
}

/**
 * SM-2 inspired spaced repetition update for review queue items.
 */
export async function updateReviewSchedule(
  reviewId: string,
  quality: number // 0-5 scale
): Promise<void> {
  const review = await prisma.reviewQueue.findUniqueOrThrow({
    where: { id: reviewId },
  });

  let { easeFactor, interval, repetitions } = review;

  if (quality >= 3) {
    // Correct
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    repetitions += 1;
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    // Incorrect — reset
    repetitions = 0;
    interval = 1;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  await prisma.reviewQueue.update({
    where: { id: reviewId },
    data: { easeFactor, interval, repetitions, nextReview },
  });
}
