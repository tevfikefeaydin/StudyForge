"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, FileText, Code, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Course {
  id: string;
  title: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export default function ImportPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ImportPageInner />
    </Suspense>
  );
}

function ImportPageInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get("courseId") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // PDF state
  const [file, setFile] = useState<File | null>(null);

  // Text state
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");

  // Code state
  const [codeContent, setCodeContent] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("");
  const [codeTitle, setCodeTitle] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/course")
        .then((r) => r.json())
        .then((d) => {
          setCourses(d.courses || []);
          if (!selectedCourse && d.courses?.length > 0) {
            setSelectedCourse(d.courses[0].id);
          }
        });
    }
  }, [status, selectedCourse]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > MAX_FILE_SIZE) {
        setResult({ success: false, message: "File too large. Maximum 20MB." });
        return;
      }
      setFile(f);
      setResult(null);
    }
  };

  const importPDF = async () => {
    if (!file || !selectedCourse) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("courseId", selectedCourse);

    try {
      const res = await fetch("/api/import/pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: `Imported ${data.sections} sections and ${data.chunks} chunks.` });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setResult({ success: false, message: data.error || "Import failed" });
      }
    } catch {
      setResult({ success: false, message: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const importText = async () => {
    if (!textContent.trim() || !selectedCourse) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/import/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse,
          content: textContent.trim(),
          title: textTitle.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: `Imported ${data.sections} sections and ${data.chunks} chunks.` });
        setTextContent("");
        setTextTitle("");
      } else {
        setResult({ success: false, message: data.error || "Import failed" });
      }
    } catch {
      setResult({ success: false, message: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const importCode = async () => {
    if (!codeContent.trim() || !selectedCourse) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/import/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse,
          code: codeContent.trim(),
          language: codeLanguage || undefined,
          title: codeTitle.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: `Imported ${data.chunks} code chunks (${data.language}).` });
        setCodeContent("");
        setCodeTitle("");
      } else {
        setResult({ success: false, message: data.error || "Import failed" });
      }
    } catch {
      setResult({ success: false, message: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Import Notes</h1>
      </div>

      {/* Course selector */}
      <div className="mb-6">
        <Label className="mb-2 block">Target Course</Label>
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No courses found.{" "}
            <Link href="/dashboard" className="underline">Create one first</Link>.
          </p>
        ) : (
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Result message */}
      {result && (
        <div className={`flex items-center gap-2 p-3 rounded-md mb-4 ${
          result.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
        }`}>
          {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="text-sm">{result.message}</span>
        </div>
      )}

      <Tabs defaultValue="pdf">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pdf">
            <Upload className="h-4 w-4 mr-2" />
            PDF
          </TabsTrigger>
          <TabsTrigger value="text">
            <FileText className="h-4 w-4 mr-2" />
            Text
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code className="h-4 w-4 mr-2" />
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdf">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {file ? file.name : "Click to select a PDF file (max 20MB)"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <Button onClick={importPDF} disabled={loading || !file || !selectedCourse} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import PDF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Paste Text Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title (optional)</Label>
                <Input
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="e.g., Chapter 5 - Sorting Algorithms"
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste your notes here... Supports Markdown headings (#, ##, ###) and code fences."
                  rows={12}
                />
              </div>
              <Button onClick={importText} disabled={loading || !textContent.trim() || !selectedCourse} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import Text
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code">
          <Card>
            <CardHeader>
              <CardTitle>Paste Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title (optional)</Label>
                  <Input
                    value={codeTitle}
                    onChange={(e) => setCodeTitle(e.target.value)}
                    placeholder="e.g., Binary Search Implementation"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Language (auto-detected if empty)</Label>
                  <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="c">C</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="go">Go</SelectItem>
                      <SelectItem value="rust">Rust</SelectItem>
                      <SelectItem value="sql">SQL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder="Paste your code here..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <Button onClick={importCode} disabled={loading || !codeContent.trim() || !selectedCourse} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import Code
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
