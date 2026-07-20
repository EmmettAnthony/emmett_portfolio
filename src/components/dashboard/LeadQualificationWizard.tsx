"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  FileText,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  Loader2,
  Building2,
  Globe,
  Phone,
  DollarSign,
  Clock,
  Target,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useFormFieldOptions } from "@/lib/hooks/useFormFieldOptions";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WizardData {
  // Step 1: Contact
  fullName: string;
  email: string;
  phone: string;
  company: string;
  // Step 2: Project Scope
  projectType: string;
  budget: string;
  timeline: string;
  hasExistingWebsite: string;
  existingWebsiteUrl: string;
  // Step 3: Project Details
  projectDetails: string;
  projectGoals: string;
  referralSource: string;
  preferredContactMethod: string;
}

const initialData: WizardData = {
  fullName: "", email: "", phone: "", company: "",
  projectType: "", budget: "", timeline: "",
  hasExistingWebsite: "", existingWebsiteUrl: "",
  projectDetails: "", projectGoals: "", referralSource: "", preferredContactMethod: "",
};

// ─── Lead Score Calculator ──────────────────────────────────────────────────

function calculateLeadScore(data: WizardData, projectTypes: { value: string; label: string }[]): { score: number; factors: { label: string; points: number }[] } {
  const factors: { label: string; points: number }[] = [];
  let score = 0;

  // Contact completeness
  if (data.fullName.trim()) { score += 10; factors.push({ label: "Full name provided", points: 10 }); }
  if (data.email.trim()) { score += 15; factors.push({ label: "Email provided", points: 15 }); }
  if (data.phone.trim()) { score += 10; factors.push({ label: "Phone provided", points: 10 }); }
  if (data.company.trim()) { score += 10; factors.push({ label: "Company provided", points: 10 }); }

  // Project specificity
  if (data.projectType) {
    const typePoints = data.projectType === "other" ? 5 : 15;
    score += typePoints;
    factors.push({ label: `Project type: ${projectTypes.find((t) => t.value === data.projectType)?.label || data.projectType}`, points: typePoints });
  }
  if (data.budget && data.budget !== "not_sure") {
    score += 15;
    factors.push({ label: `Budget range specified`, points: 15 });
  }
  if (data.timeline && data.timeline !== "not_sure") {
    score += 10;
    factors.push({ label: `Timeline specified`, points: 10 });
  }

  // Project details depth
  if (data.projectDetails.trim().length >= 20) { score += 10; factors.push({ label: "Detailed project description", points: 10 }); }
  if (data.projectGoals.trim().length >= 20) { score += 10; factors.push({ label: "Project goals defined", points: 10 }); }

  // Bonus for completeness
  const filledFields = Object.entries(data).filter(([, v]) => v && v.trim()).length;
  if (filledFields >= 10) { score += 10; factors.push({ label: "High completeness bonus", points: 10 }); }

  return { score: Math.min(score, 100), factors };
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
  if (score >= 40) return "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
  return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "Hot Lead";
  if (score >= 40) return "Warm Lead";
  return "Cold Lead";
}

// ─── Steps Configuration ────────────────────────────────────────────────────

const STEPS: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { id: "contact", label: "Contact Info", icon: User, description: "Who is reaching out?" },
  { id: "scope", label: "Project Scope", icon: Target, description: "What kind of project?" },
  { id: "details", label: "Project Details", icon: FileText, description: "Tell us more" },
  { id: "review", label: "Review & Submit", icon: CheckCircle, description: "Review and qualify" },
] as const;




