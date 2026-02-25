import type { ChunkInput } from "@/types";

const TEXT_MIN_TOKENS = 300;
const TEXT_MAX_TOKENS = 800;
const TEXT_OVERLAP_RATIO = 0.1;
const CODE_MAX_LINES = 400;
const CODE_MIN_LINES = 10;

/** Rough token count estimate: ~4 chars per token */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Chunk text content with overlap.
 * Tries to split on paragraph/sentence boundaries.
 */
export function chunkText(
  text: string,
  sectionId?: string,
  metadata?: Record<string, unknown>
): ChunkInput[] {
  const totalTokens = estimateTokens(text);
  if (totalTokens <= TEXT_MAX_TOKENS) {
    return text.trim()
      ? [{ content: text.trim(), type: "text", sectionId, metadata }]
      : [];
  }

  const chunks: ChunkInput[] = [];
  const paragraphs = text.split(/\n\s*\n/);
  let buffer = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const candidateTokens = estimateTokens(buffer + "\n\n" + trimmed);

    if (candidateTokens > TEXT_MAX_TOKENS && buffer.length > 0) {
      chunks.push({
        content: buffer.trim(),
        type: "text",
        sectionId,
        metadata,
      });

      // Overlap: keep the last ~10% of buffer
      const overlapChars = Math.floor(buffer.length * TEXT_OVERLAP_RATIO);
      buffer = buffer.slice(-overlapChars) + "\n\n" + trimmed;
    } else {
      buffer = buffer ? buffer + "\n\n" + trimmed : trimmed;
    }
  }

  if (buffer.trim() && estimateTokens(buffer) >= TEXT_MIN_TOKENS / 2) {
    chunks.push({
      content: buffer.trim(),
      type: "text",
      sectionId,
      metadata,
    });
  } else if (buffer.trim() && chunks.length > 0) {
    // Merge small remaining content with last chunk
    chunks[chunks.length - 1].content += "\n\n" + buffer.trim();
  } else if (buffer.trim()) {
    chunks.push({
      content: buffer.trim(),
      type: "text",
      sectionId,
      metadata,
    });
  }

  return chunks;
}

/**
 * Detect language from code fence or content heuristics.
 */
export function detectLanguage(code: string, hint?: string): string {
  if (hint) return hint.toLowerCase();

  // Common patterns
  if (/^#include\s|^using namespace\s|int main\s*\(/m.test(code)) return "cpp";
  if (/^#include\s.*\.h>|int main\s*\(/m.test(code) && !/class\s/m.test(code)) return "c";
  if (/^import\s+\w|^from\s+\w+\s+import|def\s+\w+\s*\(|class\s+\w+.*:/m.test(code)) return "python";
  if (/^(const|let|var|function|import|export)\s/m.test(code)) return "javascript";
  if (/:\s*(string|number|boolean|void)\s*[;=,){\n]|interface\s+\w+/m.test(code)) return "typescript";
  if (/^package\s+\w|^import\s+".*"|func\s+\w+/m.test(code)) return "go";
  if (/^(public|private|protected)\s+(static\s+)?(class|void|int|String)/m.test(code)) return "java";
  if (/^use\s+\w|fn\s+\w+|let\s+mut\s/m.test(code)) return "rust";
  if (/<[a-z]+[\s>]|<\/[a-z]+>/i.test(code) && /className|onClick|useState/m.test(code)) return "jsx";
  if (/^SELECT\s|^INSERT\s|^CREATE\s/im.test(code)) return "sql";

  return "text";
}

/**
 * Chunk code content. Tries to split on function/class boundaries,
 * falls back to line-based splitting.
 */
export function chunkCode(
  code: string,
  sectionId?: string,
  language?: string,
  metadata?: Record<string, unknown>
): ChunkInput[] {
  const lang = language || detectLanguage(code);
  const lines = code.split("\n");

  if (lines.length <= CODE_MAX_LINES) {
    return code.trim()
      ? [{ content: code.trim(), type: "code", language: lang, sectionId, metadata }]
      : [];
  }

  // Try to split on function/class boundaries
  const boundaries = findCodeBoundaries(lines, lang);

  if (boundaries.length > 1) {
    return boundaries
      .map((b) => ({
        content: lines.slice(b.start, b.end).join("\n").trim(),
        type: "code" as const,
        language: lang,
        sectionId,
        metadata: { ...metadata, startLine: b.start, endLine: b.end },
      }))
      .filter((c) => c.content.length > 0);
  }

  // Fallback: split by line count
  const chunks: ChunkInput[] = [];
  for (let i = 0; i < lines.length; i += CODE_MAX_LINES) {
    const slice = lines.slice(i, Math.min(i + CODE_MAX_LINES, lines.length));
    const content = slice.join("\n").trim();
    if (content) {
      chunks.push({
        content,
        type: "code",
        language: lang,
        sectionId,
        metadata: { ...metadata, startLine: i, endLine: i + slice.length },
      });
    }
  }

  return chunks;
}

interface CodeBoundary {
  start: number;
  end: number;
}

function findCodeBoundaries(lines: string[], lang: string): CodeBoundary[] {
  const boundaries: CodeBoundary[] = [];
  let current = 0;

  // Patterns for function/class starts by language
  const patterns: Record<string, RegExp> = {
    python: /^(def |class |async def )/,
    javascript: /^(function |const \w+ = |class |export )/,
    typescript: /^(function |const \w+ = |class |export |interface |type )/,
    java: /^(\s*(public|private|protected)\s+(static\s+)?(class|void|int|String|boolean|List|Map))/,
    cpp: /^(\w[\w:<>*& ]+\s+\w+\s*\(|class \w+|namespace \w+)/,
    c: /^(\w[\w* ]+\s+\w+\s*\()/,
    go: /^(func |type \w+ struct)/,
    rust: /^(fn |pub fn |struct |impl |enum |trait )/,
  };

  const pattern = patterns[lang];
  if (!pattern) return [];

  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i].trim()) && i > current + CODE_MIN_LINES) {
      boundaries.push({ start: current, end: i });
      current = i;
    }
  }

  if (current < lines.length) {
    boundaries.push({ start: current, end: lines.length });
  }

  return boundaries;
}

/**
 * Parse text that may contain code fences and split into text and code chunks.
 */
export function splitTextAndCode(
  content: string,
  sectionId?: string
): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Text before this code block
    const textBefore = content.slice(lastIndex, match.index).trim();
    if (textBefore) {
      chunks.push(...chunkText(textBefore, sectionId));
    }

    // Code block
    const lang = match[1] || undefined;
    const code = match[2];
    if (code.trim()) {
      chunks.push(...chunkCode(code, sectionId, lang));
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last code block
  const remaining = content.slice(lastIndex).trim();
  if (remaining) {
    chunks.push(...chunkText(remaining, sectionId));
  }

  return chunks;
}
