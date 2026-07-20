"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SiteSettingsData } from "@/lib/get-site-settings";

const defaultSettings: SiteSettingsData = {
  siteName: "Emmett Anthony",
  tagline: "Building modern, scalable, and user-focused digital solutions.",
  description: "Emmett Anthony is a software developer with over three years of experience.",
  url: "https://emmettanthony.dev",
  ogImage: "/og-image.png",
  logo: "",
  favicon: "",
  email: "hello@emmettanthony.dev",
  phone: "+1234567890",
  address: "San Francisco, CA",
  social: {
    github: "https://github.com/emmettanthony",
    linkedin: "https://linkedin.com/in/emmettanthony",
    twitter: "https://twitter.com/emmettanthony",
    email: "hello@emmettanthony.dev",
    whatsapp: "+1234567890",
  },
  keywords: ["Software Developer", "Web Developer", "Full Stack Developer"],
  navigationLinks: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Services", href: "/services" },
    { label: "Resume", href: "/resume" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
};

const SiteSettingsContext = createContext<SiteSettingsData>(defaultSettings);

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: async () => {
      const res = await fetch("/api/public/site-settings");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<SiteSettingsData>;
    },
    staleTime: 60_000,
  });

  return (
    <SiteSettingsContext.Provider value={data ?? defaultSettings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
