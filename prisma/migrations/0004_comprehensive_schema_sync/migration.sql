-- Migration 0004: Comprehensive Schema Sync
-- Fixes all remaining drift between Prisma schema and database
-- Created: July 10, 2026
--
-- This migration adds:
-- 1. Missing enums
-- 2. Missing columns on existing tables (notifications, activity_logs)
-- 3. New tables that were created outside the migration system via db push
-- 4. Indexes for new columns

-- ══════════════════════════════════════════════════════════════
-- PART 1: Create Missing Enums
-- ══════════════════════════════════════════════════════════════

-- Enable pgvector extension for knowledge_base embedding column
-- (required for vector(1536) type)
CREATE EXTENSION IF NOT EXISTS vector;

-- Activity Severity (used by ActivityLog, SecurityEvent, AuditTrail)
DO $$ BEGIN
    CREATE TYPE "activity_severity" AS ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notification Category
DO $$ BEGIN
    CREATE TYPE "notif_category" AS ENUM('CRM', 'CONTACT', 'CALENDAR', 'PORTFOLIO', 'NEWSLETTER', 'RESUME', 'TESTIMONIAL', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notification Priority
DO $$ BEGIN
    CREATE TYPE "notif_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notification Type
DO $$ BEGIN
    CREATE TYPE "notif_type" AS ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notification Delivery Channel
DO $$ BEGIN
    CREATE TYPE "notif_delivery_channel" AS ENUM('IN_APP', 'EMAIL', 'PUSH', 'SMS', 'WHATSAPP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Language Direction
DO $$ BEGIN
    CREATE TYPE "lang_direction" AS ENUM('LTR', 'RTL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ══════════════════════════════════════════════════════════════
-- PART 2: Add Missing Columns to Existing Tables
-- ══════════════════════════════════════════════════════════════

-- ── notifications (16 missing columns) ──────────────────────
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "category" "notif_category" NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "priority" "notif_priority" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "notif_type" "notif_type" NOT NULL DEFAULT 'INFO';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "key" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "snoozedUntil" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "acknowledged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "actionLabel" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "actionUrl" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- Indexes for new notification columns
CREATE INDEX IF NOT EXISTS "notifications_userId_category_idx" ON "notifications"("userId", "category");
CREATE INDEX IF NOT EXISTS "notifications_userId_priority_idx" ON "notifications"("userId", "priority");
CREATE INDEX IF NOT EXISTS "notifications_category_idx" ON "notifications"("category");
CREATE INDEX IF NOT EXISTS "notifications_priority_idx" ON "notifications"("priority");
CREATE INDEX IF NOT EXISTS "notifications_key_idx" ON "notifications"("key");
CREATE INDEX IF NOT EXISTS "notifications_expiresAt_idx" ON "notifications"("expiresAt");

-- ── activity_logs (8 missing columns) ───────────────────────
ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "module" TEXT NOT NULL DEFAULT '';
ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "severity" "activity_severity" NOT NULL DEFAULT 'INFO';
ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "browser" TEXT;
ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "os" TEXT;
ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "device" TEXT;
ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "country" TEXT;

-- Indexes for new activity_log columns
CREATE INDEX IF NOT EXISTS "activity_logs_module_idx" ON "activity_logs"("module");
CREATE INDEX IF NOT EXISTS "activity_logs_severity_idx" ON "activity_logs"("severity");
CREATE INDEX IF NOT EXISTS "activity_logs_module_action_idx" ON "activity_logs"("module", "action");


-- ══════════════════════════════════════════════════════════════
-- PART 3: Create Missing Tables (created outside migration system)
-- ══════════════════════════════════════════════════════════════

-- ── About Page ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "about_page" (
    "id" TEXT NOT NULL DEFAULT 'single',
    "fullName" TEXT NOT NULL DEFAULT 'Emmett Anthony',
    "professionalTitle" TEXT NOT NULL DEFAULT 'Professional Software Developer',
    "shortIntro" TEXT,
    "photo" TEXT,
    "resumeUrl" TEXT,
    "summaryHeading" TEXT,
    "shortBio" TEXT,
    "fullBiography" TEXT,
    "yearsOfExperience" DOUBLE PRECISION,
    "missionStatement" TEXT,
    "visionStatement" TEXT,
    "whyWorkWithMe" JSONB NOT NULL DEFAULT '[]',
    "workProcess" JSONB NOT NULL DEFAULT '[]',
    "personalInterests" JSONB NOT NULL DEFAULT '[]',
    "socialLinks" JSONB NOT NULL DEFAULT '[]',
    "faqs" JSONB NOT NULL DEFAULT '[]',
    "ctaHeading" TEXT,
    "ctaDescription" TEXT,
    "ctaPrimaryButton" TEXT,
    "ctaPrimaryLink" TEXT,
    "ctaSecondaryButton" TEXT,
    "ctaSecondaryLink" TEXT,
    "ctaBackground" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "canonicalUrl" TEXT,
    "ogImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "about_page_pkey" PRIMARY KEY ("id")
);

-- ── About Statistics ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "about_statistics" (
    "id" TEXT NOT NULL,
    "aboutId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "suffix" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "about_statistics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "about_statistics_aboutId_idx" ON "about_statistics"("aboutId");
CREATE INDEX IF NOT EXISTS "about_statistics_order_idx" ON "about_statistics"("order");

-- ── About Technologies ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "about_technologies" (
    "id" TEXT NOT NULL,
    "aboutId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "logo" TEXT,
    "experienceLevel" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "about_technologies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "about_technologies_aboutId_idx" ON "about_technologies"("aboutId");
CREATE INDEX IF NOT EXISTS "about_technologies_category_idx" ON "about_technologies"("category");

-- ── Audit Trails ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "audit_trails" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "beforeValue" TEXT,
    "afterValue" TEXT,
    "beforeData" JSONB,
    "afterData" JSONB,
    "userId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_trails_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_trails_entityType_entityId_idx" ON "audit_trails"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "audit_trails_entityType_idx" ON "audit_trails"("entityType");
CREATE INDEX IF NOT EXISTS "audit_trails_entityId_idx" ON "audit_trails"("entityId");
CREATE INDEX IF NOT EXISTS "audit_trails_userId_idx" ON "audit_trails"("userId");
CREATE INDEX IF NOT EXISTS "audit_trails_createdAt_idx" ON "audit_trails"("createdAt");
CREATE INDEX IF NOT EXISTS "audit_trails_action_idx" ON "audit_trails"("action");

-- ── Security Events ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "security_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "activity_severity" NOT NULL DEFAULT 'WARNING',
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "security_events_eventType_idx" ON "security_events"("eventType");
CREATE INDEX IF NOT EXISTS "security_events_severity_idx" ON "security_events"("severity");
CREATE INDEX IF NOT EXISTS "security_events_userId_idx" ON "security_events"("userId");
CREATE INDEX IF NOT EXISTS "security_events_createdAt_idx" ON "security_events"("createdAt");
CREATE INDEX IF NOT EXISTS "security_events_resolved_idx" ON "security_events"("resolved");

-- ── User Sessions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "device" TEXT,
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_sessionToken_key" ON "user_sessions"("sessionToken");
CREATE INDEX IF NOT EXISTS "user_sessions_userId_idx" ON "user_sessions"("userId");
CREATE INDEX IF NOT EXISTS "user_sessions_isActive_idx" ON "user_sessions"("isActive");
CREATE INDEX IF NOT EXISTS "user_sessions_lastActiveAt_idx" ON "user_sessions"("lastActiveAt");

-- ── Notification Preferences ────────────────────────────────
CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryChannels" JSONB NOT NULL DEFAULT '{}',
    "emailDigest" TEXT NOT NULL DEFAULT 'instant',
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "desktopEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "snoozeUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notification_preferences_userId_key" UNIQUE ("userId")
);

-- ── Notification Templates ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "notification_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "notif_category" NOT NULL DEFAULT 'SYSTEM',
    "priority" "notif_priority" NOT NULL DEFAULT 'MEDIUM',
    "notif_type" "notif_type" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "pushTitle" TEXT,
    "pushBody" TEXT,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "channels" JSONB NOT NULL DEFAULT '["IN_APP"]',
    "actionLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notification_templates_name_key" UNIQUE ("name")
);

CREATE INDEX IF NOT EXISTS "notification_templates_category_idx" ON "notification_templates"("category");

-- ── Notification Logs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "notification_logs" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" "notif_delivery_channel" NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notification_logs_notificationId_idx" ON "notification_logs"("notificationId");
CREATE INDEX IF NOT EXISTS "notification_logs_channel_status_idx" ON "notification_logs"("channel", "status");
CREATE INDEX IF NOT EXISTS "notification_logs_createdAt_idx" ON "notification_logs"("createdAt");

-- ── Homepage Statistics ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "homepage_statistics" (
    "id" TEXT NOT NULL,
    "homepageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "homepage_statistics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "homepage_statistics_homepageId_idx" ON "homepage_statistics"("homepageId");
CREATE INDEX IF NOT EXISTS "homepage_statistics_order_idx" ON "homepage_statistics"("order");

-- ── Homepage Technologies ───────────────────────────────────
CREATE TABLE IF NOT EXISTS "homepage_technologies" (
    "id" TEXT NOT NULL,
    "homepageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "logo" TEXT,
    "experienceLevel" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "homepage_technologies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "homepage_technologies_homepageId_idx" ON "homepage_technologies"("homepageId");
CREATE INDEX IF NOT EXISTS "homepage_technologies_category_idx" ON "homepage_technologies"("category");

-- ── Trusted Logos ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "trusted_logos" (
    "id" TEXT NOT NULL,
    "homepageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "website" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trusted_logos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "trusted_logos_homepageId_idx" ON "trusted_logos"("homepageId");
CREATE INDEX IF NOT EXISTS "trusted_logos_order_idx" ON "trusted_logos"("order");

-- ── Contact FAQs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "contact_faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contact_faqs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "contact_faqs_published_idx" ON "contact_faqs"("published");
CREATE INDEX IF NOT EXISTS "contact_faqs_order_idx" ON "contact_faqs"("order");

-- ── Contact Email Logs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "contact_email_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "contactId" TEXT,
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "contact_email_logs_type_idx" ON "contact_email_logs"("type");
CREATE INDEX IF NOT EXISTS "contact_email_logs_contactId_idx" ON "contact_email_logs"("contactId");
CREATE INDEX IF NOT EXISTS "contact_email_logs_appointmentId_idx" ON "contact_email_logs"("appointmentId");
CREATE INDEX IF NOT EXISTS "contact_email_logs_createdAt_idx" ON "contact_email_logs"("createdAt");

-- ── Email Templates ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "email_templates_name_key" UNIQUE ("name")
);

-- ── Legal Pages ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "legal_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "legal_pages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "legal_pages_slug_key" UNIQUE ("slug")
);

CREATE INDEX IF NOT EXISTS "legal_pages_slug_idx" ON "legal_pages"("slug");
CREATE INDEX IF NOT EXISTS "legal_pages_published_idx" ON "legal_pages"("published");

-- ── Locale Settings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "locale_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "autoDetect" BOOLEAN NOT NULL DEFAULT true,
    "localePrefix" TEXT NOT NULL DEFAULT 'always',
    "cookieName" TEXT NOT NULL DEFAULT 'NEXT_LOCALE',
    "enableTranslationApi" BOOLEAN NOT NULL DEFAULT false,
    "translationApiProvider" TEXT,
    "translationApiKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "locale_settings_pkey" PRIMARY KEY ("id")
);

-- ── Site Languages ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "site_languages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nativeName" TEXT NOT NULL,
    "direction" "lang_direction" NOT NULL DEFAULT 'LTR',
    "flagEmoji" TEXT,
    "flagImage" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "fallbackLocale" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "site_languages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "site_languages_code_key" UNIQUE ("code")
);

CREATE INDEX IF NOT EXISTS "site_languages_isEnabled_idx" ON "site_languages"("isEnabled");
CREATE INDEX IF NOT EXISTS "site_languages_order_idx" ON "site_languages"("order");
CREATE INDEX IF NOT EXISTS "site_languages_code_idx" ON "site_languages"("code");

-- ── Translation Groups ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "translation_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "languageId" TEXT,
    CONSTRAINT "translation_groups_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "translation_groups_slug_key" UNIQUE ("slug")
);

CREATE INDEX IF NOT EXISTS "translation_groups_slug_idx" ON "translation_groups"("slug");
CREATE INDEX IF NOT EXISTS "translation_groups_order_idx" ON "translation_groups"("order");

-- ── Translations ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "translations" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "languageId" TEXT NOT NULL,
    "pluralForm" TEXT,
    "context" TEXT,
    "isAutoTranslated" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "translations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "translations_groupId_key_languageId_key" UNIQUE ("groupId", "key", "languageId")
);

