"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Flame, LogOut } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  if (!session) return null;

  const user = session.user as { id?: string; name?: string; email?: string; xp?: number; streak?: number };

  return (
    <nav className="h-16 border-b bg-slate-900 text-white flex items-center px-6 justify-between">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Image src="/logo-icon.png" alt="StudyForge" width={32} height={32} />
          StudyForge
        </Link>
        <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white transition">
          Dashboard
        </Link>
        <Link href="/import" className="text-sm text-slate-300 hover:text-white transition">
          Import
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-orange-400">
          <Flame className="h-4 w-4" />
          <span className="text-sm font-medium">{user.streak ?? 0}</span>
        </div>
        <span className="text-sm text-slate-300">{user.email}</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
