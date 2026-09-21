import { integrations, siteConfig } from "./config";
import { getConsent, globalPrivacyControl } from "./consent";
import { download } from "./product";

/** The event vocabulary. Nothing outside this map is sent. */
export interface AnalyticsEvents {
  page_view: { page_path: string; page_type: string; profile: string };
  file_download: { file_name: string; file_extension: string; link_url: string; link_id: string; placement: string };
}

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

/**
 * Strips query strings and fragments before a path is transmitted. Tool inputs,
 * file names and tokens must never reach the provider.
 */
export function sanitizePath(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] ?? "/";
  return withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
}

export function analyticsAllowed(): boolean {
  return integrations.analytics.enabled && getConsent().analytics === "granted" && !globalPrivacyControl();
}

let initialized = false;

/** Queue configuration synchronously so the first event cannot outrun the loader. */
export function initializeAnalytics(): boolean {
  if (typeof window === "undefined" || !analyticsAllowed()) return false;
  const id = integrations.analytics.measurementId;
  (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = false;
  if (initialized) return true;
  window.dataLayer = window.dataLayer || [];
  // Google's gtag command queue expects the function's Arguments object.
  // eslint-disable-next-line prefer-rest-params
  window.gtag = window.gtag || function () { window.dataLayer?.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", id, {
    send_page_view: false,
    page_location: safePageUrl(window.location.href),
    page_referrer: safePageUrl(document.referrer),
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_path: siteConfig.basePath || "/",
    cookie_prefix: "native_sheets",
  });
  initialized = true;
  return true;
}

/** Only web-page origins and paths, never query strings or fragments. */
export function safePageUrl(value: string): string {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? `${url.origin}${url.pathname}` : "";
  } catch {
    return "";
  }
}

export function track<K extends keyof AnalyticsEvents>(
  event: K,
  params: AnalyticsEvents[K],
): void {
  if (!initializeAnalytics()) return;
  const gtag = window.gtag;
  if (!gtag) return;
  const pageLocation = safePageUrl(window.location.href);
  // Also update automatic engagement hits with the current, sanitised location.
  gtag("set", { page_location: pageLocation, page_referrer: safePageUrl(document.referrer) });
  gtag("event", event, {
    ...params, profile: siteConfig.profile, page_location: pageLocation,
    page_referrer: safePageUrl(document.referrer), send_to: integrations.analytics.measurementId,
    page_title: document.title,
  });
}

export type DownloadPlacement = "header" | "hero" | "installation" | "bottom";

export function trackDownload(placement: DownloadPlacement): void {
  track("file_download", {
    file_name: download.fileName,
    file_extension: "zip",
    link_url: download.absoluteUrl,
    link_id: `download-${placement}`,
    placement,
  });
}

export function trackPageView(path: string, pageType: string): void {
  track("page_view", {
    page_path: sanitizePath(path),
    page_type: pageType,
    profile: siteConfig.profile,
  });
}
