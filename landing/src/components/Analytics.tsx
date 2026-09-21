"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { integrations, siteConfig } from "@/site/config";
import { initializeAnalytics, sanitizePath, trackPageView } from "@/site/analytics";
import { globalPrivacyControl } from "@/site/consent";
import { useConsent } from "./ConsentManager";

/** The page type a route belongs to, derived so no page can declare its own. */
export function pageTypeOf(pathname: string): string {
  if (siteConfig.basePath && pathname.startsWith(`${siteConfig.basePath}/`)) {
    pathname = pathname.slice(siteConfig.basePath.length);
  }
  if (pathname === "/") return "home";
  if (pathname === "/blog/") return "blog-index";
  if (pathname.startsWith("/blog/")) return "article";
  if (pathname === "/features/") return "features-index";
  if (pathname.startsWith("/features/")) return "feature";
  if (pathname === "/viewer/") return "tool";
  if (["/privacy/", "/terms/"].includes(pathname)) return "policy";
  if (pathname === "/about/") return "about";
  return "page";
}

/**
 * Mounted once, in the layout. It loads the measurement script only after
 * permission and sends exactly one page_view per navigation; automatic page
 * views are turned off so the manual call cannot be duplicated.
 */
export function Analytics() {
  const consent = useConsent();
  const pathname = usePathname();
  const pageType = pageTypeOf(pathname ?? "/");
  const lastSent = useRef<string | null>(null);
  const allowed = integrations.analytics.enabled && consent.analytics === "granted" && !globalPrivacyControl();

  useEffect(() => {
    if (!allowed) {
      lastSent.current = null;
      return;
    }
    if (!initializeAnalytics()) return;
    const path = sanitizePath(window.location.pathname);
    if (lastSent.current === path) return;
    lastSent.current = path;
    trackPageView(path, pageType);
  }, [allowed, pathname, pageType]);

  if (!allowed) return null;

  const id = integrations.analytics.measurementId;
  return (
      <Script
        id="ga-loader"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
      />
  );
}
