import Image from "next/image";
import Link from "next/link";
import { BookOpen, Brain, Code, Flame, Zap, Trophy, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="StudyForge" width={36} height={36} />
            <span className="text-white font-bold text-xl">StudyForge</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-300 hover:text-white transition px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium transition"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-sm text-emerald-300">AI-Powered Learning Platform</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
              Turn your notes into
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> interactive practice</span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-2xl">
              Import PDFs, text notes, and code snippets. StudyForge automatically builds a course map
              and generates quizzes, flashcards, and code exercises grounded in your material using RAG.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-lg font-semibold text-lg transition shadow-lg shadow-emerald-500/25"
              >
                Start Learning
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="https://github.com/tevfikefeaydin/StudyForge"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-3.5 rounded-lg font-medium transition"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </header>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to master your material
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              From importing your notes to active recall practice, StudyForge handles the entire learning pipeline.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Smart Content Import"
              description="Upload PDFs, paste text with Markdown heading detection, or import code with automatic language detection for 10+ languages."
              color="emerald"
            />
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="AI-Generated Practice"
              description="MCQ quizzes, short-answer questions, and flashcards — all generated from your actual notes using RAG, not generic content."
              color="blue"
            />
            <FeatureCard
              icon={<Code className="h-6 w-6" />}
              title="Code Exercises"
              description="Four modes: explain code, predict output, find bugs, and fill missing code. Perfect for CS and programming courses."
              color="violet"
            />
            <FeatureCard
              icon={<Flame className="h-6 w-6" />}
              title="Streak & XP System"
              description="Earn XP for correct answers with difficulty and speed bonuses. Build daily streaks to stay motivated."
              color="orange"
            />
            <FeatureCard
              icon={<Trophy className="h-6 w-6" />}
              title="Mastery Tracking"
              description="Per-section mastery scores weighted by recency, difficulty, and accuracy. See exactly where you need more practice."
              color="amber"
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Spaced Repetition"
              description="Wrong answers are auto-queued with SM-2 scheduling. Review at the optimal time to maximize long-term retention."
              color="rose"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How it works
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Three simple steps to transform your notes into an active learning experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              step="1"
              title="Import your notes"
              description="Upload PDFs, paste text, or add code snippets. StudyForge extracts structure and splits content into smart chunks."
            />
            <StepCard
              step="2"
              title="AI builds your course"
              description="Headings become sections, content gets embedded for retrieval. Your personal knowledge base is ready."
            />
            <StepCard
              step="3"
              title="Practice & master"
              description="Generate quizzes, flashcards, and code exercises. Track mastery, earn XP, and review with spaced repetition."
            />
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Built with modern tech
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              "Next.js 15 + TypeScript",
              "Tailwind CSS + shadcn/ui",
              "PostgreSQL + pgvector",
              "Prisma ORM",
              "NextAuth.js",
              "OpenAI-compatible API",
              "RAG Pipeline",
              "SM-2 Algorithm",
            ].map((tech) => (
              <div key={tech} className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium text-slate-700">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-12 shadow-xl">
            <Image src="/logo-icon.png" alt="StudyForge" width={56} height={56} className="mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to study smarter?
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              Create a free account and start turning your notes into practice sessions in minutes.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-lg font-semibold text-lg transition shadow-lg shadow-emerald-500/25"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="StudyForge" width={24} height={24} />
            <span className="text-sm font-medium text-slate-600">StudyForge</span>
          </div>
          <p className="text-sm text-slate-400">
            Open source &middot;{" "}
            <a
              href="https://github.com/tevfikefeaydin/StudyForge"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 transition underline"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

const colorMap: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  orange: "bg-orange-50 text-orange-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
};

function FeatureCard({ icon, title, description, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group p-6 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${colorMap[color]}`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ step, title, description }: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white font-bold text-lg mb-4">
        {step}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
