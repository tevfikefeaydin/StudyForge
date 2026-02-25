"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSettings } from "@/components/app-settings-provider";
import { CheckCircle, XCircle, Zap } from "lucide-react";

interface GeneratedQuestion {
  question: string;
  answer?: string;
  difficulty: string;
  chunkIds: string[];
  type: string;
}

interface Feedback {
  correct: boolean;
  score: number;
  feedback: string;
  xpEarned: number;
}

interface CodeStudyProps {
  question: GeneratedQuestion;
  onSubmit: (answer: string) => void;
  feedback?: Feedback | null;
  loading?: boolean;
}

export function CodeStudy({ question, onSubmit, feedback, loading }: CodeStudyProps) {
  const { text } = useAppSettings();
  const [answer, setAnswer] = useState("");
  const modeLabel =
    question.type === "code_explain" ? text("Explain Code", "Kodu Açıkla")
      : question.type === "code_predict" ? text("Predict Output", "Çıktısını Tahmin Et")
        : question.type === "code_bug" ? text("Find the Bug", "Hatayı Bul")
          : question.type === "code_fill" ? text("Fill Missing Code", "Eksik Kodu Tamamla")
            : text("Code Study", "Kod Çalışma");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={question.difficulty === "hard" ? "destructive" : "default"}>
          {question.difficulty === "easy" ? text("Easy", "Kolay") : question.difficulty === "hard" ? text("Hard", "Zor") : text("Medium", "Orta")}
        </Badge>
        <Badge variant="secondary">{modeLabel}</Badge>
      </div>

      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto">
        <pre className="text-sm whitespace-pre-wrap font-mono">{question.question}</pre>
      </div>

      {!feedback && (
        <>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={text("Type your answer...", "Cevabınızı yazın...")}
            rows={6}
            className="font-mono"
          />
          <Button onClick={() => onSubmit(answer)} disabled={loading || !answer.trim()}>
            {loading ? text("Grading...", "Değerlendiriliyor...") : text("Submit", "Gönder")}
          </Button>
        </>
      )}

      {feedback && (
        <Card className={feedback.correct ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-red-500 bg-red-50 dark:bg-red-900/30"}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {feedback.correct ? (
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium">{feedback.correct ? text("Correct!", "Doğru!") : text("Not quite", "Tam olmadı")}</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{feedback.feedback}</p>
                {question.answer && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer text-muted-foreground">{text("Show expected answer", "Beklenen cevabı göster")}</summary>
                    <pre className="mt-2 text-sm bg-muted p-3 rounded font-mono whitespace-pre-wrap">
                      {question.answer}
                    </pre>
                  </details>
                )}
                {feedback.xpEarned > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-yellow-600 xp-animate">
                    <Zap className="h-4 w-4" />
                    <span className="font-bold">+{feedback.xpEarned} XP</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
