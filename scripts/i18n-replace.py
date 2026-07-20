#!/usr/bin/env python3
"""Replace hardcoded strings in dashboard files with next-intl translation calls.

Only does JSX-safe replacements: >Text<, title="Text", placeholder="Text",
label: "Text" patterns. Avoids generic "Text" replacement to prevent breakage.
"""
import re, os, sys

BASE = "/Users/emmett/nextjs/emmett_portofolio"

def find_opening_brace(text, start):
    """Find the opening brace { that starts a function body after export function Name(...)"""
    i = start
    while i < len(text) and text[i] != '(':
        i += 1
    if i >= len(text):
        return -1
    # Now balance the parens
    depth = 1
    i += 1
    while i < len(text) and depth > 0:
        if text[i] == '(':
            depth += 1
        elif text[i] == ')':
            depth -= 1
        i += 1
    # Skip whitespace and possible colon/type annotations after parens
    while i < len(text) and text[i] in ' \t\n\r:':
        i += 1
    # Now skip any TypeScript return type annotation like ': JSX.Element'
    if i < len(text) and text[i].isalpha() or text[i] in '<>':
        while i < len(text) and text[i] not in '{':
            i += 1
    # Find the opening brace
    while i < len(text) and text[i] != '{':
        i += 1
    if i < len(text) and text[i] == '{':
        return i
    return -1

def get_base(fpath):
    if fpath.startswith("src/"):
        return BASE
    return BASE

def process(fpath, ns, replacements):
    full = os.path.join(BASE, fpath)
    if not os.path.exists(full):
        print(f"  SKIP {fpath}")
        return
    with open(full) as f:
        content = f.read()
    orig = content

    # Add import if not present
    if 'from "@/lib/i18n"' not in content:
        lines = content.split("\n")
        insert_after = 0
        for i, line in enumerate(lines):
            if line.startswith("import ") or line.startswith('"use ') or line.startswith("'"):
                insert_after = i + 1
        lines.insert(insert_after, 'import { useTranslations } from "@/lib/i18n";')
        content = "\n".join(lines)

    # Add const t hook if not present
    marker = f'useTranslations("{ns}")'
    if marker not in content:
        # Match export function / export default function and find the opening { of the body
        pat = re.compile(r'(export\s+(?:default\s+)?(?:async\s+)?function\s+\w+)', re.DOTALL)
        m = pat.search(content)
        if m:
            fn_start = m.start()
            # Find the opening brace of the function body
            brace_pos = find_opening_brace(content, fn_start)
            if brace_pos > 0:
                content = content[:brace_pos + 1] + f'\n  const t = useTranslations("{ns}");' + content[brace_pos + 1:]

    # Apply replacements — only JSX-safe patterns
    for old, new in replacements:
        # >Text<  (most common JSX text pattern)
        content = content.replace(f'>{old}<', f'>{new}<')
        # title="Text"
        content = content.replace(f'title="{old}"', f'title={{{new}}}')
        content = content.replace(f"title='{old}'", f"title={{{new}}}")
        # placeholder="Text"
        content = content.replace(f'placeholder="{old}"', f'placeholder={{{new}}}')
        content = content.replace(f"placeholder='{old}'", f"placeholder={{{new}}}")
        # aria-label="Text"
        content = content.replace(f'aria-label="{old}"', f'aria-label={{{new}}}')
        # label: "Text" in JS objects
        content = content.replace(f'label: "{old}"', f'label: {new}')
        content = content.replace(f"label: '{old}'", f"label: {new}")

    if content != orig:
        with open(full, "w") as f:
            f.write(content)
        print(f"  OK  {fpath}")
    else:
        print(f"  --  {fpath}")

