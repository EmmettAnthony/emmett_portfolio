"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  startTransition
} from "react";
import {
  useEditor,
  EditorContent,
  mergeAttributes
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import UnderlineExtension from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import HighlightExtension from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Youtube from "@tiptap/extension-youtube";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Typography from "@tiptap/extension-typography";
import { ImageGrid, ImageGridCell } from "@/components/dashboard/RichTextEditor/image-grid";
import { DragHandle } from "@/components/dashboard/RichTextEditor/drag-handle";
import { LinkPreview } from "@/components/dashboard/RichTextEditor/link-preview";
import {
  TwitterEmbed,
  InstagramEmbed,
  CodePenEmbed,
  detectEmbedProvider
} from "@/components/dashboard/RichTextEditor/extensions";
import { Details, DetailsSummary } from "@/components/dashboard/RichTextEditor/details";
import { MediaBrowser } from "@/components/dashboard/RichTextEditor/media-browser";
import { ShortcutsModal } from "@/components/dashboard/RichTextEditor/shortcuts-modal";
import { ImageResizer } from "@/components/dashboard/RichTextEditor/image-resizer";
import { common, createLowlight } from "lowlight";
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks,
  Code, Quote, Link, Image,
  Undo, Redo, Pilcrow,
  Loader2, FileCode,
  Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight,
  Palette, Highlighter,
  Minus, Plus, Trash2,
  Video, ChevronDown,
  Wand2, Type, LetterText,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  RemoveFormatting,
  Maximize2, Minimize2,
  Search,
  StickyNote,
  Merge, Ungroup,
  LayoutGrid, Keyboard,
  Monitor, Focus, ListTree,
  Cloud, CloudOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing-client";
import { Editor, NodeViewProps } from "@tiptap/react";

const lowlight = createLowlight(common);

const CODE_BLOCK_LANGUAGES = [
  { label: "Auto", value: "" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "JSX", value: "jsx" },
  { label: "TSX", value: "tsx" },
  { label: "Python", value: "python" },
  { label: "CSS", value: "css" },
  { label: "SCSS", value: "scss" },
  { label: "HTML", value: "html" },
  { label: "JSON", value: "json" },
  { label: "YAML", value: "yaml" },
  { label: "Markdown", value: "markdown" },
  { label: "Bash", value: "bash" },
  { label: "Shell", value: "shell" },
  { label: "SQL", value: "sql" },
  { label: "Java", value: "java" },
  { label: "Kotlin", value: "kotlin" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
  { label: "Ruby", value: "ruby" },
  { label: "PHP", value: "php" },
  { label: "C", value: "c" },
  { label: "C++", value: "cpp" },
  { label: "C#", value: "csharp" },
  { label: "Swift", value: "swift" },
  { label: "Dart", value: "dart" },
  { label: "GraphQL", value: "graphql" },
  { label: "Diff", value: "diff" },
  { label: "Regex", value: "regex" },
];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    twitterEmbed: { insertTwitterEmbed: (src: string) => ReturnType };
    instagramEmbed: { insertInstagramEmbed: (src: string) => ReturnType };
    codepenEmbed: { insertCodePenEmbed: (src: string) => ReturnType };
  }
}

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editorRef?: React.MutableRefObject<Editor | null>;
}

