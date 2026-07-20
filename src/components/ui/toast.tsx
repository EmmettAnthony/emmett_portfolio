"use client";

import { toast as sonnerToast } from "sonner";

type ToastType = "success" | "error" | "info" | "loading";

export function useToast() {
  return {
    toast: (type: ToastType, message: string) => {
      if (type === "success") sonnerToast.success(message);
      else if (type === "error") sonnerToast.error(message);
      else if (type === "info") sonnerToast.info(message);
      else if (type === "loading") sonnerToast.loading(message);
    },
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
