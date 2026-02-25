"use client";

import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PracticeMode } from "@/components/practice-mode";
import { ArrowLeft, RotateCcw, Loader2 } from "lucide-react";

interface ReviewItem {
  reviewId: string;
  attemptId: string;
  question: string;
  answer: string;
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
  const router = useRouter();
  const [sectionTitle, setSectionTitle] = useState("");
  const [reviewItem, setReviewItem] = useState<ReviewItem | null>(null);
  const [loading, setLoading] = useState(true);

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
      fetch("/api/review/next")
        .then((r) => r.json())
        .then((data) => {
          if (data.item) setReviewItem(data.item);
        });
    }
  }, [status, courseId, sectionId]);

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
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <span>/</span>
        <Link href={`/course/${courseId}`} className="hover:text-foreground">Course</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{sectionTitle}</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Link href={`/course/${courseId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{sectionTitle}</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Practice</CardTitle>
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
                <CardTitle>Review Queue</CardTitle>
                <Badge variant="secondary">Due</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium text-sm mb-2">Previously missed:</p>
                  <p className="text-sm whitespace-pre-wrap">{reviewItem.question}</p>
                </div>
                <details>
                  <summary className="text-sm cursor-pointer text-muted-foreground">Show answer</summary>
                  <p className="mt-2 text-sm p-3 bg-muted rounded">{reviewItem.answer}</p>
                </details>
                <p className="text-xs text-muted-foreground">
                  From: {reviewItem.section.title} ({reviewItem.mode})
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
