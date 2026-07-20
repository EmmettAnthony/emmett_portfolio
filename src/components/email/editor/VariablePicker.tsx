"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Copy, Check, Code, Variable } from "lucide-react";

export interface EmailVariable {
  key: string;
  label: string;
  category: string;
  description: string;
  example: string;
}

const EMAIL_VARIABLES: EmailVariable[] = [
  // Contact / Subscriber variables
  { key: "{{first_name}}", label: "First Name", category: "Contact", description: "Subscriber's first name", example: "John" },
  { key: "{{last_name}}", label: "Last Name", category: "Contact", description: "Subscriber's last name", example: "Doe" },
  { key: "{{full_name}}", label: "Full Name", category: "Contact", description: "Subscriber's full name", example: "John Doe" },
  { key: "{{email}}", label: "Email", category: "Contact", description: "Subscriber's email address", example: "john@example.com" },
  { key: "{{phone}}", label: "Phone", category: "Contact", description: "Subscriber's phone number", example: "+1-555-0123" },
  { key: "{{company}}", label: "Company", category: "Contact", description: "Subscriber's company name", example: "Acme Inc." },
  { key: "{{country}}", label: "Country", category: "Contact", description: "Subscriber's country", example: "United States" },
  { key: "{{website}}", label: "Website", category: "Contact", description: "Subscriber's website URL", example: "https://example.com" },
  { key: "{{tags}}", label: "Tags", category: "Contact", description: "Subscriber's tags (comma-separated)", example: "developer, vip" },

  // Booking variables
  { key: "{{booking_date}}", label: "Booking Date", category: "Booking", description: "Date of the booking", example: "March 15, 2026" },
  { key: "{{booking_time}}", label: "Booking Time", category: "Booking", description: "Time of the booking", example: "2:00 PM" },
  { key: "{{meeting_link}}", label: "Meeting Link", category: "Booking", description: "Meeting URL/video link", example: "https://meet.google.com/xyz" },
  { key: "{{meeting_type}}", label: "Meeting Type", category: "Booking", description: "Type of meeting", example: "Consultation Call" },

  // Invoice / Payment variables
  { key: "{{invoice_number}}", label: "Invoice Number", category: "Billing", description: "Invoice reference number", example: "INV-2026-0001" },
  { key: "{{amount}}", label: "Amount", category: "Billing", description: "Monetary amount", example: "$1,500.00" },
  { key: "{{currency}}", label: "Currency", category: "Billing", description: "Currency code", example: "USD" },
  { key: "{{payment_date}}", label: "Payment Date", category: "Billing", description: "Date payment was received", example: "March 10, 2026" },
  { key: "{{payment_method}}", label: "Payment Method", category: "Billing", description: "Payment method used", example: "Credit Card" },

  // Project variables
  { key: "{{project_name}}", label: "Project Name", category: "Project", description: "Client project name", example: "Website Redesign" },
  { key: "{{project_status}}", label: "Project Status", category: "Project", description: "Project status", example: "In Progress" },
  { key: "{{project_deadline}}", label: "Project Deadline", category: "Project", description: "Project due date", example: "April 30, 2026" },

  // Admin / System variables
  { key: "{{unsubscribe_url}}", label: "Unsubscribe URL", category: "System", description: "One-click unsubscribe link", example: "https://..." },
  { key: "{{preferences_url}}", label: "Preferences URL", category: "System", description: "Manage email preferences link", example: "https://..." },
  { key: "{{current_year}}", label: "Current Year", category: "System", description: "Current year (YYYY)", example: "2026" },
  { key: "{{site_name}}", label: "Site Name", category: "System", description: "Your website name", example: "Emmett Anthony" },
  { key: "{{site_url}}", label: "Site URL", category: "System", description: "Your website URL", example: "https://emmettanthony.dev" },
];

interface VariablePickerProps {
  onInsert: (variable: string) => void;
  className?: string;
}

export default function VariablePicker({ onInsert, className }: VariablePickerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const categories = Array.from(new Set(EMAIL_VARIABLES.map((v) => v.category)));
  const filtered = EMAIL_VARIABLES.filter((v) => {
    const matchesSearch =
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.key.toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || v.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (variable: EmailVariable) => {
    navigator.clipboard.writeText(variable.key);
    setCopiedKey(variable.key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search variables..."
          className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setCategoryFilter("all")}
          className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
            categoryFilter === "all"
              ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
              categoryFilter === cat
                ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Variables list */}
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-zinc-400">No variables found</p>
        ) : (
          filtered.map((variable) => (
            <div
              key={variable.key}
              className="group flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Variable className="h-3 w-3 text-brand-500 shrink-0" />
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {variable.label}
                  </span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                    {variable.category}
                  </span>
                </div>
                <code className="mt-0.5 block truncate font-mono text-[10px] text-brand-600 dark:text-brand-400">
                  {variable.key}
                </code>
              </div>
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => onInsert(variable.key)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-brand-100 hover:text-brand-600 dark:hover:bg-brand-900/30"
                  title="Insert variable"
                >
                  <Code className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleCopy(variable)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700"
                  title="Copy to clipboard"
                >
                  {copiedKey === variable.key ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[10px] text-zinc-400">
        Click the <Code className="inline h-2.5 w-2.5" /> icon to insert a variable at the cursor position, or <Copy className="inline h-2.5 w-2.5" /> to copy.
      </p>
    </div>
  );
}
