-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "inquiry_status" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'CONVERTED', 'CLOSED', 'LOST');

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "projectType" TEXT NOT NULL,
    "budget" TEXT,
    "timeline" TEXT,
    "website" TEXT,
    "startDate" TEXT,
    "projectDetails" TEXT NOT NULL,
    "referralSource" TEXT,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "tags" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_timeline" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "avatar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "budget" DOUBLE PRECISION,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "clientId" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technologies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technologies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "fullDescription" TEXT,
    "projectSummary" TEXT,
    "clientName" TEXT,
    "clientIndustry" TEXT,
    "categoryId" TEXT,
    "featuredImage" TEXT,
    "thumbnailImage" TEXT,
    "galleryImages" JSONB NOT NULL DEFAULT '[]',
    "videoDemo" TEXT,
    "projectLogo" TEXT,
    "startDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "projectDuration" TEXT,
    "teamSize" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "liveUrl" TEXT,
    "githubUrl" TEXT,
    "demoUrl" TEXT,
    "caseStudyUrl" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "awards" JSONB NOT NULL DEFAULT '[]',
    "testimonialIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_metrics" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "prefix" TEXT,
    "suffix" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_daily_views" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "project_daily_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_studies" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "clientBackground" TEXT,
    "businessProblem" TEXT,
    "objectives" TEXT,
    "research" TEXT,
    "solution" TEXT,
    "developmentProcess" TEXT,
    "results" TEXT,
    "lessonsLearned" TEXT,
    "challenges" TEXT,
    "requirements" TEXT,
    "projectGoals" TEXT,
    "problemStatement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "category" TEXT,
    "tags" TEXT,
    "author" TEXT NOT NULL DEFAULT 'Emmett Anthony',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImage" TEXT,
    "readingTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_revisions" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "category" TEXT,
    "tags" TEXT,
    "image" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobTitle" TEXT,
    "company" TEXT,
    "companyWebsite" TEXT,
    "email" TEXT,
    "photo" TEXT,
    "companyLogo" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "projectName" TEXT,
    "projectCategory" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "displayOnHomepage" BOOLEAN NOT NULL DEFAULT true,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImage" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonial_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testimonial_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "country" TEXT,
    "tags" TEXT,
    "source" TEXT,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'ACTIVE',
    "verificationToken" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "gdprConsent" BOOLEAN NOT NULL DEFAULT false,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOpenedAt" TIMESTAMP(3),
    "lastClickedAt" TIMESTAMP(3),
    "timezone" TEXT,
    "notes" TEXT,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriber_preferences" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "topics" TEXT,
    "emailFrequency" TEXT NOT NULL DEFAULT 'instant',
    "preferredSendHour" INTEGER NOT NULL DEFAULT 9,
    "receivePromotions" BOOLEAN NOT NULL DEFAULT true,
    "receiveNewsletters" BOOLEAN NOT NULL DEFAULT true,
    "receiveBlogUpdates" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriber_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unsubscribe_reasons" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "reason" TEXT,
    "detail" TEXT,
    "unsubscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unsubscribe_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB,
    "isDynamic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "previewText" TEXT,
    "senderName" TEXT,
    "senderEmail" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedForReviewAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "templateId" TEXT,
    "segmentId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "testEmails" TEXT,
    "abTestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "abTestVariantA" TEXT,
    "abTestVariantB" TEXT,
    "abTestTestPercent" INTEGER NOT NULL DEFAULT 20,
    "abTestWinner" TEXT,
    "abTestWinnerDeclaredAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "recurringFrequency" TEXT,
    "recurringDayOfWeek" INTEGER,
    "recurringDayOfMonth" INTEGER,
    "recurringNextRunAt" TIMESTAMP(3),
    "recurringEndsAt" TIMESTAMP(3),
    "recurringCount" INTEGER NOT NULL DEFAULT 0,
    "recurringMaxCount" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_events" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "subscriberId" TEXT,
    "email" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "subscriberId" TEXT,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "opensCount" INTEGER NOT NULL DEFAULT 0,
    "clicksCount" INTEGER NOT NULL DEFAULT 0,
    "resendId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "category" TEXT,
    "thumbnail" TEXT,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerConfig" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_steps" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "delayHours" INTEGER NOT NULL DEFAULT 0,
    "condition" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "icon" TEXT,
    "location" TEXT,
    "link" TEXT,
    "price" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "projectType" TEXT,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "preferredTime" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "message" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "timezone" TEXT,
    "meetingTypeId" TEXT,
    "contactId" TEXT,
    "projectId" TEXT,
    "clientId" TEXT,
    "cancellationReason" TEXT,
    "rescheduleCount" INTEGER NOT NULL DEFAULT 0,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "link" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "eventType" TEXT NOT NULL DEFAULT 'MEETING',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "attachments" TEXT,
    "recurring" TEXT,
    "recurrenceId" TEXT,
    "metadata" JSONB,
    "appointmentId" TEXT,
    "meetingTypeId" TEXT,
    "taskId" TEXT,
    "reminderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "tags" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#8b5cf6',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "remindType" TEXT NOT NULL DEFAULT 'EMAIL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "relatedType" TEXT,
    "relatedId" TEXT,
    "repeatInterval" TEXT,
    "repeatUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_exceptions" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_integrations" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "email" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "calendarId" TEXT,
    "calendarName" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "syncDirection" TEXT NOT NULL DEFAULT 'BOTH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_logs" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "folder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "siteName" TEXT,
    "tagline" TEXT,
    "description" TEXT,
    "keywords" TEXT,
    "ogImage" TEXT,
    "favicon" TEXT,
    "googleVerification" TEXT,
    "metaSuffix" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "avatar" TEXT,
    "emailVerified" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "detail" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "siteName" TEXT,
    "tagline" TEXT,
    "logo" TEXT,
    "favicon" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "social" TEXT,
    "integrations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "defaultSenderName" TEXT NOT NULL DEFAULT 'Emmett Anthony',
    "defaultSenderEmail" TEXT,
    "replyToEmail" TEXT,
    "dailySendLimit" INTEGER NOT NULL DEFAULT 500,
    "weeklySendLimit" INTEGER NOT NULL DEFAULT 3000,
    "monthlySendLimit" INTEGER NOT NULL DEFAULT 12000,
    "doubleOptIn" BOOLEAN NOT NULL DEFAULT true,
    "trackOpens" BOOLEAN NOT NULL DEFAULT true,
    "trackClicks" BOOLEAN NOT NULL DEFAULT true,
    "gdprEnabled" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribeFooter" TEXT,
    "footerHtml" TEXT,
    "signupFormConfig" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "secret" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT 'read',
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocklist_entries" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocklist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'text',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT,
    "placeholder" TEXT,
    "defaultValue" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_values" (
    "id" TEXT NOT NULL,
    "customFieldId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "label" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "features" JSONB NOT NULL,
    "deliveryTime" TEXT,
    "revisions" INTEGER NOT NULL DEFAULT 0,
    "supportDuration" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "serviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_inquiries" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "budget" TEXT,
    "message" TEXT NOT NULL,
    "status" "inquiry_status" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "fullDescription" TEXT,
    "categoryId" TEXT NOT NULL,
    "icon" TEXT,
    "featuredImage" TEXT,
    "galleryImages" JSONB NOT NULL,
    "features" JSONB NOT NULL,
    "benefits" JSONB NOT NULL,
    "technologies" JSONB NOT NULL,
    "deliverables" JSONB NOT NULL,
    "estimatedTimeline" TEXT,
    "startingPrice" DOUBLE PRECISION,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "testimonialIds" JSONB NOT NULL,
    "tags" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_profile" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "professionalTitle" TEXT NOT NULL,
    "photo" TEXT,
    "location" TEXT,
    "yearsOfExperience" DOUBLE PRECISION,
    "summary" TEXT,
    "summaryTitle" TEXT,
    "specializations" JSONB NOT NULL DEFAULT '[]',
    "socialLinks" JSONB NOT NULL DEFAULT '[]',
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "template" TEXT NOT NULL DEFAULT 'modern',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "visibility" JSONB NOT NULL DEFAULT '{"summary":true,"experience":true,"education":true,"skills":true,"certifications":true,"awards":true,"languages":true,"references":true,"featuredProjects":true}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_experiences" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'Full-Time',
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "current" BOOLEAN NOT NULL DEFAULT false,
    "responsibilities" JSONB NOT NULL DEFAULT '[]',
    "achievements" JSONB NOT NULL DEFAULT '[]',
    "technologies" JSONB NOT NULL DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_education" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT,
    "fieldOfStudy" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "grade" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_skills" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "proficiency" INTEGER NOT NULL DEFAULT 50,
    "yearsOfExperience" DOUBLE PRECISION,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_certifications" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "credentialId" TEXT,
    "credentialUrl" TEXT,
    "certificateFile" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_awards" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT,
    "date" TIMESTAMP(3),
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_languages" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL DEFAULT 'Native',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_references" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "organization" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_downloads" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'modern',
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_featured_projects" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_featured_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_versions" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_section_views" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resume_section_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PortfolioProjectToTechnology" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PortfolioProjectToTechnology_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SegmentToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SegmentToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_categories_slug_key" ON "portfolio_categories"("slug");

