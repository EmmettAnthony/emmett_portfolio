import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { BackToTop } from "@/components/ui/BackToTop";
import { JsonLd } from "@/components/shared/JsonLd";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import { NewsletterProvider } from "@/components/newsletter/forms/NewsletterProvider";
import { QueryProvider } from "@/lib/providers";
import { ChatWidgetWrapper } from "@/components/chat/ChatWidgetWrapper";
import { SiteSettingsProvider } from "@/components/settings/SiteSettingsProvider";
import { getSiteSettings } from "@/lib/get-site-settings";
import { cookies } from "next/headers";
import {
  locales,
  defaultLocale,
  localeDirections
} from "@/i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  let activeLocale: string = defaultLocale;
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- locale type compat
    if (cookieLocale && locales.includes(cookieLocale as any)) {
      activeLocale = cookieLocale;
    }
  } catch {}

  const ogLocale = activeLocale === "en" ? "en_US" : `${activeLocale}_${activeLocale.toUpperCase()}`;

  return {
    metadataBase: new URL(settings.url),
    title: {
      default: `${settings.siteName} | ${settings.tagline}`,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.description,
    keywords: settings.keywords,
    authors: [{ name: settings.siteName }],
    alternates: {
      canonical: settings.url,
    },
    other: {
      "google-site-verification": "",
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.siteName} | ${settings.tagline}`,
      description: settings.description,
      images: [settings.ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      url: settings.url,
      title: `${settings.siteName} | ${settings.tagline}`,
      description: settings.description,
      siteName: settings.siteName,
      images: [
        {
          url: settings.ogImage,
          width: 1200,
          height: 630,
          alt: settings.siteName,
        },
      ],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  // Read locale from cookie for SSR — client-side LocaleProvider handles dynamic switching
  let activeLocale: string = defaultLocale;
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- locale type compat
    if (cookieLocale && locales.includes(cookieLocale as any)) {
      activeLocale = cookieLocale;
    }
  } catch {}



  return (
    <html
      lang={activeLocale}
      dir={localeDirections[activeLocale as Locale]}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <JsonLd />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={settings.siteName} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content={settings.siteName} />
        {/* Preconnect to external origins for faster resource loading */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  if (stored) {
                    document.documentElement.classList.add(stored);
                    return;
                  }
                  var mq = window.matchMedia('(prefers-color-scheme: dark)');
                  if (mq.media !== 'not all' && mq.matches) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100" suppressHydrationWarning>
        <GoogleAnalytics />
        <ThemeProvider>
          <LocaleProvider>
            <QueryProvider>
              <SiteSettingsProvider>
              <ChatWidgetWrapper>
                <ScrollProgress />
                <LayoutWrapper>{children}</LayoutWrapper>
                <BackToTop />
                <NewsletterProvider />
              </ChatWidgetWrapper>
              </SiteSettingsProvider>
            </QueryProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
