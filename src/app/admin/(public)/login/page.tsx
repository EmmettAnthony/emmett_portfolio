"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export default function AdminLogin() {
  const t = useTranslations("admin.login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("invalidCredentials"));
      } else {
        router.push("/dashboard/overview");
        router.refresh();
      }
    } catch {
      setError(t("errorOccurred"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
              {t("subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground"
              >
                {t("username")}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground"
              >
                {t("password")}
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-center text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("signingIn")}
                </>
              ) : (
                t("signIn")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
