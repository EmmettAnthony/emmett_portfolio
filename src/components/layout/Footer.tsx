import { Mail, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/data/site-config";
import { GithubIcon, LinkedInIcon, TwitterIcon } from "@/components/ui/SocialIcons";

const footerLinks: Array<{
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}> = [
  {
    title: "Pages",
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Services", href: "/services" },
      { label: "Resume", href: "/resume" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Web Development", href: "/services#web-development" },
      { label: "E-Commerce", href: "/services#ecommerce" },
      { label: "Custom Software", href: "/services#software-development" },
      { label: "Consulting", href: "/services#consulting" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "GitHub", href: siteConfig.links.github, external: true },
      { label: "LinkedIn", href: siteConfig.links.linkedin, external: true },
      { label: "Twitter", href: siteConfig.links.twitter, external: true },
      { label: "Email", href: `mailto:${siteConfig.links.email}`, external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white"
            >
              {siteConfig.name.split(" ")[0]}
              <span className="text-blue-700">.</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {siteConfig.tagline}
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { icon: GithubIcon, href: siteConfig.links.github, label: "GitHub" },
                { icon: LinkedInIcon, href: siteConfig.links.linkedin, label: "LinkedIn" },
                { icon: TwitterIcon, href: siteConfig.links.twitter, label: "Twitter" },
                { icon: Mail, href: `mailto:${siteConfig.links.email}`, label: "Email" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1 text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        {link.label}
                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 transition-all group-hover:opacity-100 group-hover:translate-y-0" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