-- CreateIndex
CREATE INDEX "portfolio_categories_order_idx" ON "portfolio_categories"("order");

-- CreateIndex
CREATE UNIQUE INDEX "technologies_slug_key" ON "technologies"("slug");

-- CreateIndex
CREATE INDEX "technologies_category_idx" ON "technologies"("category");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_projects_slug_key" ON "portfolio_projects"("slug");

-- CreateIndex
CREATE INDEX "portfolio_projects_categoryId_idx" ON "portfolio_projects"("categoryId");

-- CreateIndex
CREATE INDEX "portfolio_projects_status_idx" ON "portfolio_projects"("status");

-- CreateIndex
CREATE INDEX "portfolio_projects_featured_idx" ON "portfolio_projects"("featured");

-- CreateIndex
CREATE INDEX "portfolio_projects_order_idx" ON "portfolio_projects"("order");

-- CreateIndex
CREATE INDEX "portfolio_projects_createdAt_idx" ON "portfolio_projects"("createdAt");

-- CreateIndex
CREATE INDEX "project_metrics_projectId_idx" ON "project_metrics"("projectId");

-- CreateIndex
CREATE INDEX "project_daily_views_projectId_idx" ON "project_daily_views"("projectId");

-- CreateIndex
CREATE INDEX "project_daily_views_date_idx" ON "project_daily_views"("date");

