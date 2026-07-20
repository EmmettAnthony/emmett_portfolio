"use client";

import {
  useState,
  useCallback
} from "react";
import { cn } from "@/lib/utils";
import { buildEmailFromBlocks } from "@/lib/email";
import VariablePicker from "./VariablePicker";
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
  Code,
  Eye,
  Columns,
  Table as TableIcon,
  Variable,
  Plus,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type RichBlockType =
  | "text"
  | "image"
  | "button"
  | "divider"
  | "spacer"
  | "header"
  | "footer"
  | "cta"
  | "columns"
  | "table"
  | "variable"
  | "html";

export interface RichBlock {
  id: string;
  type: RichBlockType;
  content: Record<string, unknown>;
}

export interface RichEmailEditorProps {
  /** Current HTML content value */
  value: string;
  /** Called when the HTML content changes */
  onChange: (html: string) => void;
  /** Called with the raw blocks JSON (if in visual mode) */
  onBlocksChange?: (blocksJson: string) => void;
  /** Optional class name */
  className?: string;
  /** Placeholder text when empty */
  placeholder?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function createBlock(type: RichBlockType): RichBlock {
  const id = generateId();
  switch (type) {
    case "text":
      return { id, type, content: { text: "Enter your text here...", alignment: "left", fontSize: "14", color: "#374151" } };
    case "image":
      return { id, type, content: { src: "", alt: "Image description", alignment: "center", width: "100%" } };
    case "button":
      return { id, type, content: { text: "Click Here", url: "https://", color: "#2563eb", alignment: "center", borderRadius: "8", textColor: "#ffffff" } };
    case "divider":
      return { id, type, content: { style: "solid", color: "#e5e7eb", thickness: "1" } };
    case "spacer":
      return { id, type, content: { height: 20 } };
    case "header":
      return { id, type, content: { text: "Heading", alignment: "left", size: "h2", color: "#111827" } };
    case "footer":
      return { id, type, content: { text: "You're receiving this email because you subscribed. Unsubscribe at any time.", alignment: "center" } };
    case "cta":
      return { id, type, content: { heading: "Ready to Get Started?", description: "Take the next step and see what we can build together.", buttonText: "Get Started", buttonUrl: "https://", buttonColor: "#2563eb", alignment: "center" } };
    case "columns":
      return { id, type, content: { columns: 2, gap: "16", leftContent: "", rightContent: "", leftWidth: "50", rightWidth: "50" } };
    case "table":
      return { id, type, content: { headers: ["Column 1", "Column 2", "Column 3"], rows: [["Row 1 Cell 1", "Row 1 Cell 2", "Row 1 Cell 3"], ["Row 2 Cell 1", "Row 2 Cell 2", "Row 2 Cell 3"]], borderColor: "#e5e7eb" } };
    case "variable":
      return { id, type, content: { variable: "{{first_name}}", label: "First Name", fallback: "there" } };
    case "html":
      return { id, type, content: { html: "<div style='padding: 10px;'><p>Custom HTML content</p></div>" } };
    default:
      return { id, type, content: {} };
  }
}

// ─── Block Renderers ────────────────────────────────────────────────────────

function renderBlockPreview(block: RichBlock): string {
  const c = block.content;
  switch (block.type) {
    case "text":
      return `<div style="padding:10px 0;font-size:${c.fontSize || 14}px;line-height:1.6;text-align:${c.alignment || "left"};color:${c.color || "#374151"};">${(c.text as string) || ""}</div>`;
    case "image":
      if (!c.src) return `<div style="padding:20px;text-align:center;background:#f3f4f6;border-radius:8px;color:#9ca3af;font-size:13px;">No image selected</div>`;
      return `<div style="padding:10px 0;text-align:${c.alignment || "center"};"><img src="${c.src}" alt="${c.alt || ""}" style="max-width:${c.width || "100%"};height:auto;border-radius:8px;display:inline-block;" /></div>`;
    case "button":
      return `<div style="padding:15px 0;text-align:${c.alignment || "center"};"><a href="${c.url || "#"}" style="display:inline-block;padding:12px 32px;background-color:${c.color || "#2563eb"};color:${c.textColor || "#ffffff"};text-decoration:none;border-radius:${c.borderRadius || 8}px;font-weight:600;font-size:14px;">${c.text || "Button"}</a></div>`;
    case "divider":
      return `<div style="padding:10px 0;"><hr style="border:none;border-top:${c.thickness || 1}px ${c.style || "solid"} ${c.color || "#e5e7eb"};" /></div>`;
    case "spacer":
      return `<div style="height:${c.height || 20}px;"></div>`;
    case "header": {
      const tag = c.size || "h2";
      const size = tag === "h1" ? "24px" : tag === "h2" ? "20px" : "16px";
      return `<div style="padding:15px 0;text-align:${c.alignment || "left"};"><${tag} style="font-size:${size};font-weight:700;margin:0;color:${c.color || "#111827"};">${c.text || "Heading"}</${tag}></div>`;
    }
    case "footer":
      return `<div style="padding:20px 0;font-size:12px;color:#9ca3af;text-align:${c.alignment || "center"};border-top:1px solid #e5e7eb;">${c.text || ""}</div>`;
    case "cta":
      return `<div style="padding:25px 0;text-align:center;background:#f0f9ff;border-radius:12px;">
        ${c.heading ? `<h2 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">${c.heading}</h2>` : ""}
        ${c.description ? `<p style="font-size:14px;color:#6b7280;margin:0 0 16px;">${c.description}</p>` : ""}
        <a href="${c.buttonUrl || "#"}" style="display:inline-block;padding:14px 36px;background-color:${c.buttonColor || "#2563eb"};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">${c.buttonText || "Get Started"}</a>
      </div>`;
    case "columns": {
      const gap = c.gap || "16";
      const leftWidth = c.leftWidth || "50";
      const rightWidth = c.rightWidth || "50";
      return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
        <td width="${leftWidth}%" style="padding:0 ${gap}px 0 0;vertical-align:top;">${(c.leftContent as string) || ""}</td>
        <td width="${rightWidth}%" style="padding:0 0 0 ${gap}px;vertical-align:top;">${(c.rightContent as string) || ""}</td>
      </tr></table>`;
    }
    case "table": {
      const headers = c.headers as string[] || [];
      const rows = c.rows as string[][] || [];
      const borderColor = c.borderColor || "#e5e7eb";
      return `<table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
        ${headers.length > 0 ? `<thead><tr>${headers.map((h) => `<th style="border:1px solid ${borderColor};padding:8px;background:#f9fafb;font-weight:600;text-align:left;">${h}</th>`).join("")}</tr></thead>` : ""}
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td style="border:1px solid ${borderColor};padding:8px;">${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>`;
    }
    case "variable":
      return `<span style="display:inline-block;padding:2px 6px;margin:0 2px;font-family:monospace;font-size:13px;border-radius:4px;background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;">${c.variable || "{{variable}}"}</span>`;
    case "html":
      return (c.html as string) || "";
    default:
      return "";
  }
}

