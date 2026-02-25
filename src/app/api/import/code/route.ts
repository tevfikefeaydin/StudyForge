import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chunkCode, detectLanguage } from "@/lib/chunking";
import { embedAndStoreChunks } from "@/lib/rag";
import { z } from "zod";

const bodySchema = z.object({
  courseId: z.string().min(1),
  code: z.string().min(1).max(100000),
  language: z.string().max(20).optional(),
  title: z.string().max(200).optional(),
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

    const { courseId, code, language, title } = parsed.data;

    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: (session.user as { id: string }).id },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const lang = detectLanguage(code, language);

    // Create a section for this code import
    const section = await prisma.section.create({
      data: {
        courseId,
        title: title || `Code Import (${lang})`,
        level: 1,
        order: 0,
      },
    });

    // Chunk code
    const chunks = chunkCode(code, section.id, lang);

    // Embed and store
    const chunkIds = await embedAndStoreChunks(courseId, chunks);

    return NextResponse.json({
      success: true,
      sectionId: section.id,
      language: lang,
      chunks: chunkIds.length,
    });
  } catch (error) {
    console.error("Code import error:", error);
    return NextResponse.json({ error: "Failed to import code" }, { status: 500 });
  }
}