CREATE INDEX IF NOT EXISTS "translations_groupId_idx" ON "translations"("groupId");
CREATE INDEX IF NOT EXISTS "translations_languageId_idx" ON "translations"("languageId");
CREATE INDEX IF NOT EXISTS "translations_key_idx" ON "translations"("key");

-- ── Site Settings (enhanced) - Add missing column ──────────
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "navigationLinks" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "integrations" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "formFieldOptions" JSONB DEFAULT '{}';

-- ── Notification table (enhanced base) - Add missing FKs ────
-- Note: Notifications table already exists from migration 0001
-- Foreign key to notification_logs handled by the NotificationLog model

-- ══════════════════════════════════════════════════════════════
-- PART 4: Chat System Tables
-- ══════════════════════════════════════════════════════════════

-- ── Chat Conversations ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "chat_conversations" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT,
    "visitorName" TEXT,
    "visitorEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT NOT NULL DEFAULT 'chat_widget',
    "language" TEXT NOT NULL DEFAULT 'en',
    "metadata" JSONB,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "leadId" TEXT,
    "feedbackScore" INTEGER,
    "isHighPriority" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "chat_conversations_visitorId_idx" ON "chat_conversations"("visitorId");
CREATE INDEX IF NOT EXISTS "chat_conversations_status_idx" ON "chat_conversations"("status");
CREATE INDEX IF NOT EXISTS "chat_conversations_isHighPriority_idx" ON "chat_conversations"("isHighPriority");
CREATE INDEX IF NOT EXISTS "chat_conversations_createdAt_idx" ON "chat_conversations"("createdAt");
CREATE INDEX IF NOT EXISTS "chat_conversations_lastActivityAt_idx" ON "chat_conversations"("lastActivityAt");