files = [
    # === Newsletter (dashboard.newsletter) ===
    ("src/app/dashboard/newsletter/page.tsx", "dashboard.newsletter", [
        (">No campaigns yet<", '{t("empty")}'),
    ]),
    ("src/app/dashboard/newsletter/segments/page.tsx", "dashboard.newsletter", [
        (">No segments created<", '{t("empty")}'),
    ]),
    ("src/app/dashboard/newsletter/templates/page.tsx", "dashboard.newsletter", [
        (">No templates found<", '{t("empty")}'),
    ]),
    ("src/app/dashboard/newsletter/subscribers/page.tsx", "dashboard.newsletter", [
        (">No subscribers found<", '{t("empty")}'),
    ]),
    ("src/app/dashboard/newsletter/campaigns/page.tsx", "dashboard.newsletter", [
        (">No campaigns found<", '{t("empty")}'),
    ]),
    ("src/app/dashboard/newsletter/automation/page.tsx", "dashboard.newsletter", [
        (">No automations found<", '{t("empty")}'),
    ]),
    ("src/app/dashboard/newsletter/webhooks/page.tsx", "dashboard.newsletter", [
        (">No webhooks yet<", '{t("empty")}'),
    ]),
    ("src/app/dashboard/newsletter/custom-fields/page.tsx", "dashboard.newsletter", [
        (">No custom fields yet<", '{t("empty")}'),
    ]),
    ("src/app/dashboard/newsletter/tags/page.tsx", "dashboard.newsletter", [
        (">No tags created<", '{t("empty")}'),
    ]),
    ("src/app/dashboard/newsletter/blocklist/page.tsx", "dashboard.newsletter", [
        (">Blocklist is empty<", '{t("empty")}'),
    ]),
    ("src/app/dashboard/newsletter/api-keys/page.tsx", "dashboard.newsletter", [
        (">No API keys yet<", '{t("empty")}'),
    ]),
    ("src/app/dashboard/newsletter/rss-to-email/page.tsx", "dashboard.newsletter", [
        (">No feed preview<", '{t("empty")}'),
        (">No items found<", '{t("noItems")}'),
    ]),

    # === Services (dashboard.services) ===
    ("src/app/dashboard/services/page.tsx", "dashboard.services", [
        (">No services found<", '{t("empty")}'),
        (">Create Service<", '{t("createService")}'),
        (">Search services...<", '{t("search")}'),
        (">Services<", '{t("title")}'),
        (">Analytics<", '{t("analytics")}'),
        (">Categories<", '{t("categories")}'),
        (">Delete<", '{t("delete")}'),
        (">Delete All<", '{t("deleteAll")}'),
        (">Cancel<", '{t("cancel")}'),
        (">Published<", '{t("published")}'),
        (">Publish<", '{t("publish")}'),
        (">Unpublish<", '{t("unpublish")}'),
        (">Feature<", '{t("feature")}'),
        (">Unfeature<", '{t("unfeature")}'),
        (">Clear<", '{t("clear")}'),
        (">Page {data.page} of {data.totalPages}<", '{t("pageOf", {page: data.page, total: data.totalPages})}'),
        ("title=\"Delete Service\"", 'title={t("deleteService")}'),
        ("title=\"Delete\"", 'title={t("delete")}'),
    ]),
    ("src/app/dashboard/services/analytics/page.tsx", "dashboard.services", [
        (">Services Analytics<", '{t("analytics")}'),
        (">No data yet<", '{t("noData")}'),
    ]),
    ("src/app/dashboard/services/inquiries/page.tsx", "dashboard.services", [
        (">Inquiries<", '{t("inquiries")}'),
        (">No inquiries found<", '{t("empty")}'),
        (">All<", '{t("all")}'),
        (">Inquiry Details<", '{t("inquiryDetails")}'),
        (">Update Status<", '{t("updateStatus")}'),
        (">Select status...<", '{t("selectStatus")}'),
        (">Update<", '{t("update")}'),
    ]),
    ("src/app/dashboard/services/packages/page.tsx", "dashboard.services", [
        (">Packages<", '{t("packages")}'),
        (">No packages found<", '{t("empty")}'),
        (">Search packages...<", '{t("search")}'),
    ]),
    ("src/app/dashboard/services/categories/page.tsx", "dashboard.services", [
        (">Categories<", '{t("categories")}'),
        (">Add Category<", '{t("addCategory")}'),
        (">No categories yet<", '{t("empty")}'),
        (">Edit Category<", '{t("editCategory")}'),
        (">Cancel<", '{t("cancel")}'),
        (">Update<", '{t("update")}'),
        (">Create<", '{t("create")}'),
        (">Delete<", '{t("delete")}'),
        (">Delete Category<", '{t("deleteCategory")}'),
    ]),

    # === Notifications (dashboard.notifications) ===
    ("src/app/dashboard/notifications/page.tsx", "dashboard.notifications", [
        (">Notifications<", '{t("notifications")}'),
        (">Mark All Read<", '{t("markAllRead")}'),
        (">Filters<", '{t("filters")}'),
        (">No notifications<", '{t("empty")}'),
        (">Select all<", '{t("selectAll")}'),
        ("title=\"View details\"", 'title={t("viewDetails")}'),
        ("title=\"Mark as read\"", 'title={t("markAsRead")}'),
        ("title=\"Delete\"", 'title={t("delete")}'),
        (">Mark Read<", '{t("markRead")}'),
        (">Archive<", '{t("archive")}'),
        (">Previous<", '{t("previous")}'),
        (">Next<", '{t("next")}'),
    ]),
    ("src/app/dashboard/notifications/analytics/page.tsx", "dashboard.notifications", [
        (">Notification Analytics<", '{t("analytics")}'),
        (">Total Sent<", '{t("totalSent")}'),
        (">Read Rate<", '{t("readRate")}'),
        (">Delivered<", '{t("delivered")}'),
        (">Delivery Success<", '{t("deliverySuccess")}'),
        (">By Category<", '{t("byCategory")}'),
        (">By Priority<", '{t("byPriority")}'),
        (">Daily Notification Activity<", '{t("dailyActivity")}'),
        (">Delivery by Channel<", '{t("deliveryByChannel")}'),
        (">Sent<", '{t("sent")}'),
        (">Failed<", '{t("failed")}'),
    ]),
    ("src/app/dashboard/notifications/inbox/page.tsx", "dashboard.notifications", [
        (">Inbox<", '{t("inbox")}'),
        (">Search notifications...<", '{t("search")}'),
        (">All<", '{t("all")}'),
        (">Mark Read<", '{t("markRead")}'),
        (">Archive<", '{t("archive")}'),
        (">Delete<", '{t("delete")}'),
        (">Clear<", '{t("clear")}'),
        (">Select all<", '{t("selectAll")}'),
        (">Failed to load<", '{t("failedToLoad")}'),
        (">Retry<", '{t("retry")}'),
        (">Inbox is empty<", '{t("empty")}'),
        (">Load more<", '{t("loadMore")}'),
        ("title=\"Mark as read\"", 'title={t("markAsRead")}'),
        ("title=\"Delete\"", 'title={t("delete")}'),
    ]),

    # === Testimonials (dashboard.testimonials) ===
    ("src/app/dashboard/testimonials/page.tsx", "dashboard.testimonials", [
        (">Testimonials<", '{t("testimonials")}'),
        (">Add Testimonial<", '{t("addTestimonial")}'),
        (">Categories<", '{t("categories")}'),
        (">No testimonials found.<", '{t("empty")}'),
        (">Delete Testimonial<", '{t("deleteTitle")}'),
        (">Cancel<", '{t("cancel")}'),
        (">Deleting...<", '{t("deleting")}'),
        (">Edit Testimonial<", '{t("editTestimonial")}'),
        (">New Testimonial<", '{t("newTestimonial")}'),
        (">Saving...<", '{t("saving")}'),
        (">Update<", '{t("update")}'),
        (">Create<", '{t("create")}'),
        (">Preview<", '{t("preview")}'),
        (">Edit<", '{t("edit")}'),
        (">Archive<", '{t("archive")}'),
        (">Restore<", '{t("restore")}'),
        (">Previous<", '{t("previous")}'),
        (">Next<", '{t("next")}'),
        ("title=\"Preview\"", 'title={t("preview")}'),
        ("title=\"Edit\"", 'title={t("edit")}'),
        ("title=\"Duplicate\"", 'title={t("duplicate")}'),
        ("title=\"Restore\"", 'title={t("restore")}'),
        ("title=\"Archive\"", 'title={t("archive")}'),
        ("title=\"Delete\"", 'title={t("delete")}'),
        (">Approve<", '{t("approve")}'),
        (">Reject<", '{t("reject")}'),
        (">Feature<", '{t("feature")}'),
        (">Duplicate<", '{t("duplicate")}'),
        (">Delete<", '{t("delete")}'),
        (">All Status<", '{t("allStatus")}'),
        (">Search by name, company, content...<", '{t("search")}'),
        (">Newest First<", '{t("newestFirst")}'),
        (">Oldest First<", '{t("oldestFirst")}'),
        (">Name A-Z<", '{t("nameAZ")}'),
        (">Name Z-A<", '{t("nameZA")}'),
        (">Highest Rating<", '{t("highestRating")}'),
        (">Lowest Rating<", '{t("lowestRating")}'),
        (">Order Asc<", '{t("orderAsc")}'),
        (">Draft auto-saved<", '{t("draftAutoSaved")}'),
        (">Pending Review<", '{t("pendingReview")}'),
        (">Approved<", '{t("approved")}'),
        (">Rejected<", '{t("rejected")}'),
        (">Client<", '{t("client")}'),
        (">Rating<", '{t("rating")}'),
        (">Date<", '{t("date")}'),
        (">Actions<", '{t("actions")}'),
        (">Delete<", '{t("delete")}'),
    ]),

    # === Calendar (dashboard.calendar) ===
    ("src/app/dashboard/calendar/page.tsx", "dashboard.calendar", [
        (">Upcoming<", '{t("upcoming")}'),
        (">Overdue Tasks<", '{t("overdueTasks")}'),
        (">Completed<", '{t("completed")}'),
        (">Pending<", '{t("pending")}'),
        (">Search events...<", '{t("search")}'),
        (">All Types<", '{t("allTypes")}'),
        (">Meeting<", '{t("meeting")}'),
        (">Consultation<", '{t("consultation")}'),
        (">Deadline<", '{t("deadline")}'),
        (">Personal<", '{t("personal")}'),
        (">Task<", '{t("task")}'),
        (">Reminder<", '{t("reminder")}'),
        (">New Event<", '{t("newEvent")}'),
    ]),

    # === Security (dashboard.security) ===
    ("src/app/dashboard/activity/security/page.tsx", "dashboard.security", [
        (">Security Dashboard<", '{t("title")}'),
        (">Filters<", '{t("filters")}'),
        (">Total Events<", '{t("totalEvents")}'),
        (">Unresolved<", '{t("unresolved")}'),
        (">Resolved<", '{t("resolved")}'),
        (">All Events<", '{t("allEvents")}'),
        (">All Severities<", '{t("allSeverities")}'),
        (">All<", '{t("all")}'),
        (">Start Date<", '{t("startDate")}'),
        (">End Date<", '{t("endDate")}'),
        (">No security events found<", '{t("empty")}'),
        (">Previous<", '{t("previous")}'),
        (">Next<", '{t("next")}'),
        ("title=\"Mark as resolved\"", 'title={t("markAsResolved")}'),
    ]),

    # === Resume (dashboard.resume) ===
    ("src/app/dashboard/resume/preview/page.tsx", "dashboard.resume", [
        (">Resume Preview<", '{t("title")}'),
        (">Published<", '{t("published")}'),
        (">Draft<", '{t("draft")}'),
        (">Open Live<", '{t("openLive")}'),
        (">Save Template<", '{t("saveTemplate")}'),
        (">No resume profile yet<", '{t("empty")}'),
        (">Create Profile<", '{t("createProfile")}'),
    ]),
    
    # === Campaign new (dashboard.newsletter) ===
    ("src/app/dashboard/newsletter/campaigns/new/page.tsx", "dashboard.newsletter", [
        (">Create Campaign<", '{t("createCampaign")}'),
    ]),
    
    # === Campaign [id] (dashboard.newsletter) ===
    ("src/app/dashboard/newsletter/campaigns/[id]/page.tsx", "dashboard.newsletter", [
        (">Campaign Details<", '{t("campaignDetails")}'),
        (">Send Test<", '{t("sendTest")}'),
        (">Preview in Browser<", '{t("previewInBrowser")}'),
    ]),

    # === Settings form-fields (dashboard.settings) ===
    ("src/app/dashboard/settings/form-fields/page.tsx", "dashboard.settings", [
        ('title="Order"', 'title={t("order")}'),
        ("Project Types", '{t("projectTypes")}'),
        ("Budget Ranges", '{t("budgetRanges")}'),
        ("Timeline Options", '{t("timelineOptions")}'),
    ]),
    
    # === Contact FAQs (dashboard.faqs) ===
    ("src/app/dashboard/contact/faqs/page.tsx", "dashboard.faqs", [
        (">Hide<", '{t("hide")}'),
        (">Publish<", '{t("publish")}'),
    ]),

    # === Components ===
    # LeadQualificationWizard (dashboard.leadWizard)
    ("src/components/dashboard/LeadQualificationWizard.tsx", "dashboard.leadWizard", [
        (">Lead Qualification Wizard<", '{t("title")}'),
        (">Step {currentStep} of {totalSteps}<", '{t("stepOf", {step: currentStep, total: totalSteps})}'),
        (">Contact Information<", '{t("contactInfo")}'),
        (">Project Scope<", '{t("projectScope")}'),
        (">Project Details<", '{t("projectDetails")}'),
        (">Review & Submit<", '{t("reviewSubmit")}'),
        (">Cancel<", '{t("cancel")}'),
        (">Save Draft<", '{t("saveDraft")}'),
        (">Back<", '{t("back")}'),
        (">Next<", '{t("next")}'),
        (">Submit<", '{t("submit")}'),
        (">Submitting...<", '{t("submitting")}'),
    ]),
    
    # ChatTriggerPreview (dashboard.chatPreview)
    ("src/components/dashboard/ChatTriggerPreview.tsx", "dashboard.chatPreview", [
        (">Type your message...<", '{t("typeMessage")}'),
        (">Chat Preview<", '{t("title")}'),
        (">Welcome Message<", '{t("welcomeMessage")}'),
        (">Exit Intent<", '{t("exitIntent")}'),
    ]),
    
    # CalendarOverviewWidgets (dashboard.calendarWidgets)
    ("src/components/dashboard/CalendarOverviewWidgets.tsx", "dashboard.calendarWidgets", [
        (">Today's Events<", '{t("todaysEvents")}'),
        (">Upcoming Appointments<", '{t("upcomingAppointments")}'),
        (">Overdue Tasks<", '{t("overdueTasks")}'),
        (">Appointments<", '{t("appointments")}'),
        (">No events today<", '{t("noEventsToday")}'),
        (">No upcoming appointments<", '{t("noUpcomingAppointments")}'),
        (">No overdue tasks<", '{t("noOverdueTasks")}'),
        (">View all<", '{t("viewAll")}'),
    ]),
    
    # RichTextEditor (dashboard.richTextEditor)
    ("src/components/dashboard/RichTextEditor.tsx", "dashboard.richTextEditor", [
        ('placeholder="Start typing..."', 'placeholder={t("startTyping")}'),
        (">AI<", '{t("ai")}'),
        (">Write with AI...<", '{t("writeWithAI")}'),
        (">Format<", '{t("format")}'),
        (">Insert<", '{t("insert")}'),
        (">Table<", '{t("table")}'),
        (">Image<", '{t("image")}'),
        (">Video<", '{t("video")}'),
        (">Link<", '{t("link")}'),
        (">Embeds<", '{t("embeds")}'),
        (">Media<", '{t("media")}'),
        (">Grid<", '{t("grid")}'),
        (">History<", '{t("history")}'),
        (">Font Color<", '{t("fontColor")}'),
        (">Highlight<", '{t("highlight")}'),
        (">Align<", '{t("align")}'),
        (">Clear formatting<", '{t("clearFormatting")}'),
        (">Table of Contents<", '{t("tableOfContents")}'),
        (">Read Time<", '{t("readTime")}'),
        (">Word Count<", '{t("wordCount")}'),
        (">Focus Mode<", '{t("focusMode")}'),
        (">Shortcuts<", '{t("shortcuts")}'),
        (">Auto-saved<", '{t("autoSaved")}'),
        (">Unsaved changes<", '{t("unsavedChanges")}'),
        (">Characters<", '{t("characters")}'),
        (">words<", '{t("words")}'),
        (">auto<", '{t("auto")}'),
        (">Save<", '{t("save")}'),
        (">Loading...<", '{t("loading")}'),
    ]),
    
    # Media browser (dashboard.richTextEditor)
    ("src/components/dashboard/RichTextEditor/media-browser.tsx", "dashboard.richTextEditor", [
        (">Media Library<", '{t("mediaLibrary")}'),
        ('placeholder="Search media..."', 'placeholder={t("searchMedia")}'),
        (">No matching media<", '{t("noMatchingMedia")}'),
        (">No media uploaded yet<", '{t("noMediaYet")}'),
        ('title="Delete"', 'title={t("delete")}'),
    ]),
    
    # Revision history (dashboard.richTextEditor)
    ("src/components/dashboard/RichTextEditor/revision-history.tsx", "dashboard.richTextEditor", [
        ('title="Revision history"', 'title={t("revisionHistory")}'),
        (">History<", '{t("history")}'),
        (">Revision History<", '{t("revisionHistory")}'),
        (">No revisions yet<", '{t("noRevisionsYet")}'),
        ('title="Restore this revision"', 'title={t("restoreRevision")}'),
        (">Close<", '{t("close")}'),
    ]),
    
    # Image grid (dashboard.richTextEditor)
    ("src/components/dashboard/RichTextEditor/image-grid.tsx", "dashboard.richTextEditor", [
        ('title="Remove image"', 'title={t("removeImage")}'),
        (">Uploading...<", '{t("uploading")}'),
        (">Add image<", '{t("addImage")}'),
        (">Click or drag & drop<", '{t("clickOrDragDrop")}'),
    ]),

    # NotificationDropdown (dashboard.notifications)
    ("src/components/notifications/NotificationDropdown.tsx", "dashboard.notifications", [
        (">Notifications<", '{t("notifications")}'),
        ('title="Mute notification sounds"', 'title={t("muteSounds")}'),
        ('title="Enable notification sounds"', 'title={t("enableSounds")}'),
        ('title="Mark all as read"', 'title={t("markAllAsRead")}'),
        (">No new notifications<", '{t("empty")}'),
        (">You're all caught up!<", '{t("allCaughtUp")}'),
        ('title="Mark as read"', 'title={t("markAsRead")}'),
        ('title="Delete"', 'title={t("delete")}'),
        (">View all notifications<", '{t("viewAllNotifications")}'),
    ]),
    
    # NotificationBell (dashboard.notifications)
    ("src/components/notifications/NotificationBell.tsx", "dashboard.notifications", [
        ('aria-label="Notifications', 'aria-label={t("notificationsAria")}'),
        ('title="Real-time connected"', 'title={t("realtimeConnected")}'),
        ('title="Real-time disconnected — polling"', 'title={t("realtimeDisconnected")}'),
    ]),
    
    # NotificationsWidget (dashboard.notifications)
    ("src/components/notifications/NotificationsWidget.tsx", "dashboard.notifications", [
        (">Priority Alerts<", '{t("priorityAlerts")}'),
        (">Unread<", '{t("unread")}'),
        (">Read Rate<", '{t("readRate")}'),
        (">Delivery Rate<", '{t("deliveryRate")}'),
        (">Recent Notifications<", '{t("recentNotifications")}'),
        (">View all<", '{t("viewAll")}'),
        (">No new notifications<", '{t("empty")}'),
    ]),
]

if __name__ == "__main__":
    for fpath, ns, replacements in files:
        process(fpath, ns, replacements)
    print("\nDone!")
