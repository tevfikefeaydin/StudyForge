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

interface QuizProps {
  question: GeneratedQuestion;
  onSubmit: (answer: string) => void;
  feedback?: Feedback | null;
  loading?: boolean;
}

export function Quiz({ question, onSubmit, feedback, loading }: QuizProps) {
  const { text } = useAppSettings();
  const [selected, setSelected] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState("");

  const isMCQ = question.type === "mcq" && question.options;

  const handleSubmit = () => {
    if (isMCQ) {
      onSubmit(selected);
    } else {
      onSubmit(textAnswer);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={question.difficulty === "hard" ? "destructive" : question.difficulty === "easy" ? "secondary" : "default"}>
          {question.difficulty === "easy" ? text("Easy", "Kolay") : question.difficulty === "hard" ? text("Hard", "Zor") : text("Medium", "Orta")}
        </Badge>
        <Badge variant="outline">{isMCQ ? text("Multiple Choice", "Çoktan Seçmeli") : text("Short Answer", "Kısa Cevap")}</Badge>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="text-base font-medium whitespace-pre-wrap">{question.question}</p>
      </div>

      {isMCQ && question.options ? (
        <div className="space-y-2">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => !feedback && setSelected(option)}
              disabled={!!feedback}
              className={`w-full text-left p-3 rounded-md border transition ${
                selected === option
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              } ${feedback ? "cursor-default" : "cursor-pointer"}`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <Textarea
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder={text("Type your answer...", "Cevabınızı yazın...")}
          rows={4}
          disabled={!!feedback}
        />
      )}

      {!feedback && (
        <Button
          onClick={handleSubmit}
          disabled={loading || (isMCQ ? !selected : !textAnswer.trim())}
        >
          {loading ? text("Grading...", "Değerlendiriliyor...") : text("Submit Answer", "Cevabı Gönder")}
        </Button>
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
                <p className="font-medium">{feedback.correct ? text("Correct!", "Doğru!") : text("Incorrect", "Yanlış")}</p>
                <p className="text-sm mt-1 text-muted-foreground">{feedback.feedback}</p>
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
