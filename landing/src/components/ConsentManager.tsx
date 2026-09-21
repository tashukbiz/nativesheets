"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  consentIsRequired,
  getConsent,
  getServerConsent,
  hasDecided,
  hydrateConsent,
  requestedPurposes,
  setConsent,
  subscribeConsent,
  withdrawConsent,
} from "@/site/consent";
import { integrations } from "@/site/config";

export function useConsent() {
  useEffect(() => {
    hydrateConsent();
  }, []);
  return useSyncExternalStore(subscribeConsent, getConsent, getServerConsent);
}

/** A modal choice with equally prominent accept and reject actions. */
export function ConsentManager() {
  const consent = useConsent();
  const [panelOpen, setPanelOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const needsDecision = !hasDecided(consent);
  const isOpen = consentIsRequired && (needsDecision || panelOpen);

  useEffect(() => {
    const open = () => {
      setAnalytics(getConsent().analytics === "granted");
      setAds(getConsent().ads === "granted");
      setPanelOpen(true);
    };
    window.addEventListener("native-sheets:open-consent", open);
    return () => window.removeEventListener("native-sheets:open-consent", open);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    // Read the hydrated store to avoid flashing a dialog for a saved choice.
    if (!dialog || !isOpen || (needsDecision && hasDecided(getConsent()))) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    headingRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, needsDecision]);

  useEffect(() => {
    if (panelOpen) headingRef.current?.focus();
  }, [panelOpen]);

  const acceptAll = useCallback(() => {
    setConsent({
      analytics: requestedPurposes.analytics ? "granted" : "denied",
      ads: requestedPurposes.ads ? "granted" : "denied",
    });
    setPanelOpen(false);
  }, []);

  const rejectAll = useCallback(() => {
    withdrawConsent();
    setPanelOpen(false);
  }, []);

  const saveChoices = useCallback(() => {
    setConsent({
      analytics: analytics && requestedPurposes.analytics ? "granted" : "denied",
      ads: ads && requestedPurposes.ads ? "granted" : "denied",
    });
    setPanelOpen(false);
  }, [analytics, ads]);

  if (!consentIsRequired) return null;

  return (
    <dialog
      ref={dialogRef}
      className="consent-dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
      onCancel={(event) => {
        // Escape is an accessible rejection, never implicit permission.
        event.preventDefault();
        rejectAll();
      }}
    >
      <div className="consent-dialog__inner">
        <h2 id="consent-title" ref={headingRef} tabIndex={-1}>
          {panelOpen ? "Privacy preferences" : "Allow analytics?"}
        </h2>
        <p id="consent-description">
          We use Google Analytics to measure page visits and app download clicks.
          It loads only after you accept. Your workbook contents are never included.
        </p>
        {panelOpen && (
          <div className="consent-dialog__options">
            {requestedPurposes.analytics && (
              <label>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(event) => setAnalytics(event.target.checked)}
                />{" "}
                Measurement: page visits and app download clicks.
              </label>
            )}
            {requestedPurposes.ads && (
              <label>
                <input
                  type="checkbox"
                  checked={ads}
                  onChange={(event) => setAds(event.target.checked)}
                />{" "}
                Advertising: ads served by our advertising partner.
              </label>
            )}
          </div>
        )}
        <p>
          The site and app work with either choice. You can change your choice
          later using Analytics preferences in the footer.
        </p>
        <div className="consent-dialog__actions">
          <button type="button" className="button button--primary" onClick={rejectAll}>
            {panelOpen ? "Reject all" : "Reject"}
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={panelOpen ? saveChoices : acceptAll}
          >
            {panelOpen ? "Save choices" : "Accept"}
          </button>
        </div>
        {!panelOpen && (
          <button
            type="button"
            className="link-button consent-dialog__customize"
            onClick={() => {
              setAnalytics(false);
              setAds(false);
              setPanelOpen(true);
            }}
          >
            Choose preferences
          </button>
        )}
      </div>
    </dialog>
  );
}

/** Footer control that reopens the preference panel. */
export function ConsentPreferencesLink() {
  if (!consentIsRequired) {
    if (integrations.ads.state === "live") return null;
    return <span style={{ color: "var(--ink-faint)" }}>No optional tracking</span>;
  }
  return (
    <button
      type="button"
      className="link-button"
      style={{
        background: "none",
        border: 0,
        padding: 0,
        font: "inherit",
        color: "var(--accent)",
        textDecoration: "underline",
        cursor: "pointer",
      }}
      onClick={() => window.dispatchEvent(new Event("native-sheets:open-consent"))}
    >
      Analytics preferences
    </button>
  );
}
