"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PracticeMode } from "@/components/practice-mode";
import { useAppSettings } from "@/components/app-settings-provider";
import { ArrowLeft, RotateCcw, Loader2 } from "lucide-react";

interface ReviewItem {
  reviewId: string;
  attemptId: string;
  question: string;
  answer?: string | null;
  mode: string;
  section: { id: string; title: string; courseId: string };
}

export default function SectionPage({
  params,
}: {
  params: Promise<{ id: string; sectionId: string }>;
}) {
  const { id: courseId, sectionId } = use(params);
  const { status } = useSession();
  const { text } = useAppSettings();
  const router = useRouter();
  const [sectionTitle, setSectionTitle] = useState("");
  const [reviewItem, setReviewItem] = useState<ReviewItem | null>(null);
  const [reviewUpdating, setReviewUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReviewItem = useCallback(async () => {
    const res = await fetch("/api/review/next");
    const data = await res.json();
    setReviewItem(data.item ?? null);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // Fetch section info from course sections
      fetch(`/api/course/${courseId}/sections`)
        .then((r) => r.json())
        .then((data) => {
          const findSection = (sections: { id: string; title: string; children: unknown[] }[]): string => {
            for (const s of sections) {
              if (s.id === sectionId) return s.title;
              const childTitle = findSection(s.children as { id: string; title: string; children: unknown[] }[]);
              if (childTitle) return childTitle;
            }
            return "";
          };
          setSectionTitle(findSection(data.sections) || "Section");
        })
        .finally(() => setLoading(false));

      // Fetch review queue
      fetchReviewItem().catch(() => {});
    }
  }, [status, courseId, sectionId, fetchReviewItem]);

  const rateReview = useCallback(
    async (quality: number) => {
      if (!reviewItem) return;
      setReviewUpdating(true);
      try {
        const res = await fetch("/api/review/rate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewId: reviewItem.reviewId, quality }),
        });
        if (res.ok) {
          await fetchReviewItem();
        }
      } finally {
        setReviewUpdating(false);
      }
    },
    [reviewItem, fetchReviewItem]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard" className="hover:text-foreground">{text("Dashboard", "Panel")}</Link>
        <span>/</span>
        <Link href={`/course/${courseId}`} className="hover:text-foreground">{text("Course", "Ders")}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{sectionTitle}</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Link href={`/course/${courseId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {text("Back", "Geri")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{sectionTitle}</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{text("Practice", "Pratik")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PracticeMode sectionId={sectionId} sectionTitle={sectionTitle} />
        </CardContent>
      </Card>

      {reviewItem && (
        <>
          <Separator className="my-6" />
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-orange-500" />
                <CardTitle>{text("Review Queue", "Tekrar Sırası")}</CardTitle>
                <Badge variant="secondary">{text("Due", "Zamanı Geldi")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium text-sm mb-2">{text("Previously missed:", "Daha önce kaçırılan:")}</p>
                  <p className="text-sm whitespace-pre-wrap">{reviewItem.question}</p>
                </div>
                <details>
                  <summary className="text-sm cursor-pointer text-muted-foreground">{text("Show answer", "Cevabı göster")}</summary>
                  <p className="mt-2 text-sm p-3 bg-muted rounded">{reviewItem.answer || text("No answer stored", "Kayıtlı cevap yok")}</p>
                </details>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="destructive" disabled={reviewUpdating} onClick={() => rateReview(1)}>
                    {text("Again", "Tekrar")}
                  </Button>
                  <Button size="sm" variant="outline" disabled={reviewUpdating} onClick={() => rateReview(2)}>
                    {text("Hard", "Zor")}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={reviewUpdating} onClick={() => rateReview(4)}>
                    {text("Good", "İyi")}
                  </Button>
                  <Button size="sm" disabled={reviewUpdating} onClick={() => rateReview(5)}>
                    {text("Easy", "Kolay")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {text("From:", "Kaynak:")} {reviewItem.section.title} ({
                    reviewItem.mode === "quiz" ? text("Quiz", "Test")
                      : reviewItem.mode === "flashcard" ? text("Flashcard", "Bilgi Kartı")
                        : reviewItem.mode === "code_study" ? text("Code Study", "Kod Çalışma")
                          : reviewItem.mode
                  })
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
