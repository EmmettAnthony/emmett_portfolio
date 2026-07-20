import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Support - Emmett Anthony",
    description: "Get help, submit a support ticket, or browse our knowledge base and FAQs.",
  };
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {children}
    </div>
  );
}
