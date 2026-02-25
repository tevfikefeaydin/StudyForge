"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/components/app-settings-provider";
import { Flame, Languages, LogOut, Moon, Sun } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme, locale, setLocale, text } = useAppSettings();

  if (!session) return null;

  const user = session.user as { id?: string; name?: string; email?: string; xp?: number; streak?: number };

  return (
    <nav className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 flex items-center px-4 sm:px-6 justify-between">
      <div className="flex items-center gap-4 sm:gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Image src="/logo-icon.png" alt="StudyForge" width={32} height={32} />
          StudyForge
        </Link>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition">
          {text("Dashboard", "Panel")}
        </Link>
        <Link href="/import" className="text-sm text-muted-foreground hover:text-foreground transition">
          {text("Import", "İçerik Aktar")}
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-orange-400">
          <Flame className="h-4 w-4" />
          <span className="text-sm font-medium">{user.streak ?? 0}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title={theme === "dark" ? text("Switch to light mode", "Açık temaya geç") : text("Switch to dark mode", "Koyu temaya geç")}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs font-semibold"
          title={text("Switch language", "Dili değiştir")}
          onClick={() => setLocale(locale === "en" ? "tr" : "en")}
        >
          <Languages className="h-4 w-4 mr-1" />
          {locale === "en" ? "EN" : "TR"}
        </Button>
        <span className="hidden md:inline text-sm text-muted-foreground">{user.email}</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          title={text("Sign out", "Çıkış yap")}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