-- ── Chat Messages ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "chat_messages_conversationId_createdAt_idx" ON "chat_messages"("conversationId", "createdAt");

-- ── Chat Leads ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "chat_leads" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "budget" TEXT,
    "timeline" TEXT,
    "requirements" TEXT NOT NULL,
    "projectType" TEXT,
    "industry" TEXT,
    "preferredContact" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chat_leads_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_leads_conversationId_key" UNIQUE ("conversationId")
);

CREATE INDEX IF NOT EXISTS "chat_leads_status_idx" ON "chat_leads"("status");
CREATE INDEX IF NOT EXISTS "chat_leads_priority_idx" ON "chat_leads"("priority");
CREATE INDEX IF NOT EXISTS "chat_leads_email_idx" ON "chat_leads"("email");

-- ── Chat Settings ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "chat_settings" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 4000,
    "systemPrompt" TEXT NOT NULL DEFAULT '',
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Hi! I''m Emmett''s AI assistant. How can I help you today?',
    "suggestedQuestions" TEXT[],
    "blockedWords" TEXT[],
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 10,
    "rateLimitPerDay" INTEGER NOT NULL DEFAULT 500,
    "maxConversationLength" INTEGER NOT NULL DEFAULT 100,
    "enableFileSearch" BOOLEAN NOT NULL DEFAULT true,
    "enableLeadCapture" BOOLEAN NOT NULL DEFAULT true,
    "enableBooking" BOOLEAN NOT NULL DEFAULT true,
    "enableHumanHandoff" BOOLEAN NOT NULL DEFAULT true,
    "enableMultilingual" BOOLEAN NOT NULL DEFAULT true,
    "enableAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "enableWelcomeTrigger" BOOLEAN NOT NULL DEFAULT true,
    "welcomeDelayMs" INTEGER NOT NULL DEFAULT 15000,
    "enableExitIntent" BOOLEAN NOT NULL DEFAULT true,
    "exitIntentMessage" TEXT NOT NULL DEFAULT '👋 Before you go! I''d love to help with your next project.',
    "widgetPosition" TEXT NOT NULL DEFAULT 'right',
    "widgetColor" TEXT NOT NULL DEFAULT '#2563eb',
    "widgetTitle" TEXT NOT NULL DEFAULT 'Chat with Emmett',
    "widgetSubtitle" TEXT NOT NULL DEFAULT 'AI Assistant',
    "widgetAvatar" TEXT,
    "widgetSize" TEXT NOT NULL DEFAULT 'md',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chat_settings_pkey" PRIMARY KEY ("id")
);

