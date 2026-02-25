import type { SectionNode } from "@/types";

/**
 * Extracts a heading hierarchy from text content.
 * Recognizes Markdown-style headings (#, ##, ###) and
 * common patterns like all-caps lines, numbered headings, etc.
 */
export function extractHeadings(text: string): SectionNode[] {
  const lines = text.split("\n");
  const headings: { title: string; level: number; lineIndex: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Markdown headings
    const mdMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (mdMatch) {
      headings.push({
        title: mdMatch[2].trim(),
        level: mdMatch[1].length,
        lineIndex: i,
      });
      continue;
    }

    // Numbered headings like "1. Topic" or "1.2 Topic" or "1.2.3 Topic"
    const numberedMatch = line.match(/^(\d+(?:\.\d+)*)[.)]\s+(.+)$/);
    if (numberedMatch) {
      const depth = numberedMatch[1].split(".").length;
      const level = Math.min(depth, 3);
      headings.push({
        title: numberedMatch[2].trim(),
        level,
        lineIndex: i,
      });
      continue;
    }

    // ALL CAPS lines (at least 4 chars, no code-like patterns)
    if (
      line.length >= 4 &&
      line.length <= 100 &&
      line === line.toUpperCase() &&
      /^[A-Z\s\-:]+$/.test(line)
    ) {
      headings.push({ title: titleCase(line), level: 1, lineIndex: i });
      continue;
    }

    // Underline-style headings (next line is === or ---)
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (/^={3,}$/.test(nextLine)) {
        headings.push({ title: line, level: 1, lineIndex: i });
        continue;
      }
      if (/^-{3,}$/.test(nextLine)) {
        headings.push({ title: line, level: 2, lineIndex: i });
        continue;
      }
    }
  }

  if (headings.length === 0) {
    // If no headings found, create a single root section
    return [{ title: "Main Content", level: 1, order: 0, children: [] }];
  }

  return buildTree(headings);
}

function buildTree(
  headings: { title: string; level: number; lineIndex: number }[]
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
