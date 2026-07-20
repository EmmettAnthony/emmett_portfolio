"use client";

import { motion } from "framer-motion";
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

interface FieldWrapperProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FieldWrapper({ label, error, required, children, className }: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      </div>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500"
          role="alert"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Text Input ──────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-blue-500",
          "dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500",
          error
            ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
            : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600",
          className
        )}
        {...props}
      />
    );
  }
);
FormInput.displayName = "FormInput";

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, placeholder = "Select an option", ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 transition-all appearance-none",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-blue-500",
            "dark:bg-zinc-900 dark:text-white",
            error
              ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
              : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600",
            !props.value && "text-zinc-400 dark:text-zinc-500",
            className
          )}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);
FormSelect.displayName = "FormSelect";

// ─── Textarea ────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all resize-none",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-blue-500",
          "dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500",
          error
            ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
            : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600",
          className
        )}
        {...props}
      />
    );
  }
);
FormTextarea.displayName = "FormTextarea";

// ─── File Upload ─────────────────────────────────────────────────────────────

interface FileUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  accept?: string;
}

export function FormFileUpload({ value, onChange, error, accept = ".pdf,.docx,.png,.jpg,.jpeg" }: FileUploadProps) {
  const t = useTranslations("contact.form");
  return (
    <div>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all cursor-pointer",
          "hover:border-blue-500/50 hover:bg-blue-50/50",
          "dark:hover:border-blue-400/50 dark:hover:bg-blue-900/10",
          error
            ? "border-red-500 bg-red-50/50 dark:bg-red-900/10"
            : value
              ? "border-green-500 bg-green-50/50 dark:bg-green-900/10"
              : "border-zinc-300 dark:border-zinc-700"
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            onChange(file);
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={t("attachFile")}
        />
        {value ? (
          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mt-2 text-sm font-medium text-green-700 dark:text-green-400">{value.name}</p>
            <p className="text-xs text-zinc-500">Click to replace</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="mt-2 text-sm font-medium text-muted-foreground dark:text-zinc-400">
              Drop a file or click to browse
            </p>
            <p className="text-xs text-zinc-500">PDF, DOCX, PNG, JPG up to 10MB</p>
          </div>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-red-500"
          role="alert"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