const COLORS = [
  { label: "Default", value: undefined },
  { label: "Gray", value: "#6b7280" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
];

const HIGHLIGHTS = [
  { label: "None", value: undefined },
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Pink", value: "#fbc7d4" },
  { label: "Orange", value: "#fed7aa" },
];

const EMOJIS = [
  "😀","😃","😄","😁","😅","😂","🤣","😊","😇","🙂",
  "😉","😌","😍","🥰","😘","😗","😋","😛","🤗","🤩",
  "👍","👎","👊","✊","🤝","🙏","💪","👏","🙌","🤘",
  "❤️","🧡","💛","💚","💙","💜","🖤","💔","💯","🔥",
  "⭐","🌟","✨","💡","📝","📌","🎯","🚀","🎉","🎊",
];

type SlashMenuItem = {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: (editor: import('@tiptap/react').Editor) => void;
};

const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  { title: "Heading 1", description: "Large heading", icon: <Heading1 className="h-4 w-4" />, action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { title: "Heading 2", description: "Medium heading", icon: <Heading2 className="h-4 w-4" />, action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { title: "Heading 3", description: "Small heading", icon: <Heading3 className="h-4 w-4" />, action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { title: "Bullet List", description: "Unordered list", icon: <List className="h-4 w-4" />, action: (e) => e.chain().focus().toggleBulletList().run() },
  { title: "Numbered List", description: "Ordered list", icon: <ListOrdered className="h-4 w-4" />, action: (e) => e.chain().focus().toggleOrderedList().run() },
  { title: "Checklist", description: "Task list", icon: <ListChecks className="h-4 w-4" />, action: (e) => e.chain().focus().toggleTaskList().run() },
  { title: "Code Block", description: "Code with syntax highlighting", icon: <Code className="h-4 w-4" />, action: (e) => e.chain().focus().toggleCodeBlock().run() },
  { title: "Blockquote", description: "Quote text", icon: <Quote className="h-4 w-4" />, action: (e) => e.chain().focus().toggleBlockquote().run() },
  { title: "Details", description: "Collapsible section", icon: <ChevronDown className="h-4 w-4" />, action: (e) => e.chain().focus().setDetails().run() },
  { title: "Divider", description: "Horizontal rule", icon: <Minus className="h-4 w-4" />, action: (e) => e.chain().focus().setHorizontalRule().run() },
  { title: "Image", description: "Upload an image", icon: <Image className="h-4 w-4" />, action: () => {} },  // eslint-disable-line jsx-a11y/alt-text
  { title: "Table", description: "Insert a table", icon: <TableIcon className="h-4 w-4" />, action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { title: "YouTube", description: "Embed a video", icon: <Video className="h-4 w-4" />, action: (e) => { const url = window.prompt("YouTube URL:"); if (url) e.chain().focus().setYoutubeVideo({ src: url }).run(); } },
  { title: "Image Grid", description: "2-column image grid", icon: <LayoutGrid className="h-4 w-4" />, action: (e) => e.chain().focus().insertImageGrid(2).run() },
  { title: "X (Twitter)", description: "Embed a tweet", icon: <span className="text-sm">𝕏</span>, action: (e) => { const url = window.prompt("X (Twitter) URL:"); if (url && detectEmbedProvider(url)) e.chain().focus().insertTwitterEmbed(url).run(); else if (url) window.alert("Invalid X/Twitter URL"); } },
  { title: "Instagram", description: "Embed a post", icon: <span className="text-sm">📷</span>, action: (e) => { const url = window.prompt("Instagram URL:"); if (url && detectEmbedProvider(url)) e.chain().focus().insertInstagramEmbed(url).run(); else if (url) window.alert("Invalid Instagram URL"); } },
  { title: "CodePen", description: "Embed a pen", icon: <span className="text-sm">🖊</span>, action: (e) => { const url = window.prompt("CodePen URL:"); if (url && detectEmbedProvider(url)) e.chain().focus().insertCodePenEmbed(url).run(); else if (url) window.alert("Invalid CodePen URL"); } },
];

function MenuButton({ onClick, active, children, title, className }: {
  onClick: () => void; active?: boolean; children: React.ReactNode; title: string; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded-md p-1.5 transition-colors",
        active
          ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />;
}

function Dropdown({ trigger, children, align = "left" }: {
  trigger: React.ReactNode; children: React.ReactNode; align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        {trigger}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div
          className={cn(
            "absolute top-full z-50 mt-1 min-w-[180px] rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900",
            align === "right" ? "right-0" : "left-0"
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function ColorPicker({ label, colors, current, onSelect }: {
  label: string; colors: { label: string; value: string | undefined }[]; current: string | undefined; onSelect: (color: string | undefined) => void;
}) {
  return (
    <div className="px-2 py-1.5">
      <p className="mb-1.5 text-xs font-medium text-zinc-500">{label}</p>
      <div className="flex flex-wrap gap-1">
        {colors.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => onSelect(c.value)}
            title={c.label}
            className={cn(
              "h-6 w-6 rounded-md border border-zinc-200 dark:border-zinc-700",
              current === c.value && "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-900"
            )}
            style={c.value ? { backgroundColor: c.value } : undefined}
          >
            {!c.value && <Minus className="mx-auto h-3 w-3 text-zinc-400" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function SlashMenu({ editor, open, onClose, onUploadImage }: {
  editor: import('@tiptap/react').Editor; open: boolean; onClose: () => void; onUploadImage?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = SLASH_MENU_ITEMS.filter(
    (item) => item.title.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[selectedIndex];
        if (item) {
          if (item.title === "Image") {
            onUploadImage?.();
          } else {
            item.action(editor);
          }
          editor.commands.deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from });
          onClose();
        }
      }
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, filtered, selectedIndex, editor, onClose, onUploadImage]);

  useEffect(() => {
    const t = setTimeout(() => setSelectedIndex(0), 0);
    return () => clearTimeout(t);
  }, [search, filtered.length]);

  if (!open) return null;

  return (
    <div
      className="absolute left-0 z-50 w-72 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      style={{ top: "100%", marginTop: 4 }}
    >
      <div className="relative mb-2">
        <Wand2 className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full rounded-lg border border-zinc-200 bg-transparent py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:text-white"
          autoFocus
        />
      </div>
      <div className="max-h-60 space-y-0.5 overflow-y-auto">
        {filtered.map((item, i) => (
          <button
            key={item.title}
            type="button"
            onClick={() => {
              if (item.title === "Image") {
                onUploadImage?.();
              } else {
                item.action(editor);
              }
              editor.commands.deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from });
              onClose();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
              i === selectedIndex
                ? "bg-zinc-100 dark:bg-zinc-800"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
              {item.icon}
            </span>
            <div className="flex-1">
              <p className="font-medium text-zinc-900 dark:text-white">{item.title}</p>
              <p className="text-xs text-zinc-500">{item.description}</p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-zinc-500">No results</p>
        )}
      </div>
    </div>
  );
}

function LinkPopover({ editor, onClose }: { editor: import('@tiptap/react').Editor; onClose: () => void }) {
  const [url, setUrl] = useState(editor.getAttributes("link").href || "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const applyLink = () => {
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    onClose();
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
    >
      <p className="mb-2 text-xs font-medium text-zinc-500">Edit Link</p>
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-600 dark:text-white"
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") applyLink(); if (e.key === "Escape") onClose(); }}
        />
        <button
          onClick={applyLink}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Apply
        </button>
      </div>
      <button
        onClick={removeLink}
        className="mt-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400"
      >
        Remove link
      </button>
    </div>
  );
}

function ImagePopover({ editor, onClose }: { editor: import('@tiptap/react').Editor; onClose: () => void }) {
  const attrs = editor.getAttributes("image");
  const [alt, setAlt] = useState(attrs.alt || "");
  const [width, setWidth] = useState(attrs.width || "");
  const [float, setFloat] = useState<string | null>(attrs.float || null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const apply = () => {
    editor
      .chain()
      .focus()
      .updateAttributes("image", {
        alt,
        ...(width ? { width } : {}),
        ...(float ? { float } : { float: null }),
      })
      .run();
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
    >
      <p className="mb-2 text-xs font-medium text-zinc-500">Image Settings</p>
      <div className="space-y-2">
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Alt text (accessibility)"
          className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-600 dark:text-white"
        />
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="Width (e.g. 100%, 600px)"
            className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-600 dark:text-white"
          />
          <button
            onClick={apply}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Apply
          </button>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500">Text wrap</p>
          <div className="flex gap-1">
            {[
              { value: null, label: "None", icon: "⊞" },
              { value: "left", label: "Left", icon: "◁" },
              { value: "right", label: "Right", icon: "▷" },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setFloat(opt.value)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                  float === opt.value
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                )}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TableMenu({ editor }: { editor: import('@tiptap/react').Editor }) {
  return (
    <div className="w-56 p-1">
      <p className="mb-1 px-2.5 py-1 text-xs font-medium text-zinc-500">Table Actions</p>
      <div className="grid grid-cols-2 gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowBefore().run()}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Plus className="h-3.5 w-3.5 text-zinc-500" /> Row Before
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Plus className="h-3.5 w-3.5 text-zinc-500" /> Row After
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Plus className="h-3.5 w-3.5 text-zinc-500" /> Col Before
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Plus className="h-3.5 w-3.5 text-zinc-500" /> Col After
        </button>
      </div>
      <hr className="my-1 border-zinc-200 dark:border-zinc-700" />
      <div className="grid grid-cols-2 gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteRow().run()}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" /> Delete Row
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteColumn().run()}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" /> Delete Col
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().mergeCells().run()}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Merge className="h-3.5 w-3.5 text-zinc-500" /> Merge Cells
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().splitCell().run()}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Ungroup className="h-3.5 w-3.5 text-zinc-500" /> Split Cell
        </button>
      </div>
      <hr className="my-1 border-zinc-200 dark:border-zinc-700" />
      <button
        type="button"
        onClick={() => editor.chain().focus().deleteTable().run()}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete Table
      </button>
    </div>
  );
}

function EmojiPicker({ editor, onClose }: { editor: import('@tiptap/react').Editor; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => EMOJIS.filter((e) => !search || e.includes(search)),
    [search]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
    >
      <p className="mb-2 text-xs font-medium text-zinc-500">Emoji</p>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="mb-2 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-600 dark:text-white"
        autoFocus
      />
      <div className="grid grid-cols-8 gap-1">
        {filtered.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              editor.chain().focus().insertContent(emoji).run();
              onClose();
            }}
            className="rounded-lg p-1.5 text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="py-4 text-center text-sm text-zinc-500">No emojis found</p>
      )}
    </div>
  );
}

function FindReplace({ editor, onClose }: { editor: import('@tiptap/react').Editor; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [matches, setMatches] = useState<{ from: number; to: number }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [replaceMode, setReplaceMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const findMatches = useCallback((text: string) => {
    if (!text || !editor) return [];
    const doc = editor.state.doc;
    const lowerQuery = text.toLowerCase();
    const results: { from: number; to: number }[] = [];
    doc.descendants((node, pos) => {
      if (node.isText) {
        const nodeText = node.text || "";
        const lowerText = nodeText.toLowerCase();
        let index = 0;
        while (true) {
          const idx = lowerText.indexOf(lowerQuery, index);
          if (idx === -1) break;
          const from = pos + idx;
          const to = pos + idx + text.length;
          results.push({ from, to });
          index = idx + 1;
        }
      }
    });
    return results;
  }, [editor]);

  useEffect(() => {
    const m = findMatches(query);
    startTransition(() => {
      setMatches(m);
      setCurrentIndex(0);
    });
    if (m.length > 0) {
      editor?.chain().focus().setTextSelection({ from: m[0].from, to: m[0].to }).run();
    }
  }, [query, findMatches, editor]);

  const goTo = (index: number) => {
    if (matches.length === 0) return;
    const i = ((index % matches.length) + matches.length) % matches.length;
    setCurrentIndex(i);
    editor?.chain().focus().setTextSelection({ from: matches[i].from, to: matches[i].to }).scrollIntoView().run();
  };

  const replace = () => {
    if (matches.length === 0) return;
    const match = matches[currentIndex];
    editor?.chain().focus().deleteRange({ from: match.from, to: match.to }).insertContent(replacement).run();
    const m = findMatches(query);
    setMatches(m);
    if (m.length > 0) {
      setCurrentIndex(Math.min(currentIndex, m.length - 1));
      editor?.chain().focus().setTextSelection({ from: m[Math.min(currentIndex, m.length - 1)].from, to: m[Math.min(currentIndex, m.length - 1)].to }).run();
    }
  };

  const replaceAll = () => {
    if (matches.length === 0) return;
    const m = [...matches];
    for (let i = m.length - 1; i >= 0; i--) {
      editor?.chain().focus().deleteRange({ from: m[i].from, to: m[i].to }).insertContent(replacement).run();
    }
    setMatches([]);
    setCurrentIndex(0);
  };

  return (
    <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find..."
        className="w-40 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        onKeyDown={(e) => { if (e.key === "Enter") goTo(e.shiftKey ? currentIndex - 1 : currentIndex + 1); if (e.key === "Escape") onClose(); }}
        autoFocus
      />
      <span className="whitespace-nowrap text-xs text-zinc-500">
        {matches.length > 0 ? `${currentIndex + 1}/${matches.length}` : "0/0"}
      </span>
      <div className="flex gap-0.5">
        <MenuButton onClick={() => goTo(currentIndex - 1)} title="Previous match">
          <ChevronDown className="h-3.5 w-3.5 rotate-90" />
        </MenuButton>
        <MenuButton onClick={() => goTo(currentIndex + 1)} title="Next match">
          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
        </MenuButton>
      </div>
      <ToolbarDivider />
      {!replaceMode ? (
        <button
          onClick={() => setReplaceMode(true)}
          className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Replace
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="Replace with..."
            className="w-32 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            onKeyDown={(e) => { if (e.key === "Enter") replace(); }}
          />
          <button onClick={replace} className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900">Replace</button>
          <button onClick={replaceAll} className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">All</button>
        </div>
      )}
      <MenuButton onClick={onClose} title="Close find">
        <Trash2 className="h-3.5 w-3.5" />
      </MenuButton>
    </div>
  );
}

function EditorFooter({ editor }: { editor: import('@tiptap/react').Editor }) {
  const [stats, setStats] = useState({ words: 0, chars: 0, paragraphs: 0 });

  useEffect(() => {
    const update = () => {
      const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, " ", " ");
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      let paragraphs = 0;
      editor.state.doc.descendants((node) => {
        if (node.type.name === "paragraph") paragraphs++;
      });
      setStats({ words, chars, paragraphs });
    };
    update();
    editor.on("update", update);
    return () => { editor.off("update", update); };
  }, [editor]);

  const readTime = Math.max(1, Math.round(stats.words / 200));

  return (
    <div className="flex items-center justify-end gap-4 border-t border-zinc-200 px-4 py-1.5 text-xs text-zinc-400 dark:border-zinc-800">
      <span>{stats.words} words</span>
      <span>{stats.chars} characters</span>
      <span>{stats.paragraphs} paragraphs</span>
      <span>{readTime} min read</span>
    </div>
  );
}

function TableOfContents({ editor }: { editor: import('@tiptap/react').Editor }) {
  const [headings, setHeadings] = useState<{ level: number; text: string; pos: number }[]>([]);

  useEffect(() => {
    const update = () => {
      const items: { level: number; text: string; pos: number }[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const level = node.attrs.level as number;
          const text = node.textContent;
          items.push({ level, text, pos });
        }
      });
      setHeadings(items);
    };
    update();
    editor.on("update", update);
    return () => { editor.off("update", update); };
  }, [editor]);

  if (headings.length === 0) return null;

  return (
    <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="flex items-center gap-2 mb-2">
        <ListTree className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-500">Table of Contents</span>
      </div>
      <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {headings.map((h, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              editor.chain().focus().setTextSelection(h.pos).scrollIntoView().run();
            }}
            className="block w-full truncate rounded px-2 py-0.5 text-left text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            style={{ paddingLeft: `${0.5 + (h.level - 1) * 0.75}rem` }}
          >
            {h.text || "Empty heading"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editorRef: externalEditorRef,
}: RichTextEditorProps) {

  const [imageUploading, setImageUploading] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [htmlInput, setHtmlInput] = useState(content);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showImagePopover, setShowImagePopover] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [dirty, setDirty] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const { startUpload } = useUploadThing("blogEditorImage");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: false,
      }),
      UnderlineExtension,
      TextStyle,
      Color,
      HighlightExtension.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      HorizontalRule,
      ImageExtension.extend({
        addAttributes() {
          return {
            src: { default: null },
            alt: { default: null },
            title: { default: null },
            width: { default: null },
            caption: { default: "" },
            float: { default: null },
          };
        },
        renderHTML({ node, HTMLAttributes }) {
          const hasCaption = node.attrs.caption;
          const style = [
            HTMLAttributes.width ? `width: ${HTMLAttributes.width}` : "",
            HTMLAttributes.float ? `float: ${HTMLAttributes.float}; margin-${HTMLAttributes.float === "left" ? "right" : "left"}: 1rem` : "",
          ].filter(Boolean).join("; ");
          if (hasCaption) {
            return [
              "figure",
              { class: `image-caption-wrapper${node.attrs.float ? ` float-${node.attrs.float}` : ""}`, style: HTMLAttributes.float ? `float: ${HTMLAttributes.float}; margin-${HTMLAttributes.float === "left" ? "right" : "left"}: 1rem` : undefined },
              ["img", { ...HTMLAttributes, style: HTMLAttributes.float ? undefined : style || undefined }],
              ["figcaption", {}, node.attrs.caption],
            ];
          }
          const attrs: Record<string, string> = { src: HTMLAttributes.src };
          if (HTMLAttributes.alt) attrs.alt = HTMLAttributes.alt;
          if (HTMLAttributes.title) attrs.title = HTMLAttributes.title;
          if (style) attrs.style = style;
          return ["img", attrs];
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline hover:text-blue-800 dark:text-blue-400 cursor-pointer" },
      }),
      Placeholder.configure({ placeholder }),
      CodeBlockLowlight.configure({ lowlight }).extend({
        renderHTML({ node, HTMLAttributes }) {
          const language = node.attrs.language || "";
          const preAttrs: Record<string, string> = {};
          if (language) preAttrs["data-language"] = language;
          return [
            "pre",
            mergeAttributes(HTMLAttributes, preAttrs),
            ["code", { class: language ? `language-${language}` : undefined }, 0],
          ];
        },
      }),
      Youtube.configure({ width: 640, height: 360, controls: true }),
      Subscript,
      Superscript,
      Typography,
      ImageGrid,
      ImageGridCell,
      TwitterEmbed,
      InstagramEmbed,
      CodePenEmbed,
      DragHandle,
      LinkPreview,
      Details,
      DetailsSummary,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      setDirty(true);
    },
    onCreate: ({ editor }) => {
      handleSlashCommand(editor);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc max-w-none focus:outline-none min-h-[400px] px-4 py-4 dark:prose-invert prose-headings:text-zinc-900 prose-p:text-zinc-700 prose-a:text-blue-600 prose-strong:text-zinc-900 prose-code:text-pink-600 prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-pre:rounded-lg prose-img:rounded-lg dark:prose-headings:text-white dark:prose-p:text-zinc-300 dark:prose-strong:text-white",
      },
    },
    immediatelyRender: false,
  });

  const handleSlashCommand = useCallback((editor: import('@tiptap/react').Editor) => {
    editor.on("selectionUpdate", ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) return;
      const text = editor.state.doc.textBetween(Math.max(0, from - 1), from);
      if (text === "/") {
        setShowSlashMenu(true);
      } else if (text[0] !== "/") {
        setShowSlashMenu(false);
      }
    });
  }, []);

  useEffect(() => {
    if (externalEditorRef && editor) {
      externalEditorRef.current = editor;
    }
  }, [editor, externalEditorRef]);

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
      startTransition(() => {
        setDirty(false);
      });
    }
  }, [content, editor]);

  const addImage = useCallback(async (multiple = false) => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = multiple;
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (files.length === 0) return;
      setImageUploading(true);
      try {
        for (const file of files) {
          const res = await startUpload([file]);
          const src = res?.[0]?.ufsUrl || res?.[0]?.url;
          if (src) {
            editor.chain().focus().setImage({ src }).run();
          }
        }
      } catch (err) {
        console.error("Failed to upload image:", err);
      } finally {
        setImageUploading(false);
      }
    };
    input.click();
  }, [editor, startUpload]);

  const addDetails = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setDetails().run();
  }, [editor]);

  const exportMarkdown = useCallback(async () => {
    if (!editor) return;
    const TurndownService = (await import("turndown")).default;
    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
    });
    turndownService.addRule("details", {
      filter: "details",
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Turndown callback type
      replacement: (_content: string, node: any) => {
        const summary = node.querySelector("summary") as HTMLElement | null;
        const summaryText = summary?.textContent || "";
        const inner = node.innerHTML.replace(/<\/?summary[^>]*>/g, "");
        return `<details>\n<summary>${summaryText}</summary>\n\n${turndownService.turndown(inner)}\n</details>\n\n`;
      },
    });
    turndownService.addRule("figure", {
      filter: "figure",
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Turndown callback type
      replacement: (_content: string, node: any) => {
        const img = node.querySelector("img") as HTMLImageElement | null;
        const figcaption = node.querySelector("figcaption") as HTMLElement | null;
        let md = `![${img?.alt || ""}](${img?.src || ""})`;
        if (figcaption?.textContent) md += `\n*${figcaption.textContent}*`;
        return md + "\n\n";
      },
    });
    const markdown = turndownService.turndown(editor.getHTML());
    navigator.clipboard.writeText(markdown).then(() => {
      const el = document.createElement("div");
      el.textContent = "Markdown copied to clipboard!";
      el.className = "fixed bottom-4 right-4 z-[9999] rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-white dark:text-zinc-900";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    });
  }, [editor]);

  const addYoutube = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter YouTube URL");
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  }, [editor]);

  const addEmbed = useCallback((provider: "twitter" | "instagram" | "codepen") => {
    if (!editor) return;
    const url = window.prompt(`Enter ${provider === "twitter" ? "X (Twitter)" : provider.charAt(0).toUpperCase() + provider.slice(1)} URL`);
    if (!url) return;
    const detected = detectEmbedProvider(url);
    if (!detected) {
      window.alert("Could not recognize the URL. Make sure it's a valid Twitter/X, Instagram, or CodePen URL.");
      return;
    }
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Function return type
    const cmds: Record<string, (src: string) => any> = {
      twitter: (s: string) => editor.chain().focus().insertTwitterEmbed(s).run(),
      instagram: (s: string) => editor.chain().focus().insertInstagramEmbed(s).run(),
      codepen: (s: string) => editor.chain().focus().insertCodePenEmbed(s).run(),
    };
    cmds[provider]?.(url);
  }, [editor]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        setImageUploading(true);
        startUpload([file])
          .then((res) => {
            const src = res?.[0]?.ufsUrl || res?.[0]?.url;
            if (src && editor) {
              editor.chain().focus().setImage({ src }).run();
            }
          })
          .finally(() => setImageUploading(false));
        break;
      }
    }
  }, [editor, startUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/") || !editor) return;
    setImageUploading(true);
    startUpload([file]).then((res) => {
      if (res?.[0]?.ufsUrl) {
        editor.chain().focus().setImage({ src: res[0].ufsUrl }).run();
      } else if (res?.[0]?.url) {
        editor.chain().focus().setImage({ src: res[0].url }).run();
      }
    }).finally(() => setImageUploading(false));
  }, [editor, startUpload]);

  const handleEditorClick = useCallback(() => {
    if (!editor) return;
    if (editor.isActive("link")) {
      setShowLinkPopover(true);
    } else {
      setShowLinkPopover(false);
    }
    if (editor.isActive("image")) {
      setShowImagePopover(true);
    } else {
      setShowImagePopover(false);
    }
    setShowColorPicker(false);
    setShowHighlightPicker(false);
    setShowEmojiPicker(false);
  }, [editor]);

  const clearFormatting = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  }, [editor]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        setShowFindReplace((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        isFullscreen && "fixed inset-0 z-[100] rounded-none",
        focusMode && "focus-mode"
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-zinc-200 px-3 py-2 scrollbar-none dark:border-zinc-800 [&::-webkit-scrollbar]:hidden">
        <Dropdown trigger={<Type className="h-4 w-4" />}>
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800", editor.isActive("paragraph") && "bg-zinc-100 dark:bg-zinc-800")}
          >
            <Pilcrow className="h-4 w-4 text-zinc-500" /> Paragraph
          </button>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()}
              className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800", editor.isActive("heading", { level }) && "bg-zinc-100 dark:bg-zinc-800")}
            >
              <LetterText className="h-4 w-4 text-zinc-500" /> Heading {level}
            </button>
          ))}
        </Dropdown>

        <ToolbarDivider />

        <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
          <Underline className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
          <Code className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript">
          <SubscriptIcon className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript">
          <SuperscriptIcon className="h-4 w-4" />
        </MenuButton>

        <ToolbarDivider />

        <div className="relative">
          <MenuButton onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }} title="Text color">
            <Palette className="h-4 w-4" />
          </MenuButton>
          {showColorPicker && (
            <div className="absolute left-0 top-full z-50 mt-1 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <ColorPicker
                label="Text Color"
                colors={COLORS}
                current={editor.getAttributes("textStyle").color}
                onSelect={(c) => { editor.chain().focus().setColor(c || "").run(); setShowColorPicker(false); }}
              />
            </div>
          )}
        </div>

        <div className="relative">
          <MenuButton onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }} active={editor.isActive("highlight")} title="Highlight">
            <Highlighter className="h-4 w-4" />
          </MenuButton>
          {showHighlightPicker && (
            <div className="absolute left-0 top-full z-50 mt-1 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <ColorPicker
                label="Highlight Color"
                colors={HIGHLIGHTS}
                current={editor.getAttributes("highlight").color}
                onSelect={(c) => { if (c) editor.chain().focus().toggleHighlight({ color: c }).run(); else editor.chain().focus().toggleHighlight().run(); setShowHighlightPicker(false); }}
              />
            </div>
          )}
        </div>

        <ToolbarDivider />

        <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">
          <ListOrdered className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Checklist">
          <ListChecks className="h-4 w-4" />
        </MenuButton>

        <ToolbarDivider />

        <MenuButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
          <AlignLeft className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
          <AlignCenter className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
          <AlignRight className="h-4 w-4" />
        </MenuButton>

        <ToolbarDivider />

        <div className="relative">
          <MenuButton onClick={() => setShowMediaBrowser(!showMediaBrowser)} title="Media library">
            <Monitor className="h-4 w-4" />
          </MenuButton>
        </div>
        <Dropdown
          trigger={
            imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" /> // eslint-disable-line jsx-a11y/alt-text
          }
        >
          <button
            type="button"
            onClick={() => addImage(false)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {/* eslint-disable-next-line jsx-a11y/alt-text -- lucide-react SVG icon */}
            <Image className="h-4 w-4 text-zinc-500" /> Single image
          </button>
          <button
            type="button"
            onClick={() => addImage(true)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {/* eslint-disable-next-line jsx-a11y/alt-text -- lucide-react SVG icon */}
            <Image className="h-4 w-4 text-zinc-500" /> Multiple images
          </button>
        </Dropdown>
        <div className="relative">
          <MenuButton onClick={() => { setShowLinkPopover(!showLinkPopover); }} active={editor.isActive("link")} title="Add link">
            <Link className="h-4 w-4" />
          </MenuButton>
          {showLinkPopover && <LinkPopover editor={editor} onClose={() => setShowLinkPopover(false)} />}
        </div>
        <MenuButton onClick={addYoutube} title="Embed YouTube">
          <Video className="h-4 w-4" />
        </MenuButton>
        <Dropdown trigger={<Video className="h-4 w-4" />} align="right">
          <button
            type="button"
            onClick={() => addEmbed("twitter")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <span className="text-base">𝕏</span> X (Twitter)
          </button>
          <button
            type="button"
            onClick={() => addEmbed("instagram")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <span className="text-base">📷</span> Instagram
          </button>
          <button
            type="button"
            onClick={() => addEmbed("codepen")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <span className="text-base">🖊</span> CodePen
          </button>
        </Dropdown>
        <Dropdown trigger={<TableIcon className="h-4 w-4" />} align="right">
          <TableMenu editor={editor} />
        </Dropdown>
        <Dropdown trigger={<LayoutGrid className="h-4 w-4" />} align="right">
          <button
            type="button"
            onClick={() => editor.chain().focus().insertImageGrid(2).run()}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <LayoutGrid className="h-4 w-4 text-zinc-500" /> 2 Columns
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().insertImageGrid(3).run()}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <LayoutGrid className="h-4 w-4 text-zinc-500" /> 3 Columns
          </button>
        </Dropdown>
        <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <Quote className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={addDetails} title="Details / Collapsible">
          <ChevronDown className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
          <Code className="h-4 w-4" />
        </MenuButton>
        {editor.isActive("codeBlock") && (
          <Dropdown trigger={<span className="text-xs font-medium">{editor.getAttributes("codeBlock").language || "Auto"}</span>}>
            {CODE_BLOCK_LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => editor.chain().focus().updateAttributes("codeBlock", { language: lang.value || null }).run()}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  editor.getAttributes("codeBlock").language === lang.value && "bg-zinc-100 dark:bg-zinc-800"
                )}
              >
                {lang.label}
              </button>
            ))}
          </Dropdown>
        )}
        <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="h-4 w-4" />
        </MenuButton>

        <ToolbarDivider />

        <MenuButton onClick={clearFormatting} title="Clear formatting">
          <RemoveFormatting className="h-4 w-4" />
        </MenuButton>

        <div className="relative">
          <MenuButton onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji">
            <StickyNote className="h-4 w-4" />
          </MenuButton>
          {showEmojiPicker && <EmojiPicker editor={editor} onClose={() => setShowEmojiPicker(false)} />}
        </div>

        <ToolbarDivider />

        <MenuButton onClick={() => setShowFindReplace(!showFindReplace)} active={showFindReplace} title="Find & replace (Ctrl+Shift+F)">
          <Search className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
          <Undo className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Shift+Z)">
          <Redo className="h-4 w-4" />
        </MenuButton>

        <ToolbarDivider />

        <MenuButton onClick={() => setShowShortcuts(!showShortcuts)} title="Keyboard shortcuts">
          <Keyboard className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => setFocusMode(!focusMode)} active={focusMode} title="Focus mode">
          <Focus className="h-4 w-4" />
        </MenuButton>
        {!codeMode && (
          <MenuButton onClick={() => setShowToc(!showToc)} active={showToc} title="Table of contents">
            <ListTree className="h-4 w-4" />
          </MenuButton>
        )}
        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-400">
          {dirty && <CloudOff className="h-3 w-3 text-amber-500" />}
          {!dirty && <Cloud className="h-3 w-3 text-emerald-500" />}
          <span className="hidden sm:inline">{dirty ? "Unsaved" : "Saved"}</span>
        </div>
        <MenuButton onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </MenuButton>
        <MenuButton onClick={() => {
          if (codeMode) { onChange(htmlInput); if (editor) editor.commands.setContent(htmlInput); }
          else setHtmlInput(editor.getHTML());
          setCodeMode(!codeMode);
        }} active={codeMode} title="Toggle code view">
          <FileCode className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={exportMarkdown} title="Export as Markdown">
          <span className="text-xs font-bold">MD</span>
        </MenuButton>
      </div>

      {/* Find & Replace */}
      {showFindReplace && <FindReplace editor={editor} onClose={() => setShowFindReplace(false)} />}

      {/* Table of Contents */}
      {showToc && !codeMode && <TableOfContents editor={editor} />}

      {/* Slash command menu + Editor */}
      <div className="relative">
        <SlashMenu editor={editor} open={showSlashMenu} onClose={() => setShowSlashMenu(false)} onUploadImage={addImage} />

        <div
          ref={editorContainerRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={handleEditorClick}
          onPaste={handlePaste}
        >
          {codeMode ? (
            <textarea
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              className="w-full min-h-[400px] bg-zinc-950 p-4 font-mono text-sm text-zinc-100 focus:outline-none"
              spellCheck={false}
            />
          ) : (
            <div onClick={() => { setShowImagePopover(false); setShowLinkPopover(false); }}>
              <EditorContent editor={editor} />
              <ImageResizer editor={editor} />
            </div>
          )}
        </div>

        {/* Image popover */}
        {showImagePopover && !codeMode && (
          <div className="relative" style={{ display: editor.isActive("image") ? "block" : "none" }}>
            <ImagePopover editor={editor} onClose={() => setShowImagePopover(false)} />
          </div>
        )}
      </div>

      {/* Footer */}
      {!codeMode && <EditorFooter editor={editor} />}

      {/* Media browser modal */}
      {showMediaBrowser && (
        <MediaBrowser
          onSelect={(url) => {
            if (editor) editor.chain().focus().setImage({ src: url }).run();
            setShowMediaBrowser(false);
          }}
          onClose={() => setShowMediaBrowser(false)}
        />
      )}

      {/* Shortcuts modal */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