-- CreateIndex
CREATE UNIQUE INDEX "project_daily_views_projectId_date_key" ON "project_daily_views"("projectId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "case_studies_projectId_key" ON "case_studies"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_revisions_postId_createdAt_idx" ON "blog_revisions"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "testimonials_status_idx" ON "testimonials"("status");

-- CreateIndex
CREATE INDEX "testimonials_featured_idx" ON "testimonials"("featured");

-- CreateIndex
CREATE INDEX "testimonials_createdAt_idx" ON "testimonials"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "testimonial_categories_name_key" ON "testimonial_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "testimonial_categories_slug_key" ON "testimonial_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");

-- CreateIndex
CREATE INDEX "subscribers_email_idx" ON "subscribers"("email");

-- CreateIndex
CREATE INDEX "subscribers_status_idx" ON "subscribers"("status");

-- CreateIndex
CREATE INDEX "subscribers_source_idx" ON "subscribers"("source");

-- CreateIndex
CREATE INDEX "subscribers_country_idx" ON "subscribers"("country");

-- CreateIndex
CREATE INDEX "subscribers_createdAt_idx" ON "subscribers"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "subscriber_preferences_subscriberId_key" ON "subscriber_preferences"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "unsubscribe_reasons_subscriberId_key" ON "unsubscribe_reasons"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "segments_slug_key" ON "segments"("slug");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_createdAt_idx" ON "campaigns"("createdAt");

-- CreateIndex
CREATE INDEX "campaign_events_campaignId_eventType_idx" ON "campaign_events"("campaignId", "eventType");

-- CreateIndex
CREATE INDEX "campaign_events_subscriberId_idx" ON "campaign_events"("subscriberId");

-- CreateIndex
CREATE INDEX "campaign_events_createdAt_idx" ON "campaign_events"("createdAt");

-- CreateIndex
CREATE INDEX "email_logs_campaignId_idx" ON "email_logs"("campaignId");

-- CreateIndex
CREATE INDEX "email_logs_subscriberId_idx" ON "email_logs"("subscriberId");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "templates"("category");

-- CreateIndex
CREATE INDEX "automations_triggerType_status_idx" ON "automations"("triggerType", "status");

-- CreateIndex
CREATE INDEX "automation_steps_automationId_stepOrder_idx" ON "automation_steps"("automationId", "stepOrder");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_types_slug_key" ON "meeting_types"("slug");

-- CreateIndex
CREATE INDEX "meeting_types_slug_idx" ON "meeting_types"("slug");

-- CreateIndex
CREATE INDEX "meeting_types_isActive_idx" ON "meeting_types"("isActive");

-- CreateIndex
CREATE INDEX "appointments_email_idx" ON "appointments"("email");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_preferredDate_idx" ON "appointments"("preferredDate");

-- CreateIndex
CREATE INDEX "appointments_meetingTypeId_idx" ON "appointments"("meetingTypeId");

-- CreateIndex
CREATE INDEX "appointments_contactId_idx" ON "appointments"("contactId");

-- CreateIndex
CREATE INDEX "calendar_events_startDate_idx" ON "calendar_events"("startDate");

-- CreateIndex
CREATE INDEX "calendar_events_endDate_idx" ON "calendar_events"("endDate");

-- CreateIndex
CREATE INDEX "calendar_events_eventType_idx" ON "calendar_events"("eventType");

-- CreateIndex
CREATE INDEX "calendar_events_status_idx" ON "calendar_events"("status");

-- CreateIndex
CREATE INDEX "calendar_events_appointmentId_idx" ON "calendar_events"("appointmentId");

-- CreateIndex
CREATE INDEX "calendar_events_taskId_idx" ON "calendar_events"("taskId");

-- CreateIndex
CREATE INDEX "calendar_events_reminderId_idx" ON "calendar_events"("reminderId");

-- CreateIndex
CREATE INDEX "calendar_tasks_status_idx" ON "calendar_tasks"("status");

-- CreateIndex
CREATE INDEX "calendar_tasks_dueDate_idx" ON "calendar_tasks"("dueDate");

-- CreateIndex
CREATE INDEX "calendar_tasks_priority_idx" ON "calendar_tasks"("priority");

-- CreateIndex
CREATE INDEX "reminders_remindAt_idx" ON "reminders"("remindAt");

-- CreateIndex
CREATE INDEX "reminders_status_idx" ON "reminders"("status");

-- CreateIndex
CREATE INDEX "reminders_relatedType_relatedId_idx" ON "reminders"("relatedType", "relatedId");

-- CreateIndex
CREATE INDEX "availability_dayOfWeek_isActive_idx" ON "availability"("dayOfWeek", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "availability_dayOfWeek_key" ON "availability"("dayOfWeek");

-- CreateIndex
CREATE INDEX "date_exceptions_date_idx" ON "date_exceptions"("date");

-- CreateIndex
CREATE UNIQUE INDEX "date_exceptions_date_type_key" ON "date_exceptions"("date", "type");

-- CreateIndex
CREATE INDEX "calendar_integrations_provider_idx" ON "calendar_integrations"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_integrations_provider_email_key" ON "calendar_integrations"("provider", "email");

-- CreateIndex
CREATE INDEX "appointment_logs_appointmentId_idx" ON "appointment_logs"("appointmentId");

-- CreateIndex
CREATE INDEX "appointment_logs_createdAt_idx" ON "appointment_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "blocklist_entries_email_key" ON "blocklist_entries"("email");

-- CreateIndex
CREATE INDEX "blocklist_entries_email_idx" ON "blocklist_entries"("email");

-- CreateIndex
CREATE UNIQUE INDEX "custom_fields_slug_key" ON "custom_fields"("slug");

-- CreateIndex
CREATE INDEX "custom_fields_slug_idx" ON "custom_fields"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_values_customFieldId_subscriberId_key" ON "custom_field_values"("customFieldId", "subscriberId");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_slug_key" ON "service_categories"("slug");

-- CreateIndex
CREATE INDEX "service_categories_order_idx" ON "service_categories"("order");

-- CreateIndex
CREATE INDEX "service_packages_serviceId_order_idx" ON "service_packages"("serviceId", "order");

-- CreateIndex
CREATE INDEX "service_faqs_serviceId_order_idx" ON "service_faqs"("serviceId", "order");

-- CreateIndex
CREATE INDEX "service_inquiries_serviceId_idx" ON "service_inquiries"("serviceId");

-- CreateIndex
CREATE INDEX "service_inquiries_status_idx" ON "service_inquiries"("status");

-- CreateIndex
CREATE INDEX "service_inquiries_createdAt_idx" ON "service_inquiries"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "services_categoryId_idx" ON "services"("categoryId");

-- CreateIndex
CREATE INDEX "services_published_idx" ON "services"("published");

-- CreateIndex
CREATE INDEX "services_featured_idx" ON "services"("featured");

-- CreateIndex
CREATE INDEX "services_order_idx" ON "services"("order");

-- CreateIndex
CREATE INDEX "services_createdAt_idx" ON "services"("createdAt");

-- CreateIndex
CREATE INDEX "resume_experiences_resumeId_idx" ON "resume_experiences"("resumeId");

-- CreateIndex
CREATE INDEX "resume_experiences_order_idx" ON "resume_experiences"("order");

-- CreateIndex
CREATE INDEX "resume_education_resumeId_idx" ON "resume_education"("resumeId");

-- CreateIndex
CREATE INDEX "resume_education_order_idx" ON "resume_education"("order");

-- CreateIndex
CREATE INDEX "resume_skills_resumeId_idx" ON "resume_skills"("resumeId");

-- CreateIndex
CREATE INDEX "resume_skills_category_idx" ON "resume_skills"("category");

-- CreateIndex
CREATE INDEX "resume_skills_order_idx" ON "resume_skills"("order");

-- CreateIndex
CREATE INDEX "resume_certifications_resumeId_idx" ON "resume_certifications"("resumeId");

-- CreateIndex
CREATE INDEX "resume_certifications_order_idx" ON "resume_certifications"("order");

-- CreateIndex
CREATE INDEX "resume_awards_resumeId_idx" ON "resume_awards"("resumeId");

-- CreateIndex
CREATE INDEX "resume_awards_order_idx" ON "resume_awards"("order");

-- CreateIndex
CREATE INDEX "resume_languages_resumeId_idx" ON "resume_languages"("resumeId");

-- CreateIndex
CREATE INDEX "resume_languages_order_idx" ON "resume_languages"("order");

-- CreateIndex
CREATE INDEX "resume_references_resumeId_idx" ON "resume_references"("resumeId");

-- CreateIndex
CREATE INDEX "resume_references_order_idx" ON "resume_references"("order");

-- CreateIndex
CREATE INDEX "resume_downloads_resumeId_idx" ON "resume_downloads"("resumeId");

-- CreateIndex
CREATE INDEX "resume_downloads_downloadedAt_idx" ON "resume_downloads"("downloadedAt");

-- CreateIndex
CREATE INDEX "resume_featured_projects_resumeId_idx" ON "resume_featured_projects"("resumeId");

-- CreateIndex
CREATE INDEX "resume_featured_projects_projectId_idx" ON "resume_featured_projects"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "resume_featured_projects_resumeId_projectId_key" ON "resume_featured_projects"("resumeId", "projectId");

-- CreateIndex
CREATE INDEX "resume_versions_resumeId_idx" ON "resume_versions"("resumeId");

-- CreateIndex
CREATE INDEX "resume_versions_createdAt_idx" ON "resume_versions"("createdAt");

-- CreateIndex
CREATE INDEX "resume_section_views_resumeId_section_idx" ON "resume_section_views"("resumeId", "section");

-- CreateIndex
CREATE INDEX "resume_section_views_date_idx" ON "resume_section_views"("date");

-- CreateIndex
CREATE UNIQUE INDEX "resume_section_views_resumeId_section_date_key" ON "resume_section_views"("resumeId", "section", "date");

-- CreateIndex
CREATE INDEX "_PortfolioProjectToTechnology_B_index" ON "_PortfolioProjectToTechnology"("B");

-- CreateIndex
CREATE INDEX "_SegmentToTag_B_index" ON "_SegmentToTag"("B");

-- AddForeignKey
ALTER TABLE "lead_timeline" ADD CONSTRAINT "lead_timeline_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_projects" ADD CONSTRAINT "portfolio_projects_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "portfolio_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_metrics" ADD CONSTRAINT "project_metrics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portfolio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_daily_views" ADD CONSTRAINT "project_daily_views_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portfolio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portfolio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_revisions" ADD CONSTRAINT "blog_revisions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriber_preferences" ADD CONSTRAINT "subscriber_preferences_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unsubscribe_reasons" ADD CONSTRAINT "unsubscribe_reasons_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automations" ADD CONSTRAINT "automations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_steps" ADD CONSTRAINT "automation_steps_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_meetingTypeId_fkey" FOREIGN KEY ("meetingTypeId") REFERENCES "meeting_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_meetingTypeId_fkey" FOREIGN KEY ("meetingTypeId") REFERENCES "meeting_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "calendar_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "reminders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_logs" ADD CONSTRAINT "appointment_logs_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_faqs" ADD CONSTRAINT "service_faqs_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_inquiries" ADD CONSTRAINT "service_inquiries_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_experiences" ADD CONSTRAINT "resume_experiences_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resume_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_education" ADD CONSTRAINT "resume_education_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resume_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_skills" ADD CONSTRAINT "resume_skills_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resume_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_certifications" ADD CONSTRAINT "resume_certifications_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resume_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_awards" ADD CONSTRAINT "resume_awards_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resume_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_languages" ADD CONSTRAINT "resume_languages_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resume_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_references" ADD CONSTRAINT "resume_references_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resume_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_downloads" ADD CONSTRAINT "resume_downloads_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resume_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_featured_projects" ADD CONSTRAINT "resume_featured_projects_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resume_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_featured_projects" ADD CONSTRAINT "resume_featured_projects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portfolio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resume_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_section_views" ADD CONSTRAINT "resume_section_views_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resume_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PortfolioProjectToTechnology" ADD CONSTRAINT "_PortfolioProjectToTechnology_A_fkey" FOREIGN KEY ("A") REFERENCES "portfolio_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PortfolioProjectToTechnology" ADD CONSTRAINT "_PortfolioProjectToTechnology_B_fkey" FOREIGN KEY ("B") REFERENCES "technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SegmentToTag" ADD CONSTRAINT "_SegmentToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SegmentToTag" ADD CONSTRAINT "_SegmentToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

