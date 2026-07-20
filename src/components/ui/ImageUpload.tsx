"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X, Link } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing-client";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n";
interface ImageUploadProps {
  value: string | undefined;
  onChange: (url: string) => void;
  endpoint?: string;
  label?: string;
}

export default function ImageUpload({ value, onChange, endpoint = "imageUploader" as string, label }: ImageUploadProps) {
  const t = useTranslations("common");
  const [showUrlInput, setShowUrlInput] = useState(false);

  return (
    <div className="space-y-3">
      {value && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <Image src={value} alt={label || t("uploadedImage")} fill className="object-cover" sizes="400px" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <UploadButton
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
          endpoint={endpoint as any}
          onClientUploadComplete={(res) => {
            if (res?.[0]?.url) onChange(res[0].url);
          }}
          onUploadError={(err) => console.error("Upload failed:", err)}
          appearance={{
            button: "inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200",
          }}
          content={{
            button({ ready }) {
              return ready ? (
                <><Upload className="h-4 w-4" /> {t("upload")}</>
              ) : (
                t("loading")
              );
            },
          }}
        />
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <Link className="h-4 w-4" />
          {t("url")}
        </button>
      </div>
      {showUrlInput && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("pasteImageUrl")}
        />
      )}
    </div>
  );
}
