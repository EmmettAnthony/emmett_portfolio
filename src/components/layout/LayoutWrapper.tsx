"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hide nav/footer on print-only and admin pages — show on public resume page
  const hideNavFooter = pathname.startsWith("/resume/print") || pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  return (
    <>
      <Navbar hidden={hideNavFooter} />
      <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
        {children}
      </main>
      <Footer hidden={hideNavFooter} />
    </>
  );
}
