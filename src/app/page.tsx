"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppSettings } from "@/components/app-settings-provider";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Code,
  Flame,
  Languages,
  Moon,
  Sun,
  Trophy,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const { theme, setTheme, locale, setLocale, text } = useAppSettings();

  const features = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: text("Smart Content Import", "Akıllı İçerik Aktarımı"),
      description: text(
        "Upload PDFs, paste text with Markdown heading detection, or import code with automatic language detection for 10+ languages.",
        "PDF yükleyin, Markdown başlıklarını algılayan metin notları yapıştırın veya 10+ dilde otomatik algılama ile kod içe aktarın."
      ),
      color: "emerald",
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: text("AI-Generated Practice", "YZ ile Üretilen Pratik"),
      description: text(
        "MCQ quizzes, short-answer questions, and flashcards generated from your actual notes using RAG.",
        "RAG ile doğrudan notlarınızdan üretilen testler, kısa cevap soruları ve bilgi kartları."
      ),
      color: "blue",
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: text("Code Exercises", "Kod Egzersizleri"),
      description: text(
        "Explain code, predict output, find bugs, and fill missing code for programming-focused learning.",
        "Kod açıklama, çıktı tahmini, hata bulma ve eksik kod tamamlama modlarıyla programlama odaklı çalışma."
      ),
      color: "violet",
    },
    {
      icon: <Flame className="h-6 w-6" />,
      title: text("Streak and XP System", "Seri ve XP Sistemi"),
      description: text(
        "Earn XP with difficulty and speed bonuses. Build daily streaks to stay consistent.",
        "Zorluk ve hız bonuslarıyla XP kazan. Düzenli kalmak için günlük seri oluştur."
      ),
      color: "orange",
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: text("Mastery Tracking", "Ustalık Takibi"),
      description: text(
        "Per-section mastery scores weighted by recency, difficulty, and accuracy.",
        "Güncellik, zorluk ve doğruluk ağırlıklı bölüm bazlı ustalık puanları."
      ),
      color: "amber",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: text("Spaced Repetition", "Aralıklı Tekrar"),
      description: text(
        "Wrong answers are auto-queued with SM-2 scheduling for long-term retention.",
        "Yanlış cevaplar SM-2 planlamasıyla otomatik sıraya alınır ve kalıcı öğrenme sağlanır."
      ),
      color: "rose",
    },
  ];

  const steps = [
    {
      step: "1",
      title: text("Import your notes", "Notlarını içe aktar"),
      description: text(
        "Upload PDFs, paste text, or add code snippets. StudyForge extracts structure and splits content into smart chunks.",
        "PDF yükle, metin yapıştır veya kod parçaları ekle. StudyForge yapıyı çıkarır ve içeriği akıllı parçalara böler."
      ),
    },
    {
      step: "2",
      title: text("AI builds your course", "YZ dersini oluşturur"),
      description: text(
        "Headings become sections, content gets embedded for retrieval. Your personal knowledge base is ready.",
        "Başlıklar bölüme dönüşür, içerik erişim için embed edilir. Kişisel bilgi tabanın hazır olur."
      ),
    },
    {
      step: "3",
      title: text("Practice and master", "Pratik yap ve ustalaş"),
      description: text(
        "Generate quizzes, flashcards, and code exercises. Track mastery, earn XP, and review with spaced repetition.",
        "Testler, kartlar ve kod egzersizleri üret. Ustalık takibi yap, XP kazan, aralıklı tekrar ile pekiştir."
      ),
    },
  ];

  const techList = [
    "Next.js 15 + TypeScript",
    "Tailwind CSS + shadcn/ui",
    "PostgreSQL + pgvector",
    "Prisma ORM",
    "NextAuth.js",
    "OpenAI-compatible API",
    "RAG Pipeline",
    "SM-2 Algorithm",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />

        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="StudyForge" width={36} height={36} />
            <span className="text-white font-bold text-xl">StudyForge</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-600 text-slate-200 hover:text-white hover:border-slate-400 transition"
              title={theme === "dark" ? text("Switch to light mode", "Açık temaya geç") : text("Switch to dark mode", "Koyu temaya geç")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "tr" : "en")}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-slate-600 px-2 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-400 transition"
              title={text("Switch language", "Dili değiştir")}
            >
              <Languages className="h-4 w-4" />
              {locale === "en" ? "EN" : "TR"}
            </button>
            <Link href="/login" className="text-sm text-slate-300 hover:text-white transition px-3 py-2">
              {text("Sign In", "Giriş")}
            </Link>
            <Link
              href="/login"
              className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-4 sm:px-5 py-2 rounded-lg font-medium transition"
            >
              {text("Get Started", "Başla")}
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-sm text-emerald-300">{text("AI-Powered Learning Platform", "YZ Destekli Öğrenme Platformu")}</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
              {text("Turn your notes into", "Notlarını")}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> {text("interactive practice", "etkileşimli pratiğe")}</span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-2xl">
              {text(
                "Import PDFs, text notes, and code snippets. StudyForge builds a course map and generates quizzes, flashcards, and code exercises grounded in your material using RAG.",
                "PDF, metin notu ve kod parçası içe aktar. StudyForge ders haritasını oluşturur ve RAG ile notlarına dayalı test, kart ve kod egzersizleri üretir."
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-lg font-semibold text-lg transition shadow-lg shadow-emerald-500/25"
              >
                {text("Start Learning", "Öğrenmeye Başla")}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="https://github.com/tevfikefeaydin/StudyForge"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-3.5 rounded-lg font-medium transition"
              >
                {text("View on GitHub", "GitHub'da Gör")}
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </header>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {text("Everything you need to master your material", "İçeriğine hâkim olmak için ihtiyacın olan her şey")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {text(
                "From importing notes to active recall practice, StudyForge manages the full learning pipeline.",
                "Not aktarmadan aktif tekrar pratiğine kadar StudyForge tüm öğrenme hattını yönetir."
              )}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-muted/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{text("How it works", "Nasıl çalışır")}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {text(
                "Three simple steps to turn your notes into an active learning experience.",
                "Notlarını aktif bir öğrenme deneyimine dönüştüren üç basit adım."
              )}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step) => (
              <StepCard key={step.step} step={step.step} title={step.title} description={step.description} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{text("Built with modern tech", "Modern teknolojilerle geliştirildi")}</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {techList.map((tech) => (
              <div key={tech} className="flex items-center gap-2 px-4 py-3 bg-card border rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-12 shadow-xl">
            <Image src="/logo-icon.png" alt="StudyForge" width={56} height={56} className="mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">{text("Ready to study smarter?", "Daha akıllı çalışmaya hazır mısın?")}</h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              {text(
                "Create a free account and start turning your notes into practice sessions in minutes.",
                "Ücretsiz hesap oluştur ve notlarını dakikalar içinde pratik oturumlarına dönüştür."
              )}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-lg font-semibold text-lg transition shadow-lg shadow-emerald-500/25"
            >
              {text("Get Started Free", "Ücretsiz Başla")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="StudyForge" width={24} height={24} />
            <span className="text-sm font-medium">StudyForge</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {text("Open source", "Açık kaynak")} · {" "}
            <a
              href="https://github.com/tevfikefeaydin/StudyForge"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition underline"
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
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${colorMap[color]}`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white font-bold text-lg mb-4">
        {step}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