function ContactInfoStep({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input type="text" value={data.fullName} onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="e.g. John Smith"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email <span className="text-red-500">*</span>
          </label>
          <input type="email" value={data.email} onChange={(e) => onChange({ email: e.target.value })}
            placeholder="e.g. john@company.com"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone</label>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input type="tel" value={data.phone} onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="+1 555-0123"
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Company</label>
          <div className="relative mt-1">
            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input type="text" value={data.company} onChange={(e) => onChange({ company: e.target.value })}
              placeholder="Acme Inc."
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Project Scope ──────────────────────────────────────────────────

function ProjectScopeStep({ data, onChange, projectTypes, budgetRanges, timelineOptions }: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  projectTypes: { value: string; label: string }[];
  budgetRanges: { value: string; label: string }[];
  timelineOptions: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Project Type <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {projectTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange({ projectType: type.value })}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                data.projectType === type.value
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              )}
            >
              <div className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                data.projectType === type.value ? "border-blue-500 bg-blue-500" : "border-zinc-300 dark:border-zinc-600"
              )}>
                {data.projectType === type.value && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Budget Range</label>
          <div className="relative mt-1">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <select value={data.budget} onChange={(e) => onChange({ budget: e.target.value })}
              className="w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
              <option value="">Select budget range...</option>
              {budgetRanges.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Timeline</label>
          <div className="relative mt-1">
            <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <select value={data.timeline} onChange={(e) => onChange({ timeline: e.target.value })}
              className="w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
              <option value="">Select timeline...</option>
              {timelineOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Existing Website?</label>
        <div className="mt-1.5 flex gap-3">
          {["yes", "no"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ hasExistingWebsite: opt, existingWebsiteUrl: opt === "no" ? "" : data.existingWebsiteUrl })}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                data.hasExistingWebsite === opt
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
              )}
            >
              {opt === "yes" ? "Yes, I have one" : "No, new project"}
            </button>
          ))}
        </div>
        {data.hasExistingWebsite === "yes" && (
          <div className="relative mt-2">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input type="url" value={data.existingWebsiteUrl} onChange={(e) => onChange({ existingWebsiteUrl: e.target.value })}
              placeholder="https://current-site.com"
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Project Details ────────────────────────────────────────────────

function ProjectDetailsStep({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Project Description <span className="text-red-500">*</span>
        </label>
        <textarea value={data.projectDetails} onChange={(e) => onChange({ projectDetails: e.target.value })}
          rows={4} placeholder="Describe your project in detail — what you need, what problem you're solving..."
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
        <p className="mt-1 text-xs text-zinc-500">{data.projectDetails.length} characters</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Project Goals</label>
        <textarea value={data.projectGoals} onChange={(e) => onChange({ projectGoals: e.target.value })}
          rows={3} placeholder="What are the key goals and success criteria? e.g., increase sales by 30%, automate manual processes..."
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Preferred Contact Method</label>
          <select value={data.preferredContactMethod} onChange={(e) => onChange({ preferredContactMethod: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
            <option value="">Any method</option>
            <option value="email">Email</option>
            <option value="phone">Phone Call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="zoom">Video Call (Zoom/Meet)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">How did you hear about us?</label>
          <select value={data.referralSource} onChange={(e) => onChange({ referralSource: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
            <option value="">Select source...</option>
            <option value="search">Search Engine</option>
            <option value="social">Social Media</option>
            <option value="referral">Referral</option>
            <option value="portfolio">Portfolio</option>
            <option value="blog">Blog</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Review & Score ─────────────────────────────────────────────────

function ReviewStep({ data, onEditStep, projectTypes, budgetRanges, timelineOptions }: {
  data: WizardData;
  onEditStep: (step: number) => void;
  projectTypes: { value: string; label: string }[];
  budgetRanges: { value: string; label: string }[];
  timelineOptions: { value: string; label: string }[];
}) {
  const { score, factors } = calculateLeadScore(data, projectTypes);

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-6 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Lead Score</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={cn("text-4xl font-bold", score >= 70 ? "text-green-600 dark:text-green-400" : score >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                {score}
              </span>
              <span className="text-lg text-zinc-400">/ 100</span>
            </div>
          </div>
          <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", getScoreColor(score))}>
            <Sparkles className="h-3 w-3" />
            {getScoreLabel(score)}
          </div>
        </div>
        {/* Score Bar */}
        <div className="mt-4 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              score >= 70 ? "bg-green-500" : score >= 40 ? "bg-amber-500" : "bg-red-500"
            )}
            style={{ width: `${score}%` }}
          />
        </div>
        {/* Factors */}
        <div className="mt-4 space-y-1.5">
          {factors.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">{f.label}</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">+{f.points}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Sections */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SectionSummary title="Contact Information" data={data} fields={["fullName", "email", "phone", "company"]} labels={{ fullName: "Name", email: "Email", phone: "Phone", company: "Company" }} onEdit={() => onEditStep(0)} />
        <SectionSummary title="Project Scope" data={data} fields={["projectType", "budget", "timeline", "hasExistingWebsite"]} labels={{ projectType: "Type", budget: "Budget", timeline: "Timeline", hasExistingWebsite: "Existing Site" }}
          format={{ projectType: (v) => projectTypes.find((t) => t.value === v)?.label || v, budget: (v) => budgetRanges.find((b) => b.value === v)?.label || v, timeline: (v) => timelineOptions.find((t) => t.value === v)?.label || v, hasExistingWebsite: (v) => v === "yes" ? "Yes" : "No" }}
          onEdit={() => onEditStep(1)} />
      </div>
      <SectionSummary title="Project Details" data={data} fields={["projectDetails", "projectGoals", "preferredContactMethod", "referralSource"]}
        labels={{ projectDetails: "Description", projectGoals: "Goals", preferredContactMethod: "Contact Method", referralSource: "Source" }}
        format={{ preferredContactMethod: (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : "—", referralSource: (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : "—" }}
        onEdit={() => onEditStep(2)} />
    </div>
  );
}

function SectionSummary({ title, data, fields, labels, onEdit, format }: {
  title: string;
  data: WizardData;
  fields: (keyof WizardData)[];
  labels: Partial<Record<keyof WizardData, string>>;
  onEdit: () => void;
  format?: Partial<Record<keyof WizardData, (v: string) => string>>;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h4>
        <button onClick={onEdit} className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">Edit</button>
      </div>
      <div className="space-y-2">
        {fields.map((field) => {
          const value = data[field];
          const displayValue = format?.[field] ? format[field]!(value) : value || "—";
          const label = labels[field] || field;
          return (
            <div key={field} className="flex justify-between text-xs">
              <span className="text-zinc-500">{label}</span>
              <span className={cn("font-medium text-zinc-800 dark:text-zinc-200 max-w-[60%] text-right truncate", !value && "text-zinc-400")}>{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Wizard Component ──────────────────────────────────────────────────

export function LeadQualificationWizard() {

  const router = useRouter();
  const { projectTypes, budgetRanges, timelineOptions } = useFormFieldOptions();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [saving, setSaving] = useState(false);

  const updateData = (partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return data.fullName.trim().length > 0 && data.email.trim().length > 0;
      case 1: return data.projectType.length > 0;
      case 2: return data.projectDetails.trim().length >= 10;
      default: return true;
    }
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/leads/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit");
      toast.success("Lead created and qualified successfully!");
      router.push("/dashboard/leads");
    } catch {
      toast.error("Failed to create lead. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <ContactInfoStep data={data} onChange={updateData} />;
      case 1: return <ProjectScopeStep data={data} onChange={updateData} projectTypes={projectTypes} budgetRanges={budgetRanges} timelineOptions={timelineOptions} />;
      case 2: return <ProjectDetailsStep data={data} onChange={updateData} />;
      case 3: return <ReviewStep data={data} onEditStep={setStep} projectTypes={projectTypes} budgetRanges={budgetRanges} timelineOptions={timelineOptions} />;
      default: return null;
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {

            const isActive = i === step;
            const isCompleted = i < step;
            return (
              <div key={s.id} className="flex flex-col items-center">
                <button
                  onClick={() => isCompleted && setStep(i)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                    isActive && "border-blue-500 bg-blue-500 text-white",
                    isCompleted && "border-green-500 bg-green-500 text-white cursor-pointer",
                    !isActive && !isCompleted && "border-zinc-300 bg-white text-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
                  )}
                >
                  {isCompleted ? <CheckCircle className="h-5 w-5" /> : <span>{i + 1}</span>}
                </button>
                <div className="mt-1.5 hidden sm:block">
                  <p className={cn("text-xs font-medium", isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-500")}>{s.label}</p>
                  <p className="text-[10px] text-zinc-400">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        {/* Progress Bar */}
        <div className="mt-4 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{STEPS[step].label}</h2>
              <p className="text-sm text-zinc-500">{STEPS[step].description}</p>
            </div>
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          onClick={prevStep}
          disabled={step === 0}
          className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {saving ? "Saving..." : "Qualify Lead"}
          </button>
        )}
      </div>
    </div>
  );
}
