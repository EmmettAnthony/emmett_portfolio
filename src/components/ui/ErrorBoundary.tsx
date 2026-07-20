"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

interface Props { children: ReactNode; fallback?: ReactNode; }

interface State { hasError: boolean; error?: Error; }

function ErrorFallback({ error, onReset }: { error?: Error; onReset: () => void }) {
  const t = useTranslations("error");
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-900/10">
      <AlertTriangle className="h-8 w-8 text-red-500" />
      <div>
        <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">{t("somethingWentWrong")}</h3>
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error?.message || t("unexpectedError")}</p>
      </div>
      <button onClick={onReset}
        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500">
        <RefreshCw className="h-3 w-3" /> {t("tryAgain")}
      </button>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
