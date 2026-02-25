# StudyForge

AI-powered gamified study platform that turns your course notes into interactive practice sessions.

Import PDFs, text notes, and code snippets — StudyForge automatically extracts structure, builds a course map, and generates quizzes, flashcards, and code exercises grounded in **your** material using RAG (Retrieval-Augmented Generation).

## Features

**Content Import**
- Upload PDFs with automatic text extraction
- Paste plain text with Markdown heading detection (`#`, `##`, `###`, numbered, underline-style)
- Paste code with automatic language detection (Python, JS, TS, Java, C, C++, Go, Rust, SQL)
- Mixed content support — code fences inside text are split into separate code chunks

**Smart Chunking**
- Text: 300–800 token chunks with ~10% overlap, split on paragraph boundaries
- Code: split on function/class boundaries, fallback to 200–400 line blocks
- Every chunk is embedded and stored for vector similarity retrieval

**Practice Modes**
- **Quiz** — MCQ and short-answer questions generated from your notes
- **Flashcards** — spaced repetition with SM-2 scheduling algorithm
- **Code Study** — four sub-modes: explain, predict output, find bug, fill missing code

**RAG Pipeline**
- Dual retrieval: top-K text chunks + top-K code chunks per query
- Always filtered by course and section
- Citations: every generated question references the source chunk IDs
- Grounding rule: if context is insufficient, responds "Not found in your notes"

**Gamification**
- XP system: +10 easy, +15 medium, +20 hard, streak bonus, speed bonus
- Streak tracking with 24h activity window
- Per-section mastery score (weighted by recency, difficulty, accuracy)
- Wrong answers auto-queued for spaced repetition review

**Swappable AI Providers**
- LLM and Embeddings configured via environment variables
- Works with any OpenAI-compatible API (OpenAI, Ollama, LM Studio, Azure, etc.)
- Demo mode: runs fully without API keys using deterministic pseudo-embeddings and keyword-overlap grading

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript (strict) |
| UI | Tailwind CSS + shadcn/ui + Radix primitives |
| Database | SQLite (dev) / PostgreSQL + pgvector (prod) |
| ORM | Prisma |
| Auth | NextAuth.js (credentials with auto-registration) |
| PDF Parsing | pdf-parse |
| Validation | Zod |
| Icons | Lucide React |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── course/               # CRUD courses + sections tree
│   │   ├── import/               # PDF, text, code import endpoints
│   │   ├── practice/             # Question generation + grading
│   │   └── review/               # Spaced repetition queue
│   ├── login/                    # Auth page
│   ├── dashboard/                # Course list + create
│   ├── course/[id]/              # Course map with mastery bars
│   │   └── section/[sectionId]/  # Practice interface
│   └── import/                   # Multi-tab import page
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── course-map.tsx            # Hierarchical section tree
│   ├── practice-mode.tsx         # Tabbed practice controller
│   ├── quiz.tsx                  # MCQ + short answer
│   ├── flashcard.tsx             # Flip card with rating
│   └── code-study.tsx            # Code exercise display
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   ├── llm.ts                    # LLM provider (OpenAI-compatible)
│   ├── embeddings.ts             # Embeddings provider with fallback
│   ├── rag.ts                    # Embed, store, retrieve chunks
│   ├── chunking.ts               # Text/code splitting + language detection
│   ├── headings.ts               # Heading extraction → section tree
│   ├── prompts.ts                # LLM prompts for quiz/flash/code/grading
│   └── gamification.ts           # XP, mastery, streak, SM-2 scheduling
├── types/
│   └── index.ts                  # Shared TypeScript types
prisma/
├── schema.prisma                 # 10 models: User, Course, Section, Chunk, etc.
└── seed.ts                       # Demo course (DSA) with sample data
```

## Getting Started

### Prerequisites

- Node.js 18+
- (Optional) PostgreSQL with pgvector for production

### Setup

```bash
# Clone
git clone https://github.com/tevfikefeaydin/StudyForge.git
cd StudyForge

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — at minimum set NEXTAUTH_SECRET
# For AI features, add LLM_API_KEY and EMBEDDINGS_API_KEY

# Initialize database + seed demo data
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# Start dev server
npm run dev
```

Open **http://localhost:3000** and sign in:
- **Demo account:** `demo@studyforge.dev` / `demo1234`
- Or enter any email + password to auto-register a new account

### Environment Variables

```env
# Database (SQLite for dev, PostgreSQL for prod)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# LLM Provider (OpenAI-compatible)
LLM_BASE_URL="https://api.openai.com/v1"
LLM_API_KEY="sk-..."
LLM_MODEL="gpt-4o-mini"

# Embeddings Provider (OpenAI-compatible)
EMBEDDINGS_BASE_URL="https://api.openai.com/v1"
EMBEDDINGS_API_KEY="sk-..."
EMBEDDINGS_MODEL="text-embedding-3-small"
EMBEDDINGS_DIMENSIONS=1536

# Upload limits
MAX_FILE_SIZE_MB=20
```

> Without API keys the app runs in **demo mode** — imports still work with hash-based pseudo-embeddings, questions are generated directly from chunk content, and grading uses keyword overlap.

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/import/pdf` | Upload PDF (multipart form) |
| `POST` | `/api/import/text` | Import text content (JSON) |
| `POST` | `/api/import/code` | Import code snippet (JSON) |
| `GET` | `/api/course` | List user's courses |
| `POST` | `/api/course` | Create a new course |
| `GET` | `/api/course/:id/sections` | Get section tree + progress |
| `POST` | `/api/practice/generate` | Generate question (quiz/flashcard/code) |
| `POST` | `/api/practice/grade` | Grade answer + update XP/mastery |
| `GET` | `/api/review/next` | Get next spaced repetition item |

## Database Schema

10 models covering the full data lifecycle:

- **User** — auth, XP, streak tracking
- **Course** — user's knowledge bases
- **Section** — hierarchical heading tree (self-referencing)
- **Chunk** — text/code content with embeddings
- **Upload** — file metadata and processing status
- **Attempt** — individual practice attempts with scoring
- **Progress** — per-section mastery and XP
- **ReviewQueue** — SM-2 spaced repetition scheduling

## Switching to PostgreSQL + pgvector

For production with real vector search:

1. Install PostgreSQL and the pgvector extension
2. Update `prisma/schema.prisma`:
   - Change provider to `"postgresql"`
   - Add `extensions = [vector]` and `previewFeatures = ["postgresqlExtensions"]`
   - Change `embedding` field to `Unsupported("vector(1536)")?`
   - Restore `@db.Text` annotations and `String[]` for chunkIds
3. Update `src/lib/rag.ts` to use pgvector SQL queries (see git history for the original implementation)
4. Update `DATABASE_URL` in `.env`

## License

MIT
