"use client";

import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";

interface XPBarProps {
  xp: number;
}

export function XPBar({ xp }: XPBarProps) {
  const level = Math.floor(xp / 100);
  const progressToNext = xp % 100;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        <span className="font-bold text-lg">Lv.{level}</span>
      </div>
      <div className="flex-1 max-w-xs">
        <Progress value={progressToNext} className="h-3" />
      </div>
      <span className="text-sm text-muted-foreground">{xp} XP</span>
    </div>
  );
}
