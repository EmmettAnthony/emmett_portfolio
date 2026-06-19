import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { ContactForm } from "@/components/contact/ContactForm";
import { Mail, MapPin, MessageSquare } from "lucide-react";
import { GithubIcon, LinkedInIcon } from "@/components/ui/SocialIcons";
import { siteConfig } from "@/data/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Emmett Anthony",
  description:
    "Get in touch with Emmett Anthony for web development, software development, and consulting services.",
};

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: siteConfig.links.email,
    href: `mailto:${siteConfig.links.email}`,
  },
  {
    icon: MapPin,
    label: "Location",
    value: siteConfig.location,
  },
  {
    icon: GithubIcon,
    label: "GitHub",
    value: siteConfig.links.github.replace("https://", ""),
    href: siteConfig.links.github,
  },
  {
    icon: LinkedInIcon,
    label: "LinkedIn",
    value: siteConfig.links.linkedin.replace("https://", ""),
    href: siteConfig.links.linkedin,
  },
];

export default function Contact() {
  return (
    <main className="pt-24">
      <AnimatedSection>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Get in Touch
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Have a project in mind or just want to say hi? I&apos;d love to hear
              from you. Fill out the form below and I&apos;ll get back to you as soon as
              possible.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-12 lg:grid-cols-3">
            {/* Contact form */}
            <div className="lg:col-span-2">
              <ContactForm />
            </div>

            {/* Contact info */}
            <div className="space-y-6">
              {contactInfo.map((info) => {
                const Icon = info.icon;
                const content = (
                  <div className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        {info.label}
                      </h3>
                      <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-white">
                        {info.value}
                      </p>
                    </div>
                  </div>
                );

                if (info.href) {
                  return (
                    <a
                      key={info.label}
                      href={info.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content}
                    </a>
                  );
                }
                return <div key={info.label}>{content}</div>;
              })}
            </div>
          </div>
        </div>
      </AnimatedSection>
    </main>
  );
}