-- ── Chat Feedback ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "chat_feedback" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_feedback_conversationId_key" UNIQUE ("conversationId")
);

-- ── Chat Analytics ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "chat_analytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "leadsGenerated" INTEGER NOT NULL DEFAULT 0,
    "bookingsMade" INTEGER NOT NULL DEFAULT 0,
    "questionsAsked" INTEGER NOT NULL DEFAULT 0,
    "resolvedCount" INTEGER NOT NULL DEFAULT 0,
    "escalatedCount" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgSessionDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "satisfactionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "welcomeTriggerCount" INTEGER NOT NULL DEFAULT 0,
    "exitIntentTriggerCount" INTEGER NOT NULL DEFAULT 0,
    "popularTopics" JSONB NOT NULL DEFAULT '{}',
    "providerUsage" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chat_analytics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_analytics_date_key" UNIQUE ("date")
);

-- ── Knowledge Categories ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "knowledge_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "knowledge_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "knowledge_categories_slug_key" UNIQUE ("slug")
);

-- ── Knowledge Base ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "knowledge_base" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryId" TEXT,
    "tags" TEXT[],
    "source" TEXT,
    "sourceUrl" TEXT,
    "embedding" vector(1536),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "knowledge_base_categoryId_idx" ON "knowledge_base"("categoryId");
