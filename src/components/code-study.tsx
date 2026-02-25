"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

const subModeLabels: Record<string, string> = {
  code_explain: "Explain Code",
  code_predict: "Predict Output",
  code_bug: "Find the Bug",
  code_fill: "Fill Missing Code",
};

export function CodeStudy({ question, onSubmit, feedback, loading }: CodeStudyProps) {
  const [answer, setAnswer] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={question.difficulty === "hard" ? "destructive" : "default"}>
          {question.difficulty}
        </Badge>
        <Badge variant="secondary">
          {subModeLabels[question.type] || "Code Study"}
        </Badge>
      </div>

      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto">
        <pre className="text-sm whitespace-pre-wrap font-mono">{question.question}</pre>
      </div>

      {!feedback && (
        <>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            rows={6}
            className="font-mono"
          />
          <Button onClick={() => onSubmit(answer)} disabled={loading || !answer.trim()}>
            {loading ? "Grading..." : "Submit"}
          </Button>
        </>
      )}

      {feedback && (
        <Card className={feedback.correct ? "border-emerald-500 bg-emerald-50" : "border-red-500 bg-red-50"}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {feedback.correct ? (
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium">{feedback.correct ? "Correct!" : "Not quite"}</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{feedback.feedback}</p>
                {question.answer && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer text-muted-foreground">Show expected answer</summary>
                    <pre className="mt-2 text-sm bg-slate-100 p-3 rounded font-mono whitespace-pre-wrap">
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
