import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { locales, defaultLocale } from "./i18n/routing";

const publicAdminPaths = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (cookieLocale && locales.includes(cookieLocale as any)) {
    return cookieLocale;
  }

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    for (const part of acceptLanguage.split(",")) {
      const lang = part.split(";")[0].trim().split("-")[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (locales.includes(lang as any)) {
        return lang;
      }
    }
  }

  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detect locale and pass it to server components via a request header.
  // In Next.js v16 proxy, request headers must be passed through
  // NextResponse.next({ request: { headers } }) so the page component
  // can read them. next-intl's getRequestConfig reads x-next-intl-locale
  // to determine the locale for server-rendered translations.
  const locale = detectLocale(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-next-intl-locale", locale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Ensure the NEXT_LOCALE cookie is set for subsequent requests
  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return response;
  }

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");
  const isPublicAdminRoute = publicAdminPaths.some((p) =>
    pathname.startsWith(p)
  );

  if (isDashboardRoute || (isAdminRoute && !isPublicAdminRoute)) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
