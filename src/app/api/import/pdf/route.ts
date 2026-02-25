import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractHeadings } from "@/lib/headings";
import { splitTextAndCode } from "@/lib/chunking";
import { embedAndStoreChunks } from "@/lib/rag";
import type { SectionNode } from "@/types";
import fs from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || "20") || 20) * 1024 * 1024;

async function saveSections(
  courseId: string,
  nodes: SectionNode[],
  parentId: string | null
): Promise<{ id: string; title: string; level: number }[]> {
  const saved: { id: string; title: string; level: number }[] = [];

  for (const node of nodes) {
    const section = await prisma.section.create({
      data: {
        courseId,
        parentId,
        title: node.title,
        level: node.level,
        order: node.order,
      },
    });
    saved.push({ id: section.id, title: section.title, level: section.level });

    if (node.children.length > 0) {
      const childSaved = await saveSections(courseId, node.children, section.id);
      saved.push(...childSaved);
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
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const courseId = formData.get("courseId") as string | null;

    if (!file || !courseId) {
      return NextResponse.json({ error: "File and courseId are required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files accepted" }, { status: 400 });
    }

    // Verify course ownership
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: (session.user as { id: string }).id },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Save file
    const uploadsDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Create upload record
    const upload = await prisma.upload.create({
      data: {
        courseId,
        fileName: file.name,
        filePath: fileName,
        fileType: "pdf",
        fileSize: file.size,
        status: "pending",
      },
    });

    try {
      // Parse PDF
      const pdf = (await import("pdf-parse")).default;
      const parsed = await pdf(buffer);
      const text = parsed.text;

      if (!text.trim()) {
        await prisma.upload.update({ where: { id: upload.id }, data: { status: "error", error: "No text extracted from PDF" } });
        return NextResponse.json({ error: "No text could be extracted from the PDF" }, { status: 400 });
      }

      // Extract headings and create sections
      const headingTree = extractHeadings(text);
      const sections = await saveSections(courseId, headingTree, null);

      // Chunk the text
      const defaultSectionId = sections[0]?.id;
      const chunks = splitTextAndCode(text, defaultSectionId);

      // Embed and store
      const chunkIds = await embedAndStoreChunks(courseId, chunks);

      await prisma.upload.update({ where: { id: upload.id }, data: { status: "processed" } });

      return NextResponse.json({
        success: true,
        sections: sections.length,
        chunks: chunkIds.length,
        uploadId: upload.id,
      });
    } catch (parseError) {
      const errMsg = parseError instanceof Error ? parseError.message : "Unknown error";
      await prisma.upload.update({ where: { id: upload.id }, data: { status: "error", error: errMsg } });
      throw parseError;
    }
  } catch (error) {
    console.error("PDF import error:", error);
    return NextResponse.json({ error: "Failed to import PDF" }, { status: 500 });
  }
}
