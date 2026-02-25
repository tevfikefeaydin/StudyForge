"use client";

import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from "@/components/app-settings-provider";
import { ChevronRight } from "lucide-react";

interface Section {
  id: string;
  title: string;
  level: number;
  order: number;
  children: Section[];
}

interface CourseMapProps {
  sections: Section[];
  progress: Record<string, { mastery: number; xpEarned?: number }>;
  courseId: string;
}

// Tailwind JIT needs full static class strings — never interpolate dynamically.
// The Progress component renders an inner <div> for the indicator bar.
const masteryClasses: Record<string, string> = {
  emerald: "[&>div]:bg-emerald-500",
  yellow: "[&>div]:bg-yellow-500",
  red: "[&>div]:bg-red-500",
};

function masteryIndicator(mastery: number): string {
  if (mastery >= 70) return masteryClasses.emerald;
  if (mastery >= 30) return masteryClasses.yellow;
  return masteryClasses.red;
}

function SectionNode({
  section,
  progress,
  courseId,
  depth,
}: {
  section: Section;
  progress: CourseMapProps["progress"];
  courseId: string;
  depth: number;
}) {
  const mastery = progress[section.id]?.mastery ?? 0;
  const hasChildren = section.children.length > 0;

  if (!hasChildren) {
    return (
      <Link
        href={`/course/${courseId}/section/${section.id}`}
        className="flex items-center gap-3 py-3 px-4 hover:bg-accent rounded-md transition group"
        style={{ paddingLeft: `${depth * 20 + 16}px` }}
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        <span className="flex-1 text-sm">{section.title}</span>
        <div className="flex items-center gap-2 w-32">
          <Progress value={mastery} className={`h-2 flex-1 ${masteryIndicator(mastery)}`} />
          <Badge variant="outline" className="text-xs w-12 justify-center">
            {mastery}%
          </Badge>
        </div>
      </Link>
    );
  }

  return (
    <AccordionItem value={section.id} className="border-none">
      <AccordionTrigger
        className="py-3 px-4 hover:bg-accent rounded-md hover:no-underline"
        style={{ paddingLeft: `${depth * 20 + 16}px` }}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="font-medium text-sm">{section.title}</span>
          <div className="flex items-center gap-2 w-32 ml-auto mr-4">
            <Progress value={mastery} className={`h-2 flex-1 ${masteryIndicator(mastery)}`} />
            <Badge variant="outline" className="text-xs w-12 justify-center">
              {mastery}%
            </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        {section.children.map((child) => (
          <SectionNode
            key={child.id}
            section={child}
            progress={progress}
            courseId={courseId}
            depth={depth + 1}
          />
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}

export function CourseMap({ sections, progress, courseId }: CourseMapProps) {
  const { text } = useAppSettings();
  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{text("No sections yet. Import some notes to get started!", "Henüz bölüm yok. Başlamak için notlarını içe aktar!")}</p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
      {sections.map((section) => (
        <SectionNode
          key={section.id}
          section={section}
          progress={progress}
          courseId={courseId}
          depth={0}
        />
      ))}
    </Accordion>
  );
}