// ─── Block Property Editors ─────────────────────────────────────────────────

function TextBlockEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Content</label>
        <textarea value={(content.text as string) || ""} onChange={(e) => onChange({ ...content, text: e.target.value })} rows={4}
          className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Alignment</label>
          <select value={(content.alignment as string) || "left"} onChange={(e) => onChange({ ...content, alignment: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
            <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Font Size</label>
          <select value={(content.fontSize as string) || "14"} onChange={(e) => onChange({ ...content, fontSize: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
            <option value="12">12px</option><option value="14">14px</option><option value="16">16px</option><option value="18">18px</option><option value="20">20px</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Text Color</label>
        <div className="flex items-center gap-2">
          <input type="color" value={(content.color as string) || "#374151"} onChange={(e) => onChange({ ...content, color: e.target.value })}
            className="h-7 w-7 rounded border border-zinc-300 cursor-pointer" />
          <input type="text" value={(content.color as string) || "#374151"} onChange={(e) => onChange({ ...content, color: e.target.value })}
            className="flex-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
        </div>
      </div>
    </div>
  );
}

function ButtonBlockEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Button Text</label>
          <input type="text" value={(content.text as string) || ""} onChange={(e) => onChange({ ...content, text: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">URL</label>
          <input type="text" value={(content.url as string) || ""} onChange={(e) => onChange({ ...content, url: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Button Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={(content.color as string) || "#2563eb"} onChange={(e) => onChange({ ...content, color: e.target.value })}
              className="h-7 w-7 rounded border border-zinc-300 cursor-pointer" />
            <input type="text" value={(content.color as string) || "#2563eb"} onChange={(e) => onChange({ ...content, color: e.target.value })}
              className="flex-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Text Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={(content.textColor as string) || "#ffffff"} onChange={(e) => onChange({ ...content, textColor: e.target.value })}
              className="h-7 w-7 rounded border border-zinc-300 cursor-pointer" />
            <input type="text" value={(content.textColor as string) || "#ffffff"} onChange={(e) => onChange({ ...content, textColor: e.target.value })}
              className="flex-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Alignment</label>
          <select value={(content.alignment as string) || "center"} onChange={(e) => onChange({ ...content, alignment: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
            <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Border Radius</label>
          <input type="number" value={(content.borderRadius as number) || 8} onChange={(e) => onChange({ ...content, borderRadius: parseInt(e.target.value) })}
            className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" min="0" max="24" />
        </div>
      </div>
    </div>
  );
}

function ImageBlockEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Image URL</label>
        <input type="text" value={(content.src as string) || ""} onChange={(e) => onChange({ ...content, src: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" placeholder="https://example.com/image.jpg" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Alt Text</label>
          <input type="text" value={(content.alt as string) || ""} onChange={(e) => onChange({ ...content, alt: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Max Width</label>
          <select value={(content.width as string) || "100%"} onChange={(e) => onChange({ ...content, width: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
            <option value="100%">Full width</option><option value="75%">75%</option><option value="50%">Half</option><option value="300px">300px</option><option value="200px">200px</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Alignment</label>
        <select value={(content.alignment as string) || "center"} onChange={(e) => onChange({ ...content, alignment: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
          <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
        </select>
      </div>
    </div>
  );
}

function ColumnsBlockEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Number of Columns</label>
          <select value={(content.columns as number) || 2} onChange={(e) => onChange({ ...content, columns: parseInt(e.target.value) })}
            className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
            <option value={2}>2 Columns</option><option value={3}>3 Columns</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Gap (px)</label>
          <input type="number" value={(content.gap as number) || 16} onChange={(e) => onChange({ ...content, gap: parseInt(e.target.value) || 16 })}
            className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" min="0" max="48" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Left Column</label>
        <textarea value={(content.leftContent as string) || ""} onChange={(e) => onChange({ ...content, leftContent: e.target.value })}
          rows={3} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          placeholder="Enter content for left column..." />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Right Column</label>
        <textarea value={(content.rightContent as string) || ""} onChange={(e) => onChange({ ...content, rightContent: e.target.value })}
          rows={3} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          placeholder="Enter content for right column..." />
      </div>
    </div>
  );
}

function TableBlockEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const headers = (content.headers as string[]) || [];
  const rows = (content.rows as string[][]) || [];

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    onChange({ ...content, headers: newHeaders });
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = rows.map((row, ri) =>
      ri === rowIndex ? row.map((cell, ci) => (ci === colIndex ? value : cell)) : row
    );
    onChange({ ...content, rows: newRows });
  };

  const addRow = () => {
    const newRow = headers.map(() => "");
    onChange({ ...content, rows: [...rows, newRow] });
  };

  const removeRow = (index: number) => {
    onChange({ ...content, rows: rows.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Headers</label>
        <div className="flex gap-1">
          {headers.map((header, i) => (
            <input key={i} type="text" value={header} onChange={(e) => updateHeader(i, e.target.value)}
              className="flex-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[10px] font-medium text-zinc-500">Rows</label>
          <button onClick={addRow} className="flex items-center gap-0.5 text-[10px] text-brand-600 hover:text-brand-700 dark:text-brand-400">
            <Plus className="h-3 w-3" /> Add Row
          </button>
        </div>
        <div className="space-y-1">
          {rows.map((row, ri) => (
            <div key={ri} className="flex gap-1">
              {row.map((cell, ci) => (
                <input key={ci} type="text" value={cell} onChange={(e) => updateCell(ri, ci, e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              ))}
              <button onClick={() => removeRow(ri)} className="rounded-lg p-1 text-zinc-400 hover:bg-red-100 hover:text-red-500">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeaderBlockEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Text</label>
        <input type="text" value={(content.text as string) || ""} onChange={(e) => onChange({ ...content, text: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Size</label>
          <select value={(content.size as string) || "h2"} onChange={(e) => onChange({ ...content, size: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
            <option value="h1">Heading 1 (24px)</option><option value="h2">Heading 2 (20px)</option><option value="h3">Heading 3 (16px)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1">Alignment</label>
          <select value={(content.alignment as string) || "left"} onChange={(e) => onChange({ ...content, alignment: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
            <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Color</label>
        <div className="flex items-center gap-2">
          <input type="color" value={(content.color as string) || "#111827"} onChange={(e) => onChange({ ...content, color: e.target.value })}
            className="h-7 w-7 rounded border border-zinc-300 cursor-pointer" />
          <input type="text" value={(content.color as string) || "#111827"} onChange={(e) => onChange({ ...content, color: e.target.value })}
            className="flex-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
        </div>
      </div>
    </div>
  );
}

function VariableBlockEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Variable</label>
        <input type="text" value={(content.variable as string) || ""} onChange={(e) => onChange({ ...content, variable: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          placeholder="{{variable_name}}" />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Fallback Text</label>
        <input type="text" value={(content.fallback as string) || ""} onChange={(e) => onChange({ ...content, fallback: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          placeholder="Display if variable is empty" />
      </div>
    </div>
  );
}

function HtmlBlockEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Custom HTML</label>
        <textarea value={(content.html as string) || ""} onChange={(e) => onChange({ ...content, html: e.target.value })}
          rows={8} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          placeholder="<div>Your custom HTML here...</div>" />
      </div>
    </div>
  );
}

// ─── Block Property Panel ───────────────────────────────────────────────────

function BlockPropertyPanel({ block, onChange }: {
  block: RichBlock;
  onChange: (block: RichBlock) => void;
}) {
  const update = (content: Record<string, unknown>) => {
    onChange({ ...block, content });
  };


  switch (block.type) {
    case "text": return <TextBlockEditor content={block.content} onChange={update} />;
    case "image": return <ImageBlockEditor content={block.content} onChange={update} />;
    case "button": return <ButtonBlockEditor content={block.content} onChange={update} />;
    case "header": return <HeaderBlockEditor content={block.content} onChange={update} />;
    case "columns": return <ColumnsBlockEditor content={block.content} onChange={update} />;
    case "table": return <TableBlockEditor content={block.content} onChange={update} />;
    case "variable": return <VariableBlockEditor content={block.content} onChange={update} />;
    case "html": return <HtmlBlockEditor content={block.content} onChange={update} />;
    case "footer": return <div className="space-y-3"><div><label className="block text-[10px] font-medium text-zinc-500 mb-1">Footer Text</label><textarea value={(block.content.text as string) || ""} onChange={(e) => update({ ...block.content, text: e.target.value })} rows={3} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></div><div><label className="block text-[10px] font-medium text-zinc-500 mb-1">Alignment</label><select value={(block.content.alignment as string) || "center"} onChange={(e) => update({ ...block.content, alignment: e.target.value })} className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div></div>;
    case "cta":
      return <div className="space-y-3">
        <div><label className="block text-[10px] font-medium text-zinc-500 mb-1">Heading</label><input type="text" value={(block.content.heading as string) || ""} onChange={(e) => update({ ...block.content, heading: e.target.value })} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></div>
        <div><label className="block text-[10px] font-medium text-zinc-500 mb-1">Description</label><textarea value={(block.content.description as string) || ""} onChange={(e) => update({ ...block.content, description: e.target.value })} rows={2} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></div>
        <div className="grid grid-cols-2 gap-2"><div><label className="block text-[10px] font-medium text-zinc-500 mb-1">Button Text</label><input type="text" value={(block.content.buttonText as string) || ""} onChange={(e) => update({ ...block.content, buttonText: e.target.value })} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></div><div><label className="block text-[10px] font-medium text-zinc-500 mb-1">Button URL</label><input type="text" value={(block.content.buttonUrl as string) || ""} onChange={(e) => update({ ...block.content, buttonUrl: e.target.value })} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></div></div>
        <div><label className="block text-[10px] font-medium text-zinc-500 mb-1">Button Color</label><div className="flex items-center gap-2"><input type="color" value={(block.content.buttonColor as string) || "#2563eb"} onChange={(e) => update({ ...block.content, buttonColor: e.target.value })} className="h-7 w-7 rounded border border-zinc-300 cursor-pointer" /><input type="text" value={(block.content.buttonColor as string) || "#2563eb"} onChange={(e) => update({ ...block.content, buttonColor: e.target.value })} className="flex-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></div></div>
      </div>;
    case "divider":
      return <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><label className="block text-[10px] font-medium text-zinc-500 mb-1">Style</label><select value={(block.content.style as string) || "solid"} onChange={(e) => update({ ...block.content, style: e.target.value })} className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select></div>
          <div><label className="block text-[10px] font-medium text-zinc-500 mb-1">Thickness</label><select value={(block.content.thickness as string) || "1"} onChange={(e) => update({ ...block.content, thickness: e.target.value })} className="w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"><option value="1">1px</option><option value="2">2px</option><option value="3">3px</option></select></div>
        </div>
        <div><label className="block text-[10px] font-medium text-zinc-500 mb-1">Color</label><div className="flex items-center gap-2"><input type="color" value={(block.content.color as string) || "#e5e7eb"} onChange={(e) => update({ ...block.content, color: e.target.value })} className="h-7 w-7 rounded border border-zinc-300 cursor-pointer" /><input type="text" value={(block.content.color as string) || "#e5e7eb"} onChange={(e) => update({ ...block.content, color: e.target.value })} className="flex-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></div></div>
      </div>;
    case "spacer":
      return <div><label className="block text-[10px] font-medium text-zinc-500 mb-1">Height (px)</label><input type="number" value={(block.content.height as number) || 20} onChange={(e) => update({ ...block.content, height: parseInt(e.target.value) || 20 })} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" min="1" max="200" /></div>;
    default:
      return <p className="text-xs text-zinc-400">No configurable properties for this block type.</p>;
  }
}

// ─── Block Type Picker ──────────────────────────────────────────────────────

const BLOCK_TYPES: { type: RichBlockType; label: string; icon: React.ReactNode }[] = [
  { type: "text", label: "Text", icon: <Type className="h-3.5 w-3.5" /> },
  { type: "header", label: "Header", icon: <Heading1 className="h-3.5 w-3.5" /> },
  { type: "image", label: "Image", icon: <ImageIcon className="h-3.5 w-3.5" /> },
  { type: "button", label: "Button", icon: <Square className="h-3.5 w-3.5" /> },
  { type: "columns", label: "Columns", icon: <Columns className="h-3.5 w-3.5" /> },
  { type: "table", label: "Table", icon: <TableIcon className="h-3.5 w-3.5" /> },
  { type: "cta", label: "CTA", icon: <MousePointerClick className="h-3.5 w-3.5" /> },
  { type: "divider", label: "Divider", icon: <Minus className="h-3.5 w-3.5" /> },
  { type: "spacer", label: "Spacer", icon: <Maximize2 className="h-3.5 w-3.5" /> },
  { type: "footer", label: "Footer", icon: <Layout className="h-3.5 w-3.5" /> },
  { type: "html", label: "HTML", icon: <Code className="h-3.5 w-3.5" /> },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function RichEmailEditor({ value, onChange, onBlocksChange, className, placeholder }: RichEmailEditorProps) {
  const [mode, setMode] = useState<"visual" | "source">("visual");
  const [blocks, setBlocks] = useState<RichBlock[]>(() => {
    // Try to parse blocks from the value if it's JSON
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].type) {
        return parsed as RichBlock[];
      }
    } catch {
      // Not JSON blocks - could be HTML, that's fine
    }
    return [];
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  // Track whether we're in source mode and user has changed the HTML directly
  const [sourceHtml, setSourceHtml] = useState(() => {
    try {
      const parsed = JSON.parse(value);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Block type compat
      if (Array.isArray(parsed)) return buildEmailFromBlocks(parsed as any);
      return value || "";
    } catch {
      return value || "";
    }
  });
  const [, setSourceModeDirty] = useState(false);
  const [draggedType, setDraggedType] = useState<RichBlockType | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  const persist = useCallback(
    (newBlocks: RichBlock[]) => {
      setBlocks(newBlocks);
      const json = JSON.stringify(newBlocks);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Block type compat
      const html = buildEmailFromBlocks(newBlocks as any);
      setSourceHtml(html);
      setSourceModeDirty(false);
      onChange(html);
      onBlocksChange?.(json);
    },
    [onChange, onBlocksChange]
  );

  const addBlock = useCallback(
    (type: RichBlockType) => {
      const newBlock = createBlock(type);
      persist([...blocks, newBlock]);
      setSelectedId(newBlock.id);
    },
    [blocks, persist]
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

  const updateBlock = useCallback(
    (updatedBlock: RichBlock) => {
      const newBlocks = blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b));
      persist(newBlocks);
    },
    [blocks, persist]
  );

  const handleDrop = useCallback(() => {
    if (draggedType !== null) {
      const newBlock = createBlock(draggedType);
      let newBlocks: RichBlock[];
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
  }, [draggedType, dragOverIndex, blocks, persist]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleInsertVariable = useCallback(
    (variable: string) => {
      if (mode === "visual") {
        if (selectedBlock) {
          // Update the selected block to show the variable
          const updatedBlock = {
            ...selectedBlock,
            type: "variable" as RichBlockType,
            content: { ...selectedBlock.content, variable, fallback: "" },
          };
          updateBlock(updatedBlock);
        } else {
          // No block selected - append a new variable block
          const newBlock = createBlock("variable");
          newBlock.content = { variable, fallback: "" };
          persist([...blocks, newBlock]);
          setSelectedId(newBlock.id);
        }
      } else {
        // In source mode, insert at cursor or append
        setSourceHtml((prev) => prev + ` ${variable} `);
        setSourceModeDirty(true);
      }
      setShowVariablePicker(false);
    },
    [mode, selectedBlock, blocks, updateBlock, persist]
  );

  const handleSourceChange = useCallback(
    (html: string) => {
      setSourceHtml(html);
      setSourceModeDirty(true);
      onChange(html);
    },
    [onChange]
  );

  const handleSwitchToVisual = useCallback(() => {
    // When switching back from source mode, if the HTML was edited directly,
    // we can't reliably parse it back to blocks. We'll preserve the current
    // blocks but warn by keeping sourceHtml in sync.
    setSourceModeDirty(false);
    setMode("visual");
  }, []);

  const handleSwitchToSource = useCallback(() => {
    // When switching to source mode, sync the HTML from current blocks
    if (blocks.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Block type compat
      setSourceHtml(buildEmailFromBlocks(blocks as any));
    }
    setMode("source");
  }, [blocks]);

  const containerWidth = showMobilePreview ? "375px" : "100%";

  return (
    <div className={cn("flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-1">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              draggable
              onDragStart={() => setDraggedType(bt.type)}
              onDragEnd={() => { setDraggedType(null); setDragOverIndex(null); }}
              onClick={() => mode === "visual" && addBlock(bt.type)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              title={`Add ${bt.label} block`}
            >
              {bt.icon}
              <span className="hidden sm:inline">{bt.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {/* Variable Picker Toggle */}
          <button
            onClick={() => setShowVariablePicker(!showVariablePicker)}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              showVariablePicker ? "bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            )}
            title="Insert Variable"
          >
            <Variable className="h-3.5 w-3.5" />
          </button>
          {/* View mode toggle */}
          <div className="flex items-center rounded-md border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={handleSwitchToVisual}
              className={cn("rounded-l-md px-2 py-1 text-[10px] font-medium transition-colors", mode === "visual" ? "bg-brand-600 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}
            >
              <Layout className="h-3 w-3" />
            </button>
            <button
              onClick={handleSwitchToSource}
              className={cn("rounded-r-md px-2 py-1 text-[10px] font-medium transition-colors", mode === "source" ? "bg-brand-600 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}
            >
              <Code className="h-3 w-3" />
            </button>
          </div>
          {/* Preview toggle */}
          <button
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className={cn("rounded-md p-1.5 transition-colors", showMobilePreview ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800")}
            title={showMobilePreview ? "Desktop view" : "Mobile view"}
          >
            {showMobilePreview ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Variable Picker Panel */}
      {showVariablePicker && (
        <div className="border-b border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <VariablePicker onInsert={handleInsertVariable} />
        </div>
      )}

      <div className="flex flex-1">
        {/* Editor Area */}
        <div className="flex-1 min-w-0">
          {mode === "visual" ? (
            <div
              className="overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-950"
              style={{ maxHeight: "600px" }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div style={{ maxWidth: containerWidth, margin: "0 auto" }} className="bg-white rounded-lg shadow-sm dark:bg-zinc-900">
                {blocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Layout className="mb-2 h-8 w-8 text-zinc-300" />
                    <p className="text-sm text-zinc-400">
                      {placeholder || "Click or drag block types above to build your email"}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {BLOCK_TYPES.slice(0, 6).map((bt) => (
                        <button
                          key={bt.type}
                          onClick={() => addBlock(bt.type)}
                          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-brand-700 dark:hover:text-brand-400"
                        >
                          {bt.icon}
                          {bt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {blocks.map((block, index) => (
                      <div
                        key={block.id}
                        onDragOver={(e) => handleDragOver(e, index)}
                        className="relative group"
                      >
                        {/* Block actions overlay */}
                        <div className="absolute right-1 top-1 z-10 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => moveBlock(block.id, "up")} disabled={index === 0}
                            className="rounded bg-white p-1 text-zinc-400 shadow-sm hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button onClick={() => moveBlock(block.id, "down")} disabled={index === blocks.length - 1}
                            className="rounded bg-white p-1 text-zinc-400 shadow-sm hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                            <ChevronDown className="h-3 w-3" />
                          </button>
                          <button onClick={() => setSelectedId(block.id)}
                            className={cn("rounded bg-white p-1 shadow-sm dark:bg-zinc-800", selectedId === block.id ? "text-brand-500 ring-1 ring-brand-500" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700")}>
                            <Eye className="h-3 w-3" />
                          </button>
                          <button onClick={() => deleteBlock(block.id)}
                            className="rounded bg-white p-1 text-red-400 shadow-sm hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800 dark:hover:bg-red-900/20">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        {/* Block index indicator */}
                        <div className="absolute left-1 top-1 z-10">
                          <span className="rounded bg-zinc-100 px-1 py-0.5 text-[9px] font-medium text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                            {index + 1}
                          </span>
                        </div>
                        {/* Block type label */}
                        <div className="border-b border-dashed border-transparent px-2 pt-1 pb-0.5 group-hover:border-zinc-200 dark:group-hover:border-zinc-700">
                          <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-300 dark:text-zinc-600">
                            {block.type}
                          </span>
                        </div>
                        {/* Block preview */}
                        <div
                          onClick={() => setSelectedId(block.id)}
                          className={cn(
                            "cursor-pointer p-3 transition-colors",
                            selectedId === block.id ? "ring-2 ring-inset ring-brand-500 bg-brand-50/30 dark:bg-brand-950/20" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                          )}
                          dangerouslySetInnerHTML={{ __html: renderBlockPreview(block) }}
                        />
                        {dragOverIndex === index && draggedType && (
                          <div className="border-2 border-dashed border-brand-400 rounded-lg mx-2 my-1 p-2 text-center text-[10px] text-brand-500">
                            Drop here
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Source mode: raw HTML editor */
            <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
              <div className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[10px] font-medium text-zinc-500">HTML Source</label>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-mono text-zinc-500 dark:bg-zinc-800">
                    {sourceHtml.length} chars
                  </span>
                </div>
                <textarea
                  value={sourceHtml}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  rows={20}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  placeholder="<html><body><h1>Your email content here</h1></body></html>"
                />
              </div>
            </div>
          )}
        </div>

        {/* Properties Sidebar */}
        <div className="hidden md:block w-64 shrink-0 border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-3">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {selectedBlock ? `${selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)} Properties` : "Properties"}
            </h3>
            {selectedBlock ? (
              <div className="space-y-3">
                <BlockPropertyPanel block={selectedBlock} onChange={updateBlock} />
                <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <button
                    onClick={() => deleteBlock(selectedBlock.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-[10px] font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete Block
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Layout className="mb-2 h-6 w-6 text-zinc-300" />
                <p className="text-xs text-zinc-400">Select a block to edit its properties</p>
                <p className="mt-1 text-[10px] text-zinc-300">Click on any block in the editor</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
