"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { XPBar } from "@/components/xp-bar";
import { Plus, BookOpen, FileText, Code, Loader2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description?: string;
  _count: { sections: number; chunks: number };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/course")
        .then((r) => r.json())
        .then((d) => setCourses(d.courses || []))
        .finally(() => setLoading(false));
    }
  }, [status]);

  const createCourse = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setCourses((prev) => [{ ...data.course, _count: { sections: 0, chunks: 0 } }, ...prev]);
        setTitle("");
        setDescription("");
        setDialogOpen(false);
      }
    } finally {
      setCreating(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const user = session?.user as { name?: string; xp?: number } | undefined;

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back{user?.name ? `, ${user.name}` : ""}!</h1>
          <div className="mt-2">
            <XPBar xp={(user as Record<string, unknown>)?.xp as number ?? 0} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/import">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Import Notes
            </Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Data Structures & Algorithms"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the course"
                    rows={3}
                  />
                </div>
                <Button onClick={createCourse} disabled={creating || !title.trim()} className="w-full">
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Course
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No courses yet</h2>
            <p className="text-muted-foreground mb-4">Create a course and import your notes to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/course/${course.id}`}>
              <Card className="hover:shadow-md transition cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  {course.description && (
                    <CardDescription>{course.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {course._count.sections} sections
                    </span>
                    <span className="flex items-center gap-1">
                      <Code className="h-3.5 w-3.5" />
                      {course._count.chunks} chunks
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
