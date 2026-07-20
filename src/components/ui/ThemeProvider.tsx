"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const hasStoredPref = useRef(false);

  // Initialize: read localStorage or fall back to OS preference
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored) {
        hasStoredPref.current = true;
        setTheme(stored);
      } else {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        setTheme(mq.matches ? "dark" : "light");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Listen for OS preference changes — only auto-switch if user hasn't set a manual preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!hasStoredPref.current) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Sync classes to <html> and persist only when manually set
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    if (hasStoredPref.current) {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    hasStoredPref.current = true;
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
