"use client";

import {
  useState,
  useEffect,
  useCallback
} from "react";
import { cn } from "@/lib/utils";
import {
  X,
  Mail,
  Monitor,
  Smartphone,
  Layout,
  FlaskConical,
  Loader2,
  Columns2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CampaignPreviewModalProps {
  open: boolean;
  onClose: () => void;
  subject: string;
  content: string;
  subjectB?: string;
  contentB?: string;
  abTestEnabled?: boolean;
  senderName?: string;
  senderEmail?: string;
  previewText?: string;
}

type ViewMode = "desktop" | "mobile" | "side-by-side" | "ab-comparison";
type VariantTab = "A" | "B";

// ─── Component ──────────────────────────────────────────────────────────────

export default function CampaignPreviewModal({
  open,
  onClose,
  subject,
  content,
  subjectB,
  contentB,
  abTestEnabled = false,
  senderName = "Emmett Anthony",
  senderEmail = "hello@emmettanthony.dev",
  previewText,
}: CampaignPreviewModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [variantTab, setVariantTab] = useState<VariantTab>("A");
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setIframeLoaded(false);
        setVariantTab("A");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Build the full email HTML document from the content
  const buildEmailHtml = useCallback(
    (html: string, subj: string) => {
      const hasResponsiveStyles = html.includes("@media") || html.includes("max-width");
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${subj}</title>
  ${!hasResponsiveStyles ? `<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f4f4f5; color: #18181b; }
    .email-wrapper { max-width: 600px; margin: 0 auto; padding: 20px 0; }
    .email-container { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .email-header { padding: 24px 32px 0; }
    .email-body { padding: 0 32px 24px; }
    .email-footer { padding: 20px 32px; background: #fafafa; border-top: 1px solid #e4e4e7; font-size: 12px; color: #a1a1aa; text-align: center; }
    @media (max-width: 480px) {
      .email-wrapper { padding: 10px; }
      .email-header, .email-body, .email-footer { padding-left: 16px; padding-right: 16px; }
    }
  </style>` : ""}
  <style>
    .email-subject { font-size: 12px; color: #71717a; margin-bottom: 16px; padding: 8px 12px; background: #f4f4f5; border-radius: 6px; display: inline-block; }
    img { max-width: 100%; height: auto; }
    a { color: #2563eb; text-decoration: underline; }
    .preheader { display: none !important; font-size: 1px; color: transparent; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; }
  </style>
</head>
<body>
  ${previewText ? `<div class="preheader">${previewText}</div>` : ""}
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="email-subject">📧 ${subj}</div>
      </div>
      <div class="email-body">
        ${html}
      </div>
      <div class="email-footer">
        <p>Sent by ${senderName} &middot; ${senderEmail}</p>
        <p style="margin-top: 4px;">
          <a href="#" style="color: #a1a1aa; text-decoration: underline;">Unsubscribe</a>
          &middot; 123 Main St, City, State
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
    },
    [previewText, senderName, senderEmail]
  );

  const currentSubject = variantTab === "A" ? subject : subjectB || subject;
  const currentContent = variantTab === "A" ? content : contentB || content;

  const emailHtml = buildEmailHtml(currentContent || "<p style='color: #a1a1aa; text-align: center; padding: 40px 0;'>No content yet</p>", currentSubject);

  // For AB comparison, build both variants' HTML
  const emailHtmlA = buildEmailHtml(content || "<p style='color: #a1a1aa; text-align: center; padding: 40px 0;'>No content yet</p>", subject);
  const emailHtmlB = buildEmailHtml(contentB || "<p style='color: #a1a1aa; text-align: center; padding: 40px 0;'>No content yet</p>", subjectB || subject);

  const iframeClasses =
    viewMode === "mobile"
      ? "w-[375px] h-[700px] rounded-[32px] border-[8px] border-zinc-800 dark:border-zinc-600 shadow-xl"
      : viewMode === "side-by-side"
        ? "w-[375px] h-[650px] rounded-[32px] border-[8px] border-zinc-800 dark:border-zinc-600 shadow-xl"
        : "w-full h-[700px] rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex max-h-[95vh] w-[95vw] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white truncate">
              Email Preview
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 truncate max-w-[300px]">
              <Mail className="h-3 w-3 shrink-0" />
              {currentSubject}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
          {/* View mode */}
          <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
            <button
              onClick={() => setViewMode("desktop")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "desktop"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Monitor className="h-3.5 w-3.5" />
              Desktop
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "mobile"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </button>
            <button
              onClick={() => setViewMode("side-by-side")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "side-by-side"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Layout className="h-3.5 w-3.5" />
              Side by Side
            </button>
            {abTestEnabled && (
              <button
                onClick={() => setViewMode("ab-comparison")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "ab-comparison"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                <Columns2 className="h-3.5 w-3.5" />
                A/B Compare
              </button>
            )}
          </div>

          {/* A/B variants */}
          {abTestEnabled && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-zinc-400">Variant:</span>
              <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
                <button
                  onClick={() => setVariantTab("A")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    variantTab === "A"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  A {variantTab === "A" && subject && <span className="ml-1 text-zinc-400">— {subject.slice(0, 30)}{subject.length > 30 ? "…" : ""}</span>}
                </button>
                <button
                  onClick={() => setVariantTab("B")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    variantTab === "B"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  <FlaskConical className="mr-1 inline h-3 w-3 text-purple-500" />
                  B {variantTab === "B" && subjectB && <span className="ml-1 text-zinc-400">— {subjectB.slice(0, 30)}{subjectB.length > 30 ? "…" : ""}</span>}
                </button>
              </div>
            </div>
          )}

          {/* Right side: subject line + metadata */}
          <div className="hidden lg:flex items-center gap-4 text-[11px] text-zinc-400">
            <span>From: {senderName}</span>
            <span>Subject: {currentSubject}</span>
          </div>
        </div>

        {/* Preview area — scrollable */}
        <div className="flex-1 overflow-auto p-6 bg-zinc-100 dark:bg-zinc-950/50">
          {!iframeLoaded && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              <span className="ml-2 text-sm text-zinc-400">Rendering preview…</span>
            </div>
          )}

          {/* Desktop view */}
          {viewMode === "desktop" && (
            <div className="flex justify-center">
              <iframe
                srcDoc={emailHtml}
                className={iframeClasses}
                style={{ background: "#ffffff" }}
                sandbox="allow-same-origin"
                title="Desktop email preview"
                onLoad={() => setIframeLoaded(true)}
              />
            </div>
          )}

          {/* Mobile view */}
          {viewMode === "mobile" && (
            <div className="flex justify-center">
              {/* Phone frame */}
              <div className="relative">
                {/* Notch */}
                <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-zinc-800 dark:bg-zinc-600 flex items-center justify-center">
                  <div className="h-1.5 w-8 rounded-full bg-zinc-600 dark:bg-zinc-400" />
                </div>
                <iframe
                  srcDoc={emailHtml}
                  className={iframeClasses}
                  style={{ background: "#ffffff" }}
                  sandbox="allow-same-origin"
                  title="Mobile email preview"
                  onLoad={() => setIframeLoaded(true)}
                />
                {/* Home indicator */}
                <div className="absolute bottom-1.5 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-zinc-500/50" />
              </div>
            </div>
          )}

          {/* Side-by-side view (device comparison of selected variant) */}
          {viewMode === "side-by-side" && (
            <div className="flex items-start justify-center gap-6 flex-wrap">
              {/* Desktop preview */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Desktop</span>
                <div className="w-[500px]">
                  <iframe
                    srcDoc={emailHtml}
                    className="w-full h-[600px] rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm"
                    style={{ background: "#ffffff" }}
                    sandbox="allow-same-origin"
                    title="Side-by-side desktop preview"
                    onLoad={() => setIframeLoaded(true)}
                  />
                </div>
              </div>

              {/* Mobile preview */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Mobile</span>
                <div className="relative">
                  <div className="absolute left-1/2 top-0 z-10 h-4 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-800 dark:bg-zinc-600 flex items-center justify-center">
                    <div className="h-1 w-6 rounded-full bg-zinc-600 dark:bg-zinc-400" />
                  </div>
                  <iframe
                    srcDoc={emailHtml}
                    className="w-[320px] h-[550px] rounded-[28px] border-[6px] border-zinc-800 dark:border-zinc-600 shadow-lg"
                    style={{ background: "#ffffff" }}
                    sandbox="allow-same-origin"
                    title="Side-by-side mobile preview"
                    onLoad={() => setIframeLoaded(true)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* A/B Comparison — both variants shown simultaneously */}
          {viewMode === "ab-comparison" && abTestEnabled && (
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Variant A */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <Mail className="h-3 w-3" />
                  Variant A
                </div>
                <span className="text-[10px] text-zinc-400 truncate max-w-full px-2">Subject: {subject}</span>

                <div className="w-full max-w-[500px] space-y-3">
                  {/* Desktop */}
                  <div>
                    <span className="mb-1.5 block text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Desktop</span>
                    <iframe
                      srcDoc={emailHtmlA}
                      className="w-full h-[400px] rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm"
                      style={{ background: "#ffffff" }}
                      sandbox="allow-same-origin"
                      title="Variant A desktop preview"
                      onLoad={() => setIframeLoaded(true)}
                    />
                  </div>

                  {/* Mobile */}
                  <div className="flex flex-col items-center">
                    <span className="mb-1.5 block text-[10px] font-medium text-zinc-400 uppercase tracking-wider self-start">Mobile</span>
                    <div className="relative">
                      <div className="absolute left-1/2 top-0 z-10 h-4 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-800 dark:bg-zinc-600 flex items-center justify-center">
                        <div className="h-1 w-6 rounded-full bg-zinc-600 dark:bg-zinc-400" />
                      </div>
                      <iframe
                        srcDoc={emailHtmlA}
                        className="w-[280px] h-[480px] rounded-[28px] border-[6px] border-zinc-800 dark:border-zinc-600 shadow-lg"
                        style={{ background: "#ffffff" }}
                        sandbox="allow-same-origin"
                        title="Variant A mobile preview"
                        onLoad={() => setIframeLoaded(true)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Variant B */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  <FlaskConical className="h-3 w-3" />
                  Variant B
                </div>
                <span className="text-[10px] text-zinc-400 truncate max-w-full px-2">Subject: {subjectB || "—"}</span>

                <div className="w-full max-w-[500px] space-y-3">
                  {/* Desktop */}
                  <div>
                    <span className="mb-1.5 block text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Desktop</span>
                    <iframe
                      srcDoc={emailHtmlB}
                      className="w-full h-[400px] rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm"
                      style={{ background: "#ffffff" }}
                      sandbox="allow-same-origin"
                      title="Variant B desktop preview"
                      onLoad={() => setIframeLoaded(true)}
                    />
                  </div>

                  {/* Mobile */}
                  <div className="flex flex-col items-center">
                    <span className="mb-1.5 block text-[10px] font-medium text-zinc-400 uppercase tracking-wider self-start">Mobile</span>
                    <div className="relative">
                      <div className="absolute left-1/2 top-0 z-10 h-4 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-800 dark:bg-zinc-600 flex items-center justify-center">
                        <div className="h-1 w-6 rounded-full bg-zinc-600 dark:bg-zinc-400" />
                      </div>
                      <iframe
                        srcDoc={emailHtmlB}
                        className="w-[280px] h-[480px] rounded-[28px] border-[6px] border-zinc-800 dark:border-zinc-600 shadow-lg"
                        style={{ background: "#ffffff" }}
                        sandbox="allow-same-origin"
                        title="Variant B mobile preview"
                        onLoad={() => setIframeLoaded(true)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with metadata */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span>From: <strong className="text-zinc-600 dark:text-zinc-300">{senderName}</strong> &lt;{senderEmail}&gt;</span>
            <span className="hidden sm:inline">Subject: <strong className="text-zinc-600 dark:text-zinc-300">{currentSubject}</strong></span>
          </div>
          <Button size="sm" variant="outline" onClick={onClose} className="text-xs h-8">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}


