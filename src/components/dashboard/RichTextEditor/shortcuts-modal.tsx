"use client";

import { X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

interface ShortcutsModalProps {
  onClose: () => void;
}

function SHORTCUTS(t: ReturnType<typeof useTranslations>) {
  return [
    { category: t("formatting"), items: [
      { keys: "⌘B", label: t("bold") },
      { keys: "⌘I", label: t("italic") },
      { keys: "⌘U", label: t("underline") },
      { keys: "⌘⇧S", label: t("strikethrough") },
      { keys: "⌘⇧M", label: t("highlight") },
      { keys: "⌘⇧E", label: t("inlineCode") },
    ]},
    { category: t("headings"), items: [
      { keys: "⌘⌥1", label: t("heading1") },
      { keys: "⌘⌥2", label: t("heading2") },
      { keys: "⌘⌥3", label: t("heading3") },
      { keys: "⌘⌥4", label: t("heading4") },
      { keys: "⌘⌥5", label: t("heading5") },
      { keys: "⌘⌥6", label: t("heading6") },
      { keys: "⌘⌥0", label: t("paragraph") },
    ]},
    { category: t("lists"), items: [
      { keys: "⌘⇧7", label: t("orderedList") },
      { keys: "⌘⇧8", label: t("bulletList") },
      { keys: "⌘⇧9", label: t("taskList") },
    ]},
    { category: t("blocks"), items: [
      { keys: "⌘⌥C", label: t("codeBlock") },
      { keys: "⌘⇧B", label: t("blockquote") },
      { keys: "⌘⇧\\", label: t("horizontalRule") },
    ]},
    { category: t("editor"), items: [
      { keys: "⌘Z", label: t("undo") },
      { keys: "⌘⇧Z", label: t("redo") },
      { keys: "⌘⇧F", label: t("findReplace") },
      { keys: "⌘K", label: t("addLink") },
      { keys: "⌘⇧X", label: t("codeViewToggle") },
      { keys: "/", label: t("slashCommandMenu") },
    ]},
    { category: t("special"), items: [
      { keys: "⌘V", label: t("pasteImageFromClipboard") },
    ]},
  ];
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  const t = useTranslations("dashboard.richTextEditor");
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("keyboardShortcuts")}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {SHORTCUTS(t).map((group) => (
            <div key={group.category} className="mb-5 last:mb-0">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{group.category}</h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <span className="text-sm text-zinc-700 dark:text-muted-foreground">{item.label}</span>
                    <kbd className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-muted-foreground dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
