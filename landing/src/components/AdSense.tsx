"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { integrations, siteConfig } from "@/site/config";
import { normalizeRoute } from "@/site/urls";

declare global {
  interface Window {
    adsbygoogle?: { push: (entry: Record<string, never>) => unknown };
    googlefc?: {
      callbackQueue: { push: (entry: Record<string, () => void>) => unknown };
      showRevocationMessage?: () => void;
    };
  }
}

const AdReady = createContext(false);
const subscribe = () => () => {};
const browserAllowsAds = () => !(navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
const serverAllowsAds = () => false;

export const useAdSenseReady = () => useContext(AdReady);

/** Google receives consent directly from its published, certified CMP. */
export function AdSense({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const route = normalizeRoute(siteConfig.basePath && pathname.startsWith(`${siteConfig.basePath}/`)
    ? pathname.slice(siteConfig.basePath.length) : pathname);
  const allowed = useSyncExternalStore(subscribe, browserAllowsAds, serverAllowsAds);
  const [ready, setReady] = useState(false);
  const enabled = integrations.ads.state === "live" && integrations.ads.cmpReady && allowed && route !== "/viewer/";

  function waitForConsent() {
    window.googlefc = window.googlefc || { callbackQueue: [] as Record<string, () => void>[] };
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || ([] as Record<string, () => void>[]);
    window.googlefc.callbackQueue.push({ CONSENT_DATA_READY: () => setReady(true) });
  }

  return (
    <AdReady.Provider value={enabled && ready}>
      {children}
      {enabled && (
        <Script
          id="adsense-loader"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${integrations.ads.publisherId}`}
          onReady={waitForConsent}
        />
      )}
    </AdReady.Provider>
  );
}

export function AdvertisingPreferencesLink() {
  const [unavailable, setUnavailable] = useState(false);
  if (integrations.ads.state !== "live") return null;
  return (
    <span>
      <button type="button" className="link-button" onClick={() => {
        if (!browserAllowsAds()) {
          setUnavailable(true);
          return;
        }
        if (!window.googlefc?.showRevocationMessage) {
          setUnavailable(true);
          return;
        }
        window.googlefc.callbackQueue.push({
          CONSENT_API_READY: () => window.googlefc?.showRevocationMessage?.(),
        });
      }}>
        Advertising privacy settings
      </button>
      {unavailable && <span role="status">{browserAllowsAds()
        ? " Advertising settings are unavailable on this page. Open the Privacy page; if the message is blocked, check your browser settings."
        : " Your browser’s Global Privacy Control is enabled, so advertising is disabled."}</span>}
    </span>
  );
}
