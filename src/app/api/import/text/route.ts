import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractHeadings } from "@/lib/headings";
import { splitTextAndCode } from "@/lib/chunking";
import { embedAndStoreChunks } from "@/lib/rag";
import type { SectionNode } from "@/types";
import { z } from "zod";

const bodySchema = z.object({
  courseId: z.string().min(1),
  content: z.string().min(1).max(100000),
  title: z.string().max(200).optional(),
});

async function saveSections(
  courseId: string,
  nodes: SectionNode[],
  parentId: string | null
): Promise<{ id: string; title: string }[]> {
  const saved: { id: string; title: string }[] = [];
  for (const node of nodes) {
    const section = await prisma.section.create({
      data: { courseId, parentId, title: node.title, level: node.level, order: node.order },
    });
    saved.push({ id: section.id, title: section.title });
    if (node.children.length > 0) {
      saved.push(...(await saveSections(courseId, node.children, section.id)));
    }
  }
  return saved;
}

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

    const { courseId, content, title } = parsed.data;

    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: (session.user as { id: string }).id },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Extract headings
    const headingTree = extractHeadings(content);
    if (title && headingTree.length > 0 && headingTree[0].title === "Main Content") {
      headingTree[0].title = title;
    }
    const sections = await saveSections(courseId, headingTree, null);

    // Chunk
    const defaultSectionId = sections[0]?.id;
    const chunks = splitTextAndCode(content, defaultSectionId);

    // Embed and store
    const chunkIds = await embedAndStoreChunks(courseId, chunks);

    return NextResponse.json({
      success: true,
      sections: sections.length,
      chunks: chunkIds.length,
    });
  } catch (error) {
    console.error("Text import error:", error);
    return NextResponse.json({ error: "Failed to import text" }, { status: 500 });
  }
}
