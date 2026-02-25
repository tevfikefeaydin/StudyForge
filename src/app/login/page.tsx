"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/components/app-settings-provider";
import { Languages, Loader2, Moon, Sun } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { text, theme, setTheme, locale, setLocale } = useAppSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(text("Invalid credentials. Please try again.", "Geçersiz bilgiler. Lütfen tekrar deneyin."));
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError(text("Something went wrong. Please try again.", "Bir hata oluştu. Lütfen tekrar deneyin."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={theme === "dark" ? text("Switch to light mode", "Açık temaya geç") : text("Switch to dark mode", "Koyu temaya geç")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-2 text-xs font-semibold"
          onClick={() => setLocale(locale === "en" ? "tr" : "en")}
          title={text("Switch language", "Dili değiştir")}
        >
          <Languages className="h-4 w-4 mr-1" />
          {locale === "en" ? "EN" : "TR"}
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="StudyForge" width={200} height={120} priority />
          </div>
          <CardTitle className="text-2xl">StudyForge</CardTitle>
          <CardDescription>
            {text(
              "Sign in to your account or create a new one automatically",
              "Hesabınıza girin veya otomatik olarak yeni hesap oluşturun"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{text("Email", "E-posta")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={text("you@example.com", "sen@ornek.com")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{text("Password", "Şifre")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={text("Enter a password", "Şifrenizi girin")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {text("Sign In", "Giriş Yap")}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {text(
                "New here? Just enter an email and password; your account will be created automatically.",
                "Yeni misiniz? E-posta ve şifre girmeniz yeterli; hesabınız otomatik oluşturulur."
              )}
            </p>
          </form>
        </CardContent>
      </Card>
      <Link
        href="/"
        className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {text("← Back to Home", "← Ana Sayfaya Dön")}
      </Link>
    </div>
  );
}
