"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals/attribution";

type MetricName = "CLS" | "FCP" | "INP" | "LCP" | "TTFB";

function getRating(name: MetricName, value: number): "good" | "needs-improvement" | "poor" {
  const thresholds: Record<MetricName, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FCP: { good: 1800, poor: 3000 },
    CLS: { good: 0.1, poor: 0.25 },
    INP: { good: 200, poor: 500 },
    TTFB: { good: 800, poor: 1800 },
  };

  const t = thresholds[name];
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

function sendToAnalytics(metric: {
  name: MetricName;
  value: number;
  rating: string;
  id: string;
  attribution?: Record<string, string>;
}) {
  // In development, log to the console
  if (process.env.NODE_ENV === "development") {
    const prefix = metric.rating === "good" ? "🟢" : metric.rating === "needs-improvement" ? "🟡" : "🔴";
    console.log(
      `%c${prefix} ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      "font-weight: bold"
    );
    if (metric.attribution) {
      console.log("  Attribution:", metric.attribution);
    }
    return;
  }

  // Report to Google Analytics via gtag if available
  // (gtag was already configured with the GA ID in GoogleAnalytics component)
  if (typeof window.gtag === "function") {
    window.gtag("event", metric.name, {
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_id: metric.id,
      non_interaction: true,
      ...metric.attribution,
    });
  }

  // Also report via dataLayer for GTM users
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: "web_vitals",
      event_category: "Web Vitals",
      event_label: metric.id,
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      non_interaction: true,
    });
  }
}

export function WebVitals() {
  useEffect(() => {
    // LCP — Largest Contentful Paint
    onLCP(({ value, id, attribution }) => {
      sendToAnalytics({
        name: "LCP",
        value,
        rating: getRating("LCP", value),
        id,
        attribution: {
          lcp_target: attribution.target || "",
          lcp_url: attribution.url || "",
          resource_load_duration: attribution.resourceLoadDuration.toFixed(0),
          element_render_delay: attribution.elementRenderDelay.toFixed(0),
        },
      });
    });

    // CLS — Cumulative Layout Shift
    onCLS(({ value, id, attribution }) => {
      sendToAnalytics({
        name: "CLS",
        value,
        rating: getRating("CLS", value),
        id,
        attribution: {
          largest_shift_target: attribution.largestShiftTarget || "",
          largest_shift_time: attribution.largestShiftTime?.toFixed(0) || "",
        },
      });
    });

    // INP — Interaction to Next Paint
    onINP(({ value, id, attribution }) => {
      sendToAnalytics({
        name: "INP",
        value,
        rating: getRating("INP", value),
        id,
        attribution: {
          interaction_type: attribution.interactionType || "",
          interaction_target: attribution.interactionTarget || "",
          interaction_time: attribution.interactionTime?.toFixed(0) || "",
          input_delay: attribution.inputDelay.toFixed(0),
          processing_duration: attribution.processingDuration.toFixed(0),
          presentation_delay: attribution.presentationDelay.toFixed(0),
        },
      });
    });

    // FCP — First Contentful Paint
    onFCP(({ value, id, attribution }) => {
      sendToAnalytics({
        name: "FCP",
        value,
        rating: getRating("FCP", value),
        id,
        attribution: {
          time_to_first_byte: attribution.timeToFirstByte.toFixed(0),
          first_byte_to_fcp: attribution.firstByteToFCP.toFixed(0),
        },
      });
    });

    // TTFB — Time to First Byte
    onTTFB(({ value, id, attribution }) => {
      sendToAnalytics({
        name: "TTFB",
        value,
        rating: getRating("TTFB", value),
        id,
        attribution: {
          wait_time: attribution.waitingDuration.toFixed(0),
          dns_time: attribution.dnsDuration.toFixed(0),
          connection_time: attribution.connectionDuration.toFixed(0),
          request_time: attribution.requestDuration.toFixed(0),
          cache_time: attribution.cacheDuration.toFixed(0),
        },
      });
    });
  }, []);

  // This component doesn't render anything visible
  return null;
}
