"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  ArrowRight,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

interface CsvRow {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  country?: string;
  valid?: boolean;
  [key: string]: string | undefined | boolean;
}

interface CsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  listId: string;
  lists: { id: string; name: string }[];
  onImport: (data: { csvData: string; listId: string; updateExisting: boolean }) => Promise<Record<string, unknown>>;
  /** When false, hides the "Target List" selector (e.g. for subscriber import) */
  showListSelector?: boolean;
}

export default function CsvImportDialog({
  open,
  onClose,
  listId,
  lists,
  onImport,
  showListSelector = true,
}: CsvImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);
  const [selectedListId, setSelectedListId] = useState(listId || "");
  const [updateExisting, setUpdateExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<Record<string, unknown> | null>(null);

  const validCount = useMemo(() => parsedRows.filter((r) => r.valid !== false).length, [parsedRows]);
  const invalidCount = useMemo(() => parsedRows.filter((r) => r.valid === false).length, [parsedRows]);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!csvData) throw new Error("No CSV data");
      if (showListSelector && !selectedListId) throw new Error("Please select a target list");
      const result = await onImport({ csvData, listId: selectedListId, updateExisting });
      setImportResult(result as Record<string, unknown>);
      return result;
    },
    onSuccess: (result) => {
      const r = result as Record<string, unknown>;

      const wasPartial = (r.skipped as number || 0) > 0 || (r.totalErrors as number || 0) > 0;
      // Only auto-close if everything was processed without issues
      if (!wasPartial) {
        setTimeout(() => { reset(); onClose(); }, 1500);
      }
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Import failed"),
  });

  const reset = () => {
    setCsvData(null);
    setParsedRows([]);
    setError(null);
    setImportResult(null);
    setSelectedListId(listId || "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      setError("CSV must have a header row and at least one data row");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
    const emailIdx = headers.indexOf("email");
    if (emailIdx === -1) {
      setError("CSV must have an 'Email' column");
      return;
    }

    const rows: CsvRow[] = [];
    const firstNameIdx = headers.findIndex((h) => h === "firstname" || h === "first_name" || h === "first name");
    const lastNameIdx = headers.findIndex((h) => h === "lastname" || h === "last_name" || h === "last name");
    const companyIdx = headers.indexOf("company");
    const phoneIdx = headers.indexOf("phone");
    const countryIdx = headers.indexOf("country");

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      if (!cols[emailIdx]) continue;

      const email = cols[emailIdx];
      const row: CsvRow = { email, valid: isValidEmail(email) };

      if (firstNameIdx !== -1) row.firstName = cols[firstNameIdx];
      if (lastNameIdx !== -1) row.lastName = cols[lastNameIdx];
      if (companyIdx !== -1) row.company = cols[companyIdx];
      if (phoneIdx !== -1) row.phone = cols[phoneIdx];
      if (countryIdx !== -1) row.country = cols[countryIdx];

      rows.push(row);
    }

    if (rows.length === 0) {
      setError("No rows found. Check that the CSV has an 'Email' column with data.");
      return;
    }

    setParsedRows(rows);
    setCsvData(text);
    setError(null);
    setImportResult(null);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a .csv file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  }, [parseCSV]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDownloadSample = () => {
    const sample = "Email,First Name,Last Name,Company,Phone,Country\njohn@example.com,John,Doe,Acme Inc,+1234567890,US\njane@example.com,Jane,Smith,Globex,+0987654321,UK";
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const isValid = (!showListSelector || selectedListId) && csvData && parsedRows.length > 0 && validCount > 0 && !error;

  // Import result display
  const result = importResult as Record<string, unknown> | null;
  const showResult = result && !importMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{showListSelector ? "Import Contacts via CSV" : "Import Subscribers via CSV"}</DialogTitle>
          <DialogDescription>
            Upload a CSV file to {showListSelector ? "bulk import contacts into a list" : "bulk import subscribers"}.
            Emails are validated before import — invalid rows are skipped.
          </DialogDescription>
        </DialogHeader>

        {!csvData ? (
          <div className="space-y-4">
            {/* List Selector */}
            {showListSelector && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Target List <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="">Select a list...</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all",
                dragOver
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600"
              )}
            >
              <Upload className={cn("mb-3 h-8 w-8", dragOver ? "text-brand-500" : "text-zinc-400")} />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Drop your CSV file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                File must have an &quot;Email&quot; column
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Sample Download */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                <Download className="h-3.5 w-3.5" />
                Download sample CSV template
              </button>
            </div>
          </div>
        ) : showResult ? (
          /* Import Result */
          <div className="space-y-4">
            <div className={cn(
              "rounded-xl border px-4 py-4",
              (result.skipped as number || 0) > 0 || (result.totalErrors as number || 0) > 0
                ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10"
                : "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10"
            )}>
              <div className="flex items-center gap-2 mb-3">
                {(result.skipped as number || 0) > 0 || (result.totalErrors as number || 0) > 0 ? (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                )}
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Import Complete
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-500">Imported:</span>
                  <span className="ml-2 font-medium text-emerald-600">{result.imported as number || 0}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Updated:</span>
                  <span className="ml-2 font-medium text-blue-600">{result.updated as number || 0}</span>
                </div>
                {(result.skipped as number || 0) > 0 && (
                  <div>
                    <span className="text-zinc-500">Skipped (invalid email):</span>
                    <span className="ml-2 font-medium text-amber-600">{result.skipped as number || 0}</span>
                  </div>
                )}
                {(result.totalErrors as number || 0) > 0 && (
                  <div>
                    <span className="text-zinc-500">DB errors:</span>
                    <span className="ml-2 font-medium text-red-600">{result.totalErrors as number || 0}</span>
                  </div>
                )}
              </div>

              {/* Validation error details */}
              {(result.validationErrors as string[] | undefined)?.length && (
                <div className="mt-3 max-h-32 overflow-y-auto rounded-lg bg-white/60 p-3 dark:bg-black/20">
                  <p className="mb-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    Skipped rows — invalid email format:
                  </p>
                  {(result.validationErrors as string[]).slice(0, 10).map((err: string, i: number) => (
                    <p key={i} className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">{err}</p>
                  ))}
                  {(result.totalValidationErrors as number || 0) > 10 && (
                    <p className="text-[11px] text-zinc-400 mt-1">
                      +{(result.totalValidationErrors as number) - 10} more
                    </p>
                  )}
                </div>
              )}

              {/* DB errors */}
              {(result.errors as string[] | undefined)?.length && (
                <div className="mt-3 max-h-24 overflow-y-auto rounded-lg bg-white/60 p-3 dark:bg-black/20">
                  <p className="mb-1.5 text-xs font-medium text-red-700 dark:text-red-400">
                    Database errors:
                  </p>
                  {(result.errors as string[]).slice(0, 5).map((err: string, i: number) => (
                    <p key={i} className="text-[11px] text-red-600 dark:text-red-400 font-mono">{err}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
              {(result.skipped as number || 0) > 0 && (
                <Button variant="outline" onClick={() => { setImportResult(null); }}>
                  Review &amp; Retry
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Preview */
          <div className="space-y-4">
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{
                backgroundColor: invalidCount > 0 ? "#fef3c7" : "rgb(236 253 245)",
                color: invalidCount > 0 ? "#92400e" : "#047857",
              }}
            >
              <div className="flex items-center gap-2">
                {invalidCount > 0 ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">
                  {validCount} valid{invalidCount > 0 ? `, ${invalidCount} invalid will be skipped` : ""}
                </span>
              </div>
              <button
                onClick={() => { setCsvData(null); setParsedRows([]); setError(null); setImportResult(null); }}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Validation Warning */}
            {invalidCount > 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {invalidCount} row{invalidCount !== 1 ? "s" : ""} with invalid email{invalidCount !== 1 ? "s" : ""} will be skipped.
                  Fix the email format in your CSV and re-upload to include them.
                </span>
              </div>
            )}

            {/* Preview Table */}
            <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">#</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">Email</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">First Name</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">Last Name</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">Company</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {parsedRows.slice(0, 50).map((row, i) => (
                    <tr key={i} className={cn(
                      "bg-white dark:bg-zinc-900 transition-colors",
                      row.valid === false && "bg-red-50 dark:bg-red-900/10"
                    )}>
                      <td className="px-3 py-1.5 text-zinc-400">{i + 1}</td>
                      <td className={cn(
                        "px-3 py-1.5 font-medium",
                        row.valid === false ? "text-red-500" : "text-zinc-700 dark:text-zinc-300"
                      )}>
                        {row.email}
                        {row.valid === false && (
                          <span className="ml-1.5 text-[9px] text-red-400 font-normal">invalid</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-zinc-500">{row.firstName || "—"}</td>
                      <td className="px-3 py-1.5 text-zinc-500">{row.lastName || "—"}</td>
                      <td className="px-3 py-1.5 text-zinc-500">{row.company || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 50 && (
                <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
                  +{parsedRows.length - 50} more rows
                </div>
              )}
            </div>

            {/* Options */}
            <label className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Update existing contacts</p>
                <p className="text-xs text-zinc-400">If a contact already exists, update their information</p>
              </div>
            </label>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions (only show in upload/preview phase, not result phase) */}
        {!showResult && (
          <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <Button variant="outline" onClick={handleClose} disabled={importMutation.isPending}>
              Cancel
            </Button>
            {csvData && (
              <Button
                onClick={() => importMutation.mutate()}
                disabled={!isValid || importMutation.isPending}
                className="gap-2"
              >
                {importMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {importMutation.isPending
                  ? `Importing ${validCount} ${showListSelector ? "contacts" : "subscribers"}...`
                  : `Import ${validCount} ${showListSelector ? "Contacts" : "Subscribers"}${invalidCount > 0 ? ` (${invalidCount} invalid skipped)` : ""}`}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
