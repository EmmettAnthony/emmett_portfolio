/**
 * Brevo API client.
 *
 * Provides a unified `getBrevo()` factory with methods for all Brevo API sections.
 * The core fetch logic is in `./brevo-fetch.ts` and all type interfaces are in `./types.ts`.
 */

import { brevoFetch } from "./brevo-fetch";
import type {
  BrevoContact,
  BrevoContactAttribute,
  BrevoList,
  BrevoFolder,
  BrevoTransactionalEmail,
  BrevoTransactionalEmailDetail,
  BrevoTemplate,
  BrevoCampaign,
  BrevoCampaignStats,
  BrevoAbTestResult,
  BrevoCampaignShare,
  BrevoEmailReport,
  BrevoDailyStats,
  BrevoWebhook,
  BrevoAccount,
} from "./types";

export { getBrevoConfig, BrevoApiError } from "./brevo-fetch";
export type {
  BrevoContact,
  BrevoContactAttribute,
  BrevoList,
  BrevoFolder,
  BrevoTransactionalEmail,
  BrevoTransactionalEmailDetail,
  BrevoTemplate,
  BrevoCampaign,
  BrevoCampaignStats,
  BrevoAbTestResult,
  BrevoCampaignShare,
  BrevoEmailReport,
  BrevoDailyStats,
  BrevoWebhook,
  BrevoSmtpSettings,
  BrevoAccount,
} from "./types";