CREATE INDEX IF NOT EXISTS "knowledge_base_enabled_idx" ON "knowledge_base"("enabled");
CREATE INDEX IF NOT EXISTS "knowledge_base_title_idx" ON "knowledge_base"("title");

-- ── Prompt Templates ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "prompt_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "variables" TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "prompt_templates_name_key" UNIQUE ("name")
);

CREATE INDEX IF NOT EXISTS "prompt_templates_category_idx" ON "prompt_templates"("category");
CREATE INDEX IF NOT EXISTS "prompt_templates_enabled_idx" ON "prompt_templates"("enabled");

-- ══════════════════════════════════════════════════════════════
-- PART 5: CRM Tables
-- ══════════════════════════════════════════════════════════════

-- ── CRM Companies ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "address" TEXT,
    "companySize" TEXT,
    "annualRevenue" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_companies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_companies_name_idx" ON "crm_companies"("name");

-- ── CRM Leads ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_leads" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "position" TEXT,
    "country" TEXT,
    "website" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "assignedTo" TEXT,
    "convertedToClientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_leads_email_idx" ON "crm_leads"("email");
CREATE INDEX IF NOT EXISTS "crm_leads_status_idx" ON "crm_leads"("status");
CREATE INDEX IF NOT EXISTS "crm_leads_source_idx" ON "crm_leads"("source");

-- ── CRM Clients ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_clients" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT,
    "companyId" TEXT,
    "industry" TEXT,
    "website" TEXT,
    "healthScore" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_clients_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_clients_email_idx" ON "crm_clients"("email");
CREATE INDEX IF NOT EXISTS "crm_clients_companyId_idx" ON "crm_clients"("companyId");

-- ── CRM Deals ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_deals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "expectedCloseDate" TIMESTAMP(3),
    "stage" TEXT NOT NULL DEFAULT 'NEW_LEAD',
    "lostReason" TEXT,
    "notes" TEXT,
    "leadId" TEXT,
    "clientId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_deals_stage_idx" ON "crm_deals"("stage");
CREATE INDEX IF NOT EXISTS "crm_deals_clientId_idx" ON "crm_deals"("clientId");
CREATE INDEX IF NOT EXISTS "crm_deals_leadId_idx" ON "crm_deals"("leadId");

-- ── CRM Activities ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_activities" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "leadId" TEXT,
    "clientId" TEXT,
    "dealId" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_activities_type_idx" ON "crm_activities"("type");
CREATE INDEX IF NOT EXISTS "crm_activities_date_idx" ON "crm_activities"("date");
CREATE INDEX IF NOT EXISTS "crm_activities_leadId_idx" ON "crm_activities"("leadId");
CREATE INDEX IF NOT EXISTS "crm_activities_clientId_idx" ON "crm_activities"("clientId");

-- ── CRM Tasks ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "leadId" TEXT,
    "clientId" TEXT,
    "dealId" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_tasks_status_idx" ON "crm_tasks"("status");
CREATE INDEX IF NOT EXISTS "crm_tasks_dueDate_idx" ON "crm_tasks"("dueDate");
CREATE INDEX IF NOT EXISTS "crm_tasks_leadId_idx" ON "crm_tasks"("leadId");
CREATE INDEX IF NOT EXISTS "crm_tasks_clientId_idx" ON "crm_tasks"("clientId");

