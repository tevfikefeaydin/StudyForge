import type { SectionNode } from "@/types";

interface DetectedHeading {
  title: string;
  level: number;
  lineIndex: number;
}

export interface SectionContentBlock {
  title: string;
  level: number;
  order: number;
  content: string;
}

/**
 * Extracts a heading hierarchy from text content.
 * Recognizes Markdown-style headings (#, ##, ###) and
 * common patterns like all-caps lines, numbered headings, etc.
 */
export function extractHeadings(text: string): SectionNode[] {
  const lines = text.split("\n");
  const headings = collectHeadings(lines);

  if (headings.length === 0) {
    // If no headings found, create a single root section
    return [{ title: "Main Content", level: 1, order: 0, children: [] }];
  }

  return buildTree(headings);
}

/**
 * Splits full content into heading-aligned blocks.
 * Block order matches heading order so each block can be paired with created sections.
 */
export function splitContentByHeadings(text: string): SectionContentBlock[] {
  const lines = text.split("\n");
  const headings = collectHeadings(lines);

  if (headings.length === 0) {
    return [
      {
        title: "Main Content",
        level: 1,
        order: 0,
        content: text.trim(),
      },
    ];
  }

  const blocks = headings.map((heading, index) => {
    const endLine = index + 1 < headings.length ? headings[index + 1].lineIndex : lines.length;
    const content = lines.slice(heading.lineIndex, endLine).join("\n").trim();
    return {
      title: heading.title,
      level: heading.level,
      order: index,
      content,
    };
  });

  const intro = lines.slice(0, headings[0].lineIndex).join("\n").trim();
  if (intro && blocks.length > 0) {
    blocks[0].content = `${intro}\n\n${blocks[0].content}`.trim();
  }

  return blocks;
}

function collectHeadings(lines: string[]): DetectedHeading[] {
  const headings: DetectedHeading[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const detected = detectHeading(line, lines[i + 1]?.trim());
    if (!detected) continue;

    headings.push({
      title: detected.title,
      level: detected.level,
      lineIndex: i,
    });
  }

  return headings;
}

function detectHeading(
  line: string,
  nextLine?: string
): { title: string; level: number } | null {
  // Markdown headings
  const mdMatch = line.match(/^(#{1,3})\s+(.+)$/);
  if (mdMatch) {
    return {
      title: mdMatch[2].trim(),
      level: mdMatch[1].length,
    };
  }

  // Numbered headings like "1. Topic" or "1.2 Topic" or "1.2.3 Topic"
  const numberedMatch = line.match(/^(\d+(?:\.\d+)*)[.)]\s+(.+)$/);
  if (numberedMatch) {
    const depth = numberedMatch[1].split(".").length;
    return {
      title: numberedMatch[2].trim(),
      level: Math.min(depth, 3),
    };
  }

  // ALL CAPS lines (at least 4 chars, no code-like patterns)
  if (
    line.length >= 4 &&
    line.length <= 100 &&
    line === line.toUpperCase() &&
    /^[A-Z\s\-:]+$/.test(line)
  ) {
    return { title: titleCase(line), level: 1 };
  }

  // Underline-style headings (next line is === or ---)
  if (nextLine) {
    if (/^={3,}$/.test(nextLine)) {
      return { title: line, level: 1 };
    }
    if (/^-{3,}$/.test(nextLine)) {
      return { title: line, level: 2 };
    }
  }

  return null;
}

function buildTree(
  headings: DetectedHeading[]
): SectionNode[] {
  const root: SectionNode[] = [];
  const stack: { node: SectionNode; level: number }[] = [];

  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const node: SectionNode = {
      title: h.title,
      level: h.level,
      order: i,
      children: [],
    };

    // Pop stack until we find a parent with lower level
    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, level: h.level });
  }

  return root;
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
