"use client";

import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CourseMap } from "@/components/course-map";
import { useAppSettings } from "@/components/app-settings-provider";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";

interface Section {
  id: string;
  title: string;
  level: number;
  order: number;
  parentId: string | null;
  children: Section[];
}

interface CourseData {
  course: { id: string; title: string; description?: string };
  sections: Section[];
  progress: Record<string, { mastery: number; xpEarned?: number }>;
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status } = useSession();
  const { text } = useAppSettings();
  const router = useRouter();
  const [data, setData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch(`/api/course/${id}/sections`)
        .then((r) => {
          if (!r.ok) throw new Error("Not found");
          return r.json();
        })
        .then(setData)
        .catch(() => router.push("/dashboard"))
        .finally(() => setLoading(false));
    }
  }, [status, id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {text("Back", "Geri")}
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{data.course.title}</h1>
          {data.course.description && (
            <p className="text-muted-foreground mt-1">{data.course.description}</p>
          )}
        </div>
        <Link href={`/import?courseId=${id}`}>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            {text("Import Notes", "Notları İçe Aktar")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{text("Course Map", "Ders Haritası")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseMap sections={data.sections} progress={data.progress} courseId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