-- ── CRM Proposals ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_proposals" (
    "id" TEXT NOT NULL,
    "proposalNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "services" JSONB NOT NULL DEFAULT '[]',
    "pricing" JSONB NOT NULL DEFAULT '{}',
    "terms" TEXT,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "pdfUrl" TEXT,
    "sentAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_proposals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "crm_proposals_proposalNumber_key" UNIQUE ("proposalNumber")
);

CREATE INDEX IF NOT EXISTS "crm_proposals_clientId_idx" ON "crm_proposals"("clientId");
CREATE INDEX IF NOT EXISTS "crm_proposals_status_idx" ON "crm_proposals"("status");

-- ── CRM Contracts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_contracts" (
    "id" TEXT NOT NULL,
    "contractName" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "pdfUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_contracts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_contracts_clientId_idx" ON "crm_contracts"("clientId");
CREATE INDEX IF NOT EXISTS "crm_contracts_status_idx" ON "crm_contracts"("status");

-- ── CRM Invoices ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "pdfUrl" TEXT,
    "notes" TEXT,
    "lineItems" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_invoices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "crm_invoices_invoiceNumber_key" UNIQUE ("invoiceNumber")
);

CREATE INDEX IF NOT EXISTS "crm_invoices_clientId_idx" ON "crm_invoices"("clientId");
CREATE INDEX IF NOT EXISTS "crm_invoices_status_idx" ON "crm_invoices"("status");

-- ── CRM Communications ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_communications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "direction" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_communications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_communications_type_idx" ON "crm_communications"("type");
CREATE INDEX IF NOT EXISTS "crm_communications_date_idx" ON "crm_communications"("date");
CREATE INDEX IF NOT EXISTS "crm_communications_leadId_idx" ON "crm_communications"("leadId");

-- ── CRM Automations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_automations" (
    "id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_automations_pkey" PRIMARY KEY ("id")
);

-- ══════════════════════════════════════════════════════════════
-- PART 6: Foreign Key Constraints for New Tables
-- Note: PostgreSQL does not support ADD CONSTRAINT IF NOT EXISTS,
-- so we use DO blocks with EXCEPTION handlers for idempotency.
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
    ALTER TABLE "about_statistics" ADD CONSTRAINT "about_statistics_aboutId_fkey"
        FOREIGN KEY ("aboutId") REFERENCES "about_page"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "about_technologies" ADD CONSTRAINT "about_technologies_aboutId_fkey"
        FOREIGN KEY ("aboutId") REFERENCES "about_page"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "homepage_statistics" ADD CONSTRAINT "homepage_statistics_homepageId_fkey"
        FOREIGN KEY ("homepageId") REFERENCES "homepage"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "homepage_technologies" ADD CONSTRAINT "homepage_technologies_homepageId_fkey"
        FOREIGN KEY ("homepageId") REFERENCES "homepage"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "trusted_logos" ADD CONSTRAINT "trusted_logos_homepageId_fkey"
        FOREIGN KEY ("homepageId") REFERENCES "homepage"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notificationId_fkey"
        FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey"
        FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "chat_leads" ADD CONSTRAINT "chat_leads_conversationId_fkey"
        FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_conversationId_fkey"
        FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_clients" ADD CONSTRAINT "crm_clients_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "crm_companies"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_convertedToClientId_fkey"
        FOREIGN KEY ("convertedToClientId") REFERENCES "crm_clients"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_leadId_fkey"
        FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "crm_clients"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "crm_companies"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_leadId_fkey"
        FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "crm_clients"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_dealId_fkey"
        FOREIGN KEY ("dealId") REFERENCES "crm_deals"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_leadId_fkey"
        FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "crm_clients"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_dealId_fkey"
        FOREIGN KEY ("dealId") REFERENCES "crm_deals"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_proposals" ADD CONSTRAINT "crm_proposals_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "crm_clients"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_contracts" ADD CONSTRAINT "crm_contracts_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "crm_clients"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "crm_invoices" ADD CONSTRAINT "crm_invoices_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "crm_clients"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "translation_groups" ADD CONSTRAINT "translation_groups_languageId_fkey"
        FOREIGN KEY ("languageId") REFERENCES "site_languages"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "translations" ADD CONSTRAINT "translations_groupId_fkey"
        FOREIGN KEY ("groupId") REFERENCES "translation_groups"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "translations" ADD CONSTRAINT "translations_languageId_fkey"
        FOREIGN KEY ("languageId") REFERENCES "site_languages"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_categoryId_fkey"
        FOREIGN KEY ("categoryId") REFERENCES "knowledge_categories"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
