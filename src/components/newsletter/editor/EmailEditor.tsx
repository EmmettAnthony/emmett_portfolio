"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import {
  Type,
  ImageIcon,
  Square,
  Minus,
  Maximize2,
  Heading1,
  Layout,
  MousePointerClick,
  Trash2,
  ChevronUp,
  ChevronDown,
  Monitor,
  Smartphone,
} from "lucide-react";
import type { EmailBlock, EmailBlockType } from "@/types/newsletter";

interface EmailEditorProps {
  value: string;
  onChange: (blocks: string) => void;
  className?: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function createBlock(type: EmailBlockType, t: (key: string) => string): EmailBlock {
  const id = generateId();
  switch (type) {
    case "text":
      return { id, type, content: { text: t("enterText"), alignment: "left" } };
    case "image":
      return { id, type, content: { src: "", alt: t("imageDescription"), alignment: "center" } };
    case "button":
      return { id, type, content: { text: t("clickHere"), url: "https://", color: "#3b82f6", alignment: "center" } };
    case "divider":
      return { id, type, content: {} };
    case "spacer":
      return { id, type, content: { height: 20 } };
    case "header":
      return { id, type, content: { text: t("heading"), alignment: "left", size: "h2" } };
    case "footer":
      return { id, type, content: { text: t("emailFooter") } };
    case "cta":
      return { id, type, content: { heading: t("ctaReady"), description: t("ctaSubtext"), buttonText: t("ctaButton"), buttonUrl: "https://" } };
    default:
      return { id, type, content: {} };
  }
}

function renderEmailBlock(block: EmailBlock, isSelected: boolean, onSelect: () => void, t: (key: string) => string): React.ReactNode {
  const style: React.CSSProperties = {
    border: isSelected ? "2px solid #3b82f6" : "2px solid transparent",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "border-color 0.15s ease",
    position: "relative" as const,
  };

  switch (block.type) {
    case "text":
      return (
        <div style={style} onClick={onSelect} className="p-4">
          <div style={{ textAlign: (block.content.alignment as React.CSSProperties["textAlign"]) ?? "left" }}>
            <span style={{ fontSize: "14px", lineHeight: "1.6", color: "#374151" }}>{block.content.text as string}</span>
          </div>
        </div>
      );
    case "image":
      return (
        <div style={style} onClick={onSelect} className="p-4">
          <div style={{ textAlign: (block.content.alignment as React.CSSProperties["textAlign"]) ?? "center" }}>
            {block.content.src ? (
              <Image
                src={block.content.src as string}
                alt={(block.content.alt as string) ?? ""}
                width={600}
                height={400}
                style={{ maxWidth: "100%", height: "auto", display: "inline-block" }}
              />
            ) : (
              <div style={{ background: "#f3f4f6", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
                {t("noImage")}
              </div>
            )}
          </div>
        </div>
      );
    case "button":
      return (
        <div style={style} onClick={onSelect} className="p-4">
          <div style={{ textAlign: (block.content.alignment as React.CSSProperties["textAlign"]) ?? "center" }}>
            <a
              href={(block.content.url as string) ?? "#"}
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: (block.content.color as string) ?? "#3b82f6",
                color: "#ffffff",
                textDecoration: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {(block.content.text as string) ?? t("button")}
            </a>
          </div>
        </div>
      );
    case "divider":
      return (
        <div style={style} onClick={onSelect} className="p-4">
          <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "0" }} />
        </div>
      );
    case "spacer":
      return (
        <div style={{ ...style, padding: "0" }} onClick={onSelect}>
          <div style={{ height: (block.content.height as number) ?? 20 }} />
        </div>
      );
    case "header":
      return (
        <div style={style} onClick={onSelect} className="p-4">
          {(block.content.size as string) === "h1" ? (
            <h1 style={{ textAlign: (block.content.alignment as React.CSSProperties["textAlign"]) ?? "left", fontSize: "24px", fontWeight: 700, color: "#111827", margin: 0 }}>
              {block.content.text as string}
            </h1>
          ) : (block.content.size as string) === "h3" ? (
            <h3 style={{ textAlign: (block.content.alignment as React.CSSProperties["textAlign"]) ?? "left", fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>
              {block.content.text as string}
            </h3>
          ) : (
            <h2 style={{ textAlign: (block.content.alignment as React.CSSProperties["textAlign"]) ?? "left", fontSize: "20px", fontWeight: 600, color: "#111827", margin: 0 }}>
              {block.content.text as string}
            </h2>
          )}
        </div>
      );
    case "footer":
      return (
        <div style={{ ...style, background: "#f9fafb" }} onClick={onSelect} className="p-4">
          <p style={{ fontSize: "12px", lineHeight: "1.5", color: "#9ca3af", textAlign: "center", margin: 0 }}>
            {block.content.text as string}
          </p>
        </div>
      );
    case "cta":
      return (
        <div style={{ ...style, background: "#f0f9ff" }} onClick={onSelect} className="p-6">
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
              {block.content.heading as string}
            </h2>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 16px", lineHeight: "1.5" }}>
              {block.content.description as string}
            </p>
            <a
              href={(block.content.buttonUrl as string) ?? "#"}
              style={{
                display: "inline-block",
                padding: "12px 28px",
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                textDecoration: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {(block.content.buttonText as string) ?? t("ctaButton")}
            </a>
          </div>
        </div>
      );
    default:
      return null;
  }
}

function BlockPropertiesPanel({ block, onChange, t }: { block: EmailBlock; onChange: (block: EmailBlock) => void; t: (key: string) => string }) {
  const updateContent = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...block, content: { ...block.content, [key]: value } });
    },
    [block, onChange]
  );

  switch (block.type) {
    case "text":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">{t("textContent")}</label>
            <textarea
              value={(block.content.text as string) ?? ""}
              onChange={(e) => updateContent("text", e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">{t("alignment")}</label>
            <select
              value={(block.content.alignment as string) ?? "left"}
              onChange={(e) => updateContent("alignment", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="left">{t("left")}</option>
              <option value="center">{t("center")}</option>
              <option value="right">{t("right")}</option>
            </select>
          </div>
        </div>
      );
    case "image":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">{t("imageUrl")}</label>
            <input
              type="text"
              value={(block.content.src as string) ?? ""}
              onChange={(e) => updateContent("src", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder={t("imageUrlPlaceholder")}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">{t("altText")}</label>
            <input
              type="text"
              value={(block.content.alt as string) ?? ""}
              onChange={(e) => updateContent("alt", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">{t("alignment")}</label>
            <select
              value={(block.content.alignment as string) ?? "center"}
              onChange={(e) => updateContent("alignment", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="left">{t("left")}</option>
              <option value="center">{t("center")}</option>
              <option value="right">{t("right")}</option>
            </select>
          </div>
        </div>
      );
    case "button":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Button Text</label>
            <input
              type="text"
              value={(block.content.text as string) ?? ""}
              onChange={(e) => updateContent("text", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Button URL</label>
            <input
              type="text"
              value={(block.content.url as string) ?? ""}
              onChange={(e) => updateContent("url", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(block.content.color as string) ?? "#3b82f6"}
                onChange={(e) => updateContent("color", e.target.value)}
                className="h-8 w-8 rounded border border-zinc-300 cursor-pointer"
              />
              <input
                type="text"
                value={(block.content.color as string) ?? "#3b82f6"}
                onChange={(e) => updateContent("color", e.target.value)}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">{t("alignment")}</label>
            <select
              value={(block.content.alignment as string) ?? "center"}
              onChange={(e) => updateContent("alignment", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="left">{t("left")}</option>
              <option value="center">{t("center")}</option>
              <option value="right">{t("right")}</option>
            </select>
          </div>
        </div>
      );
    case "divider":
      return (
        <div className="py-6 text-center text-sm text-zinc-400">
          Dividers have no configurable properties.
        </div>
      );
    case "spacer":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Height (px)</label>
            <input
              type="number"
              value={(block.content.height as number) ?? 20}
              onChange={(e) => updateContent("height", parseInt(e.target.value) || 20)}
              min={1}
              max={200}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        </div>
      );
    case "header":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Text</label>
            <input
              type="text"
              value={(block.content.text as string) ?? ""}
              onChange={(e) => updateContent("text", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">{t("alignment")}</label>
            <select
              value={(block.content.alignment as string) ?? "left"}
              onChange={(e) => updateContent("alignment", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="left">{t("left")}</option>
              <option value="center">{t("center")}</option>
              <option value="right">{t("right")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Size</label>
            <select
              value={(block.content.size as string) ?? "h2"}
              onChange={(e) => updateContent("size", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="h1">Heading 1 (24px)</option>
              <option value="h2">Heading 2 (20px)</option>
              <option value="h3">Heading 3 (16px)</option>
            </select>
          </div>
        </div>
      );
    case "footer":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Footer Text</label>
            <textarea
              value={(block.content.text as string) ?? ""}
              onChange={(e) => updateContent("text", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        </div>
      );
    case "cta":
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Heading</label>
            <input
              type="text"
              value={(block.content.heading as string) ?? ""}
              onChange={(e) => updateContent("heading", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
            <textarea
              value={(block.content.description as string) ?? ""}
              onChange={(e) => updateContent("description", e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Button Text</label>
            <input
              type="text"
              value={(block.content.buttonText as string) ?? ""}
              onChange={(e) => updateContent("buttonText", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Button URL</label>
            <input
              type="text"
              value={(block.content.buttonUrl as string) ?? ""}
              onChange={(e) => updateContent("buttonUrl", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function EmailEditor({ value, onChange, className }: EmailEditorProps) {
  const t = useTranslations("newsletter.editor");

  const BLOCK_TYPES: { type: EmailBlockType; label: string; icon: React.ReactNode }[] = [
    { type: "text", label: t("text"), icon: <Type className="h-4 w-4" /> },
    { type: "image", label: t("image"), icon: <ImageIcon className="h-4 w-4" /> },
    { type: "button", label: t("button"), icon: <Square className="h-4 w-4" /> },
    { type: "divider", label: t("divider"), icon: <Minus className="h-4 w-4" /> },
    { type: "spacer", label: t("spacer"), icon: <Maximize2 className="h-4 w-4" /> },
    { type: "header", label: t("header"), icon: <Heading1 className="h-4 w-4" /> },
    { type: "footer", label: t("footer"), icon: <Layout className="h-4 w-4" /> },
    { type: "cta", label: t("callToAction"), icon: <MousePointerClick className="h-4 w-4" /> },
  ];

  const [blocks, setBlocks] = useState<EmailBlock[]>(() => {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [draggedType, setDraggedType] = useState<EmailBlockType | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);


  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  const persist = useCallback(
    (newBlocks: EmailBlock[]) => {
      setBlocks(newBlocks);
      onChange(JSON.stringify(newBlocks));
    },
    [onChange]
  );

  const addBlock = useCallback(
    (type: EmailBlockType) => {
      const newBlock = createBlock(type, t);
      persist([...blocks, newBlock]);
      setSelectedId(newBlock.id);
    },
    [blocks, persist, t]
  );

  const deleteBlock = useCallback(
    (id: string) => {
      const newBlocks = blocks.filter((b) => b.id !== id);
      persist(newBlocks);
      if (selectedId === id) setSelectedId(null);
    },
    [blocks, selectedId, persist]
  );

  const moveBlock = useCallback(
    (id: string, direction: "up" | "down") => {
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx === -1) return;
      if (direction === "up" && idx === 0) return;
      if (direction === "down" && idx === blocks.length - 1) return;

      const newBlocks = [...blocks];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      [newBlocks[idx], newBlocks[targetIdx]] = [newBlocks[targetIdx], newBlocks[idx]];
      persist(newBlocks);
    },
    [blocks, persist]
  );

  const updateBlockContent = useCallback(
    (updatedBlock: EmailBlock) => {
      const newBlocks = blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b));
      persist(newBlocks);
    },
    [blocks, persist]
  );

  const handleDrop = useCallback(() => {
    if (draggedType !== null) {
      const newBlock = createBlock(draggedType, t);
      let newBlocks: EmailBlock[];
      if (dragOverIndex !== null) {
        newBlocks = [...blocks];
        newBlocks.splice(dragOverIndex, 0, newBlock);
      } else {
        newBlocks = [...blocks, newBlock];
      }
      persist(newBlocks);
      setSelectedId(newBlock.id);
      setDraggedType(null);
      setDragOverIndex(null);
    }
  }, [draggedType, dragOverIndex, blocks, persist, t]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const containerWidth = mobilePreview ? 375 : "100%";

  return (
    <div className={cn("flex gap-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden", className)}>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-1">
            {BLOCK_TYPES.filter((bt) => bt.type !== "divider").map((bt) => (
              <button
                key={bt.type}
                draggable
                onDragStart={() => setDraggedType(bt.type)}
                onDragEnd={() => { setDraggedType(null); setDragOverIndex(null); }}
                onClick={() => addBlock(bt.type)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                {bt.icon}
                {bt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5 dark:bg-zinc-800">
            <button
              onClick={() => setMobilePreview(false)}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                !mobilePreview ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
              )}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMobilePreview(true)}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                mobilePreview ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
              )}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto bg-zinc-50 p-6 dark:bg-zinc-950"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div
            style={{ maxWidth: containerWidth, margin: "0 auto" }}
            className="bg-white rounded-xl shadow-sm dark:bg-zinc-900"
          >
            {blocks.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-zinc-400">Drag block types here or click to add them</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    onDragOver={(e) => handleDragOver(e, index)}
                    className="relative group"
                  >
                    <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => moveBlock(block.id, "up")}
                        disabled={index === 0}
                        className="rounded-md bg-white p-1 text-zinc-400 shadow-sm transition-colors hover:bg-zinc-100 hover:text-muted-foreground disabled:opacity-30 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveBlock(block.id, "down")}
                        disabled={index === blocks.length - 1}
                        className="rounded-md bg-white p-1 text-zinc-400 shadow-sm transition-colors hover:bg-zinc-100 hover:text-muted-foreground disabled:opacity-30 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBlock(block.id)}
                        className="rounded-md bg-white p-1 text-red-400 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {renderEmailBlock(block, selectedId === block.id, () => setSelectedId(block.id), t)}
                  </div>
                ))}
              </div>
            )}
            {dragOverIndex !== null && draggedType && (
              <div className="border-2 border-dashed border-blue-400 rounded-lg p-4 m-2 text-center text-sm text-blue-500">
                Drop here to add {draggedType} block
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-72 shrink-0 border-l border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Block Properties</h3>
        {selectedBlock ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                {selectedBlock.type} block
              </span>
              <button
                onClick={() => deleteBlock(selectedBlock.id)}
                className="rounded-md p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <BlockPropertiesPanel block={selectedBlock} onChange={updateBlockContent} t={t} />
          </div>
        ) : (
          <p className="text-sm text-zinc-400">Click a block to edit its properties</p>
        )}
      </div>
    </div>
  );
}
