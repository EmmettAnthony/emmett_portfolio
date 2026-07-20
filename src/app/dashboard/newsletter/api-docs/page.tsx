"use client";

import { useState, useEffect, useRef } from "react";
import {
  Globe,
  Key
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Field {
  field: string;
  type: string;
  required?: boolean;
  description: string;
}

interface EndpointDef {
  id: string;
  method: "POST" | "GET";
  path: string;
  description: string;
  auth: { type: "API Key" | "Public"; detail: string };
  requestBody: Field[] | null;
  queryParams?: Field[];
  response: string;
}

const endpoints: EndpointDef[] = [
  {
    id: "signup",
    method: "POST",
    path: "/api/newsletter/signup",
    description:
      "Subscribe a new email address to your newsletter. This is the primary endpoint used by signup forms.",
    auth: {
      type: "API Key",
      detail: "Requires `x-api-key` header with read or write permission",
    },
    requestBody: [
      { field: "email", type: "string", required: true, description: "Subscriber email address" },
      { field: "firstName", type: "string", description: "Subscriber first name" },
      { field: "lastName", type: "string", description: "Subscriber last name" },
      { field: "tags", type: "string[]", description: "Tags to assign to subscriber" },
      { field: "gdprConsent", type: "boolean", description: "GDPR consent flag" },
    ],
    response: `{
  "success": true,
  "subscriber": {
    "id": "clx...",
    "email": "user@example.com",
    "status": "active"
  }
}`,
  },
  {
    id: "preferences",
    method: "POST",
    path: "/api/newsletter/preferences",
    description:
      "Update subscriber preferences. Uses a token sent via email for authentication — no API key needed.",
    auth: {
      type: "Public",
      detail: "Uses token from email (no API key required)",
    },
    requestBody: [
      { field: "email", type: "string", required: true, description: "Subscriber email address" },
      { field: "token", type: "string", required: true, description: "Verification token from email" },
      { field: "...preferences", type: "object", description: "Preference fields to update" },
    ],
    response: `{
  "success": true,
  "subscriber": {
    "id": "clx...",
    "email": "user@example.com",
    "status": "active",
    "preferences": { ... }
  }
}`,
  },
  {
    id: "verify",
    method: "GET",
    path: "/api/newsletter/verify?token=xxx",
    description:
      "Verify a subscriber's email address. Called from the link sent in the confirmation email.",
    auth: {
      type: "Public",
      detail: "Token-based (no API key required)",
    },
    requestBody: null,
    response: `{
  "success": true,
  "message": "Email verified successfully"
}`,
  },
  {
    id: "create-subscriber",
    method: "POST",
    path: "/api/newsletter/subscribers",
    description:
      "Create a subscriber with full control. Similar to signup but returns richer data including timestamps.",
    auth: {
      type: "API Key",
      detail: "Requires `x-api-key` header with write permission",
    },
    requestBody: [
      { field: "email", type: "string", required: true, description: "Subscriber email address" },
      { field: "firstName", type: "string", description: "Subscriber first name" },
      { field: "lastName", type: "string", description: "Subscriber last name" },
      { field: "tags", type: "string[]", description: "Tags to assign" },
      { field: "gdprConsent", type: "boolean", description: "GDPR consent flag" },
      { field: "status", type: "string", description: "Initial status (active, pending, unsubscribed)" },
    ],
    response: `{
  "success": true,
  "subscriber": {
    "id": "clx...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "active",
    "tags": ["newsletter"],
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}`,
  },
  {
    id: "list-subscribers",
    method: "GET",
    path: "/api/newsletter/subscribers",
    description:
      "List all subscribers with pagination, filtering, and search support.",
    auth: {
      type: "API Key",
      detail: "Requires `x-api-key` header with read permission",
    },
    requestBody: null,
    queryParams: [
      { field: "page", type: "number", description: "Page number (default: 1)" },
      { field: "limit", type: "number", description: "Results per page (default: 50, max: 100)" },
      { field: "status", type: "string", description: "Filter by status: active, pending, unsubscribed" },
      { field: "search", type: "string", description: "Search email or name" },
    ],
    response: `{
  "success": true,
  "subscribers": [
    {
      "id": "clx...",
      "email": "user@example.com",
      "firstName": "John",
      "status": "active",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 156,
    "totalPages": 4
  }
}`,
  },
  {
    id: "create-campaign",
    method: "POST",
    path: "/api/newsletter/campaigns",
    description:
      "Create a new email campaign. The campaign will be created in draft status.",
    auth: {
      type: "API Key",
      detail: "Requires `x-api-key` header with write permission",
    },
    requestBody: [
      { field: "name", type: "string", required: true, description: "Campaign name" },
      { field: "subject", type: "string", required: true, description: "Email subject line" },
      { field: "content", type: "string", required: true, description: "HTML content of the email" },
      { field: "templateId", type: "string", description: "Template ID to use" },
      { field: "segmentIds", type: "string[]", description: "Target segment IDs" },
      { field: "scheduledAt", type: "string", description: "ISO date to schedule send" },
    ],
    response: `{
  "success": true,
  "campaign": {
    "id": "clx...",
    "name": "March Newsletter",
    "subject": "What's New This Month",
    "status": "draft",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}`,
  },
];

const methodColors: Record<string, string> = {
  POST:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  GET:
    "bg-badge-info-bg text-badge-info-text",
};

export default function ApiDocsPage() {
  const [activeId, setActiveId] = useState(endpoints[0].id);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0.1 },
    );

    for (const el of sectionRefs.current.values()) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            API Documentation
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Reference for the public newsletter API
          </p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Scrollspy Sidebar */}
        <nav className="sticky top-24 hidden h-fit w-56 shrink-0 space-y-1 lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Endpoints
          </p>
          {endpoints.map((ep) => (
            <button
              key={ep.id}
              onClick={() => scrollTo(ep.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                activeId === ep.id
                  ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none",
                  methodColors[ep.method],
                )}
              >
                {ep.method}
              </span>
              <span className="truncate font-mono text-xs">
                {ep.path.split("?")[0]}
              </span>
            </button>
          ))}
        </nav>

        {/* Endpoint Cards */}
        <div className="min-w-0 flex-1 space-y-8">
          {endpoints.map((ep) => (
            <section
              key={ep.id}
              id={ep.id}
              ref={(el) => {
                if (el) sectionRefs.current.set(ep.id, el);
              }}
              className="scroll-mt-24"
            >
              <EndpointCard endpoint={ep} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: EndpointDef }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <span
          className={cn(
            "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
            methodColors[endpoint.method],
          )}
        >
          {endpoint.method}
        </span>
        <code className="font-mono text-sm font-semibold text-zinc-900 dark:text-white">
          {endpoint.path}
        </code>
      </div>

      {/* Description */}
      <div className="px-6 py-4">
        <p className="text-sm text-muted-foreground dark:text-zinc-400">
          {endpoint.description}
        </p>
      </div>

      {/* Auth */}
      <div className="flex items-center gap-2 border-t border-zinc-100 px-6 py-3 dark:border-zinc-800">
        {endpoint.auth.type === "API Key" ? (
          <Key className="h-3.5 w-3.5 text-amber-500" />
        ) : (
          <Globe className="h-3.5 w-3.5 text-emerald-500" />
        )}
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Auth:{" "}
          <span
            className={cn(
              "font-semibold",
              endpoint.auth.type === "API Key"
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {endpoint.auth.type}
          </span>
          {" — "}
          {endpoint.auth.detail}
        </span>
      </div>

      {/* Request Body */}
      {endpoint.requestBody && endpoint.requestBody.length > 0 && (
        <div className="border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Request Body
          </h4>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                    Field
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                    Required
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {endpoint.requestBody.map((param) => (
                  <tr
                    key={param.field}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-2 font-mono text-xs text-zinc-900 dark:text-white">
                      {param.field}
                    </td>
                    <td className="px-4 py-2 text-xs text-zinc-500">
                      {param.type}
                    </td>
                    <td className="px-4 py-2">
                      {param.required ? (
                        <span className="text-xs font-medium text-red-500">
                          Yes
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground dark:text-zinc-400">
                      {param.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Query Params */}
      {endpoint.queryParams && endpoint.queryParams.length > 0 && (
        <div className="border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Query Parameters
          </h4>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                    Parameter
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {endpoint.queryParams.map((param) => (
                  <tr
                    key={param.field}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-2 font-mono text-xs text-zinc-900 dark:text-white">
                      {param.field}
                    </td>
                    <td className="px-4 py-2 text-xs text-zinc-500">
                      {param.type}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground dark:text-zinc-400">
                      {param.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Response */}
      <div className="border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Response Example
        </h4>
        <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100 dark:bg-zinc-900">
          <code>{endpoint.response}</code>
        </pre>
      </div>
    </div>
  );
}
