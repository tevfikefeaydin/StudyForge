import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const userId = (session.user as { id: string }).id;

  const course = await prisma.course.findFirst({
    where: { id: courseId, userId },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Get all sections for the course
  const sections = await prisma.section.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
  });

  // Get progress for the user
  const progress = await prisma.progress.findMany({
    where: { userId, sectionId: { in: sections.map((s) => s.id) } },
  });

  const progressMap: Record<string, { mastery: number; xpEarned: number }> = {};
  for (const p of progress) {
    progressMap[p.sectionId] = { mastery: p.mastery, xpEarned: p.xpEarned };
  }

  // Build tree structure
  interface SectionWithChildren {
    id: string;
    title: string;
    level: number;
    order: number;
    parentId: string | null;
    children: SectionWithChildren[];
  }

  const sectionMap = new Map<string, SectionWithChildren>();
  const roots: SectionWithChildren[] = [];

  for (const s of sections) {
    sectionMap.set(s.id, { ...s, children: [] });
  }

  for (const s of sections) {
    const node = sectionMap.get(s.id)!;
    if (s.parentId && sectionMap.has(s.parentId)) {
      sectionMap.get(s.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return NextResponse.json({
    course: { id: course.id, title: course.title, description: course.description },
    sections: roots,
    progress: progressMap,
  });
}
