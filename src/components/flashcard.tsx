"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";

interface GeneratedQuestion {
  question: string;
  answer?: string;
  difficulty: string;
  chunkIds: string[];
  type: string;
}

interface FlashcardProps {
  question: GeneratedQuestion;
  onResult: (quality: number) => void;
}

export function Flashcard({ question, onResult }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated] = useState(false);

  const handleRate = (quality: number) => {
    setRated(true);
    onResult(quality);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{question.difficulty}</Badge>
        <Badge variant="secondary">Flashcard</Badge>
      </div>

      <div className="flip-card w-full" style={{ minHeight: "200px" }}>
        <div className={`flip-card-inner relative w-full ${flipped ? "flipped" : ""}`} style={{ minHeight: "200px" }}>
          {/* Front */}
          <Card
            className={`flip-card-front cursor-pointer absolute inset-0 ${flipped ? "pointer-events-none" : ""}`}
            onClick={() => setFlipped(true)}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
              <p className="text-center text-lg font-medium whitespace-pre-wrap">
                {question.question}
              </p>
              <p className="text-sm text-muted-foreground mt-4">Click to reveal answer</p>
            </CardContent>
          </Card>

          {/* Back */}
          <Card className={`flip-card-back absolute inset-0 ${!flipped ? "pointer-events-none" : ""}`}>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
              <p className="text-center text-base whitespace-pre-wrap">
                {question.answer || "No answer provided"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {flipped && !rated && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <span className="text-sm text-muted-foreground mr-2">How well did you know this?</span>
          <Button variant="destructive" size="sm" onClick={() => handleRate(1)}>
            Again
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleRate(2)}>
            Hard
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleRate(4)}>
            Good
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleRate(5)}>
            Easy
          </Button>
        </div>
      )}

      {rated && (
        <div className="text-center">
          <Button variant="outline" onClick={() => { setFlipped(false); setRated(false); }}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Next Card
          </Button>
        </div>
      )}
    </div>
  );
}