export function getBrevo() {
  return {
    // ─── Contacts API ──────────────────────────────────────────────────
    contacts: {
      create: (data: {
        email: string;
        attributes?: Record<string, unknown>;
        listIds?: number[];
        updateEnabled?: boolean;
      }) =>
        brevoFetch<{ id: number }>("/contacts", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      get: (email: string) =>
        brevoFetch<BrevoContact>("/contacts/" + encodeURIComponent(email)),

      update: (
        email: string,
        data: {
          attributes?: Record<string, unknown>;
          listIds?: number[];
          unlinkListIds?: number[];
        }
      ) =>
        brevoFetch<void>("/contacts/" + encodeURIComponent(email), {
          method: "PUT",
          body: JSON.stringify(data),
        }),

      delete: (email: string) =>
        brevoFetch<void>("/contacts/" + encodeURIComponent(email), {
          method: "DELETE",
        }),

      list: (params?: {
        limit?: number;
        offset?: number;
        modifiedSince?: string;
        sort?: "asc" | "desc";
        segmentId?: number;
        listId?: number;
        filter?: string;
      }) => {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));
        if (params?.modifiedSince) searchParams.set("modifiedSince", params.modifiedSince);
        if (params?.sort) searchParams.set("sort", params.sort);
        if (params?.segmentId) searchParams.set("segmentId", String(params.segmentId));
        if (params?.listId) searchParams.set("listId", String(params.listId));
        if (params?.filter) searchParams.set("filter", params.filter);
        const qs = searchParams.toString();
        return brevoFetch<{
          contacts: BrevoContact[];
          count: number;
        }>("/contacts" + (qs ? "?" + qs : ""));
      },

      import: (data: {
        fileUrl?: string;
        fileBody?: string;
        listIds?: number[];
        notifyUrl?: string;
        newList?: { listName: string; folderId: number };
        emailBlacklist?: boolean;
        smsBlacklist?: boolean;
        updateExistingContacts?: boolean;
        emptyContactsAttributes?: boolean;
      }) =>
        brevoFetch<{ processId: number }>("/contacts/import", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      export: (data: {
        exportAttributes?: string[];
        filter?: Record<string, unknown>;
        notifyUrl?: string;
        fileType?: "csv" | "xlsx";
        listIds?: number[];
      }) =>
        brevoFetch<{ processId: number }>("/contacts/export", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      getAttributes: () =>
        brevoFetch<{ attributes: BrevoContactAttribute[] }>("/contacts/attributes"),
    },

    // ─── Lists API ─────────────────────────────────────────────────────
    lists: {
      create: (data: { listName: string; folderId?: number }) =>
        brevoFetch<{ id: number }>("/contacts/lists", {
          method: "POST",
          body: JSON.stringify({ name: data.listName, folderId: data.folderId }),
        }),

      get: (id: number) =>
        brevoFetch<BrevoList>("/contacts/lists/" + id),

      update: (id: number, data: { listName: string; folderId?: number }) =>
        brevoFetch<void>("/contacts/lists/" + id, {
          method: "PUT",
          body: JSON.stringify({ name: data.listName, folderId: data.folderId }),
        }),

      delete: (id: number) =>
        brevoFetch<void>("/contacts/lists/" + id, {
          method: "DELETE",
        }),

      list: (params?: { limit?: number; offset?: number; sort?: "asc" | "desc" }) => {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));
        if (params?.sort) searchParams.set("sort", params.sort);
        const qs = searchParams.toString();
        return brevoFetch<{
          lists: BrevoList[];
          count: number;
        }>("/contacts/lists" + (qs ? "?" + qs : ""));
      },

      getContacts: (id: number, params?: { limit?: number; offset?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));
        const qs = searchParams.toString();
        return brevoFetch<{
          contacts: BrevoContact[];
          count: number;
        }>("/contacts/lists/" + id + "/contacts" + (qs ? "?" + qs : ""));
      },
    },

    // ─── Folders API ───────────────────────────────────────────────────
    folders: {
      create: (data: { name: string }) =>
        brevoFetch<{ id: number }>("/contacts/folders", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      list: (params?: { limit?: number; offset?: number; sort?: "asc" | "desc" }) => {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));
        if (params?.sort) searchParams.set("sort", params.sort);
        return brevoFetch<{ folders: BrevoFolder[]; count: number }>(
          "/contacts/folders?" + searchParams.toString()
        );
      },

      get: (id: number) =>
        brevoFetch<BrevoFolder>("/contacts/folders/" + id),

      delete: (id: number) =>
        brevoFetch<void>("/contacts/folders/" + id, { method: "DELETE" }),

      update: (id: number, data: { name: string }) =>
        brevoFetch<void>("/contacts/folders/" + id, {
          method: "PUT",
          body: JSON.stringify(data),
        }),

      getLists: (id: number, params?: { limit?: number; offset?: number; sort?: "asc" | "desc" }) => {
        const sp = new URLSearchParams();
        if (params?.limit) sp.set("limit", String(params.limit));
        if (params?.offset) sp.set("offset", String(params.offset));
        if (params?.sort) sp.set("sort", params.sort);
        return brevoFetch<{ lists: BrevoList[]; count: number }>(
          "/contacts/folders/" + id + "/lists" + (sp.toString() ? "?" + sp.toString() : "")
        );
      },
    },

    // ─── Transactional Email API ───────────────────────────────────────
    transactional: {
      sendEmail: (data: {
        sender: { name: string; email: string };
        to: { email: string; name?: string }[];
        subject: string;
        htmlContent?: string;
        textContent?: string;
        templateId?: number;
        params?: Record<string, string>;
        tags?: string[];
        replyTo?: { email: string; name?: string };
        attachment?: { name: string; content: string }[];
        headers?: Record<string, string>;
        scheduledAt?: string;
        batchId?: string;
      }) =>
        brevoFetch<{ messageId: string; messageIds?: string[] }>("/smtp/email", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      sendTemplate: (templateId: number, data: {
        to: { email: string; name?: string }[];
        params?: Record<string, string>;
        tags?: string[];
        replyTo?: { email: string; name?: string };
        attachment?: { name: string; content: string }[];
        headers?: Record<string, string>;
        scheduledAt?: string;
      }) =>
        brevoFetch<{ messageId: string; messageIds?: string[] }>(
          "/smtp/templates/" + templateId + "/send",
          { method: "POST", body: JSON.stringify(data) }
        ),

      getEmails: (params?: {
        limit?: number;
        offset?: number;
        startDate?: string;
        endDate?: string;
        email?: string;
        templateId?: number;
        messageId?: string;
        sort?: "asc" | "desc";
      }) => {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));
        if (params?.startDate) searchParams.set("startDate", params.startDate);
        if (params?.endDate) searchParams.set("endDate", params.endDate);
        if (params?.email) searchParams.set("email", params.email);
        if (params?.templateId) searchParams.set("templateId", String(params.templateId));
        if (params?.messageId) searchParams.set("messageId", params.messageId);
        if (params?.sort) searchParams.set("sort", params.sort);
        return brevoFetch<{
          emails: BrevoTransactionalEmail[];
          count: number;
        }>("/smtp/emails?" + searchParams.toString());
      },

      getEmail: (messageId: string) =>
        brevoFetch<BrevoTransactionalEmailDetail>("/smtp/emails/" + messageId),

      deleteEmail: (messageId: string) =>
        brevoFetch<void>("/smtp/emails/" + messageId, { method: "DELETE" }),

      getAggregatedReport: (params: {
        startDate: string;
        endDate: string;
        days?: number;
        tag?: string;
      }) => {
        const searchParams = new URLSearchParams();
        searchParams.set("startDate", params.startDate);
        searchParams.set("endDate", params.endDate);
        if (params.days) searchParams.set("days", String(params.days));
        if (params.tag) searchParams.set("tag", params.tag);
        return brevoFetch<BrevoEmailReport>("/smtp/statistics/aggregatedReport?" + searchParams.toString());
      },

      getDailyReport: (params: {
        limit?: number;
        offset?: number;
        startDate: string;
        endDate: string;
        days?: number;
        tag?: string;
      }) => {
        const searchParams = new URLSearchParams();
        searchParams.set("startDate", params.startDate);
        searchParams.set("endDate", params.endDate);
        if (params.limit) searchParams.set("limit", String(params.limit));
        if (params.offset) searchParams.set("offset", String(params.offset));
        if (params.days) searchParams.set("days", String(params.days));
        if (params.tag) searchParams.set("tag", params.tag);
        return brevoFetch<{
          dailyStats: BrevoDailyStats[];
          totalCount: number;
        }>("/smtp/statistics/dailyReport?" + searchParams.toString());
      },
    },

    // ─── Templates API (Transactional) ─────────────────────────────────
    templates: {
      list: (params?: {
        templateStatus?: boolean;
        limit?: number;
        offset?: number;
        sort?: "asc" | "desc";
      }) => {
        const searchParams = new URLSearchParams();
        if (params?.templateStatus !== undefined) searchParams.set("templateStatus", String(params.templateStatus));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));
        if (params?.sort) searchParams.set("sort", params.sort);
        return brevoFetch<{
          templates: BrevoTemplate[];
          count: number;
        }>("/smtp/templates?" + searchParams.toString());
      },

      get: (id: number) =>
        brevoFetch<BrevoTemplate>("/smtp/templates/" + id),

      create: (data: {
        sender: { name: string; email: string };
        templateName: string;
        htmlContent?: string;
        htmlUrl?: string;
        subject: string;
        replyTo?: string;
        tag?: string;
        isActive?: boolean;
        attachment?: { name: string; content: string }[];
      }) =>
        brevoFetch<{ id: number }>("/smtp/templates", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      update: (id: number, data: {
        sender?: { name: string; email: string };
        templateName?: string;
        htmlContent?: string;
        htmlUrl?: string;
        subject?: string;
        replyTo?: string;
        tag?: string;
        isActive?: boolean;
        attachment?: { name: string; content: string }[];
      }) =>
        brevoFetch<void>("/smtp/templates/" + id, {
          method: "PUT",
          body: JSON.stringify(data),
        }),

      delete: (id: number) =>
        brevoFetch<void>("/smtp/templates/" + id, { method: "DELETE" }),
    },

    // ─── Campaigns API (Email Marketing) ───────────────────────────────
    campaigns: {
      create: (data: {
        name: string;
        subject: string;
        sender: { name: string; email: string };
        type: "classic" | "trigger";
        htmlContent?: string;
        htmlUrl?: string;
        templateId?: number;
        listIds: number[];
        exclusionListIds?: number[];
        segmentIds?: number[];
        scheduledAt?: string;
        replyTo?: string;
        tag?: string;
        params?: Record<string, string>;
        recipients?: { listIds: number[]; segmentIds?: number[] };
        mirrorActive?: boolean;
        recurring?: {
          type: "daily" | "weekly" | "monthly";
          value: number;
          untilDate?: string;
        };
        abTesting?: {
          versionAStart?: number;
          versionBStart?: number;
          duration: number;
          sendAtWinner?: string;
          winnerCriteria: "open" | "click";
        };
      }) =>
        brevoFetch<{ id: number }>("/emailCampaigns", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      get: (id: number) =>
        brevoFetch<BrevoCampaign>("/emailCampaigns/" + id),

      update: (id: number, data: Record<string, unknown>) =>
        brevoFetch<void>("/emailCampaigns/" + id, {
          method: "PUT",
          body: JSON.stringify(data),
        }),

      delete: (id: number) =>
        brevoFetch<void>("/emailCampaigns/" + id, { method: "DELETE" }),

      list: (params?: {
        limit?: number;
        offset?: number;
        sort?: "asc" | "desc";
        status?: string;
        startDate?: string;
        endDate?: string;
      }) => {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.offset) searchParams.set("offset", String(params.offset));
        if (params?.sort) searchParams.set("sort", params.sort);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.startDate) searchParams.set("startDate", params.startDate);
        if (params?.endDate) searchParams.set("endDate", params.endDate);
        return brevoFetch<{
          campaigns: BrevoCampaign[];
          count: number;
        }>("/emailCampaigns?" + searchParams.toString());
      },

      sendTest: (id: number, data: { emailTo: string[] }) =>
        brevoFetch<void>("/emailCampaigns/" + id + "/sendTest", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      sendReport: (id: number, data: {
        email: { to: string[]; body: string };
        language?: string;
      }) =>
        brevoFetch<void>("/emailCampaigns/" + id + "/sendReport", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      send: (id: number) =>
        brevoFetch<void>("/emailCampaigns/" + id + "/sendNow", {
          method: "POST",
        }),

      schedule: (id: number, data: { sendAt: string }) =>
        brevoFetch<void>("/emailCampaigns/" + id + "/scheduleSend", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      duplicate: (id: number) =>
        brevoFetch<{ id: number }>("/emailCampaigns/" + id + "/duplicate", {
          method: "POST",
        }),

      getStats: (id: number) =>
        brevoFetch<BrevoCampaignStats>("/emailCampaigns/" + id + "/statistics"),

      getAbTestResult: (id: number) =>
        brevoFetch<BrevoAbTestResult>("/emailCampaigns/" + id + "/abTestResult"),

      getShares: (id: number) =>
        brevoFetch<{ shares: BrevoCampaignShare[] }>("/emailCampaigns/" + id + "/sharing"),
    },

    // ─── Webhooks API ──────────────────────────────────────────────────
    webhooks: {
      create: (data: {
        url: string;
        description?: string;
        events: string[];
        type?: "marketing" | "transactional" | "inbound";
      }) =>
        brevoFetch<{ id: number }>("/webhooks", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      list: (params?: { type?: string; sort?: "asc" | "desc" }) => {
        const searchParams = new URLSearchParams();
        if (params?.type) searchParams.set("type", params.type);
        if (params?.sort) searchParams.set("sort", params.sort);
        return brevoFetch<{ webhooks: BrevoWebhook[] }>(
          "/webhooks?" + searchParams.toString()
        );
      },

      get: (id: number) => brevoFetch<BrevoWebhook>("/webhooks/" + id),

      update: (id: number, data: {
        url?: string;
        description?: string;
        events?: string[];
      }) =>
        brevoFetch<void>("/webhooks/" + id, {
          method: "PUT",
          body: JSON.stringify(data),
        }),

      delete: (id: number) =>
        brevoFetch<void>("/webhooks/" + id, { method: "DELETE" }),
    },

    // ─── SMTP API ──────────────────────────────────────────────────────
    smtp: {
      getBlockedDomains: () =>
        brevoFetch<{ domains: string[] }>("/smtp/blockedDomains"),

      unblockBlockedDomain: (domain: string) =>
        brevoFetch<void>("/smtp/blockedDomains/" + domain, {
          method: "DELETE",
        }),

      deleteHardbounces: (data: {
        startDate?: string;
        endDate?: string;
        contactEmail?: string;
      }) =>
        brevoFetch<void>("/smtp/deleteHardbounces", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },

    // ─── Account API ───────────────────────────────────────────────────
    account: {
      get: () => brevoFetch<BrevoAccount>("/account"),

      getPlan: () =>
        brevoFetch<{
          plan: { type: string; credits: number; creditsType: string }[];
        }>("/account/plan"),
    },
  };
}
