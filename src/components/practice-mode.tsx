"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Quiz } from "./quiz";
import { Flashcard } from "./flashcard";
import { CodeStudy } from "./code-study";
import { useAppSettings } from "@/components/app-settings-provider";
import { Loader2 } from "lucide-react";

interface GeneratedQuestion {
  attemptId: string;
  question: string;
  answer?: string;
  options?: string[];
  difficulty: string;
  chunkIds: string[];
  type: string;
}

interface Feedback {
  correct: boolean;
  score: number;
  feedback: string;
  xpEarned: number;
  streak?: number;
  mastery?: number;
}

interface PracticeModeProps {
  sectionId: string;
  sectionTitle: string;
}

export function PracticeMode({ sectionId, sectionTitle }: PracticeModeProps) {
  const { text, locale } = useAppSettings();
  const [mode, setMode] = useState("quiz");
  const [difficulty, setDifficulty] = useState("medium");
  const [subMode, setSubMode] = useState("explain");
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  const generate = useCallback(async () => {
    setGenerating(true);
    setQuestion(null);
    setFeedback(null);

    try {
      const res = await fetch("/api/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          sectionId,
          difficulty,
          subMode: mode === "code_study" ? subMode : undefined,
          locale,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setQuestion(data.question);
      setStartTime(Date.now());
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }, [mode, sectionId, difficulty, subMode, locale]);

  const submitAnswer = useCallback(
    async (userAnswer: string) => {
      if (!question?.attemptId) return;
      setGrading(true);

      try {
        const res = await fetch("/api/practice/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: question.attemptId,
            userAnswer,
            timeMs: Date.now() - startTime,
            locale,
          }),
        });

        if (!res.ok) throw new Error("Failed to grade");
        const data = await res.json();
        setFeedback(data);
      } catch (err) {
        console.error(err);
      } finally {
        setGrading(false);
      }
    },
    [question, startTime, locale]
  );

  const handleFlashcardResult = useCallback(async (quality: number) => {
    if (!question?.attemptId) return;
    // Record as attempt
    await fetch("/api/practice/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId: question.attemptId,
        quality,
        userAnswer: quality >= 3 ? "known" : "unknown",
        timeMs: Date.now() - startTime,
        locale,
      }),
    });
  }, [question, startTime, locale]);

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => { setMode(v); setQuestion(null); setFeedback(null); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quiz">{text("Quiz", "Test")}</TabsTrigger>
          <TabsTrigger value="flashcard">{text("Flashcards", "Bilgi Kartları")}</TabsTrigger>
          <TabsTrigger value="code_study">{text("Code Study", "Kod Çalışma")}</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-3 mt-4">
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">{text("Easy", "Kolay")}</SelectItem>
              <SelectItem value="medium">{text("Medium", "Orta")}</SelectItem>
              <SelectItem value="hard">{text("Hard", "Zor")}</SelectItem>
            </SelectContent>
          </Select>

          {mode === "code_study" && (
            <Select value={subMode} onValueChange={setSubMode}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="explain">{text("Explain Code", "Kodu Açıkla")}</SelectItem>
                <SelectItem value="predict">{text("Predict Output", "Çıktısını Tahmin Et")}</SelectItem>
                <SelectItem value="bug">{text("Find Bug", "Hatayı Bul")}</SelectItem>
                <SelectItem value="fill">{text("Fill Missing", "Eksiği Tamamla")}</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button onClick={generate} disabled={generating}>
            {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {question ? text("Next Question", "Sonraki Soru") : text("Generate", "Üret")}
          </Button>
        </div>

        <TabsContent value="quiz" className="mt-4">
          {question && (
            <Quiz question={question} onSubmit={submitAnswer} feedback={feedback} loading={grading} />
          )}
        </TabsContent>

        <TabsContent value="flashcard" className="mt-4">
          {question && <Flashcard question={question} onResult={handleFlashcardResult} />}
        </TabsContent>

        <TabsContent value="code_study" className="mt-4">
          {question && (
            <CodeStudy question={question} onSubmit={submitAnswer} feedback={feedback} loading={grading} />
          )}
        </TabsContent>
      </Tabs>

      {!question && !generating && (
        <div className="text-center py-8 text-muted-foreground">
          <p>{text("Select a mode and click Generate to start practicing", "Pratiğe başlamak için bir mod seçip Üret'e tıklayın")} &quot;{sectionTitle}&quot;</p>
        </div>
      )}
    </div>
  );
}
