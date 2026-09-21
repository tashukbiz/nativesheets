import { integrations } from "./config";
import { publisherIdIsValid, slotIdIsValid, type AdConfiguration } from "./ad-configuration";
import { normalizeRoute } from "./urls";

export type AdPlacement = "article-body";

export const adPlacements: Record<AdPlacement, { slotKey: keyof typeof integrations.ads.slots }> = {
  "article-body": { slotKey: "articleBody" },
};

/**
 * Route eligibility. Policies, contact, errors and the site's own utility pages
 * carry no ad slots; substantial articles and feature pages do. The workbook viewer stays ad-free.
 */
const eligibleChildrenOf = ["/blog/", "/features/"];
const excludedRoutes = ["/", "/viewer/", "/about/", "/privacy/", "/terms/", "/404/"];

export function routeIsAdEligible(route: string): boolean {
  const normalized = normalizeRoute(route);
  if (excludedRoutes.includes(normalized)) return false;
  return eligibleChildrenOf.some(
    (prefix) => normalized.startsWith(prefix) && normalized.length > prefix.length,
  );
}

export interface AdSlotDecision {
  /** Render reserved, labelled space. */
  render: boolean;
  /** Actually request an ad from the provider. */
  request: boolean;
  /** Deterministic placeholder text, for preview only. */
  previewLabel: string | null;
  slotId: string;
  publisherId: string;
}

/**
 * Whether a slot may render and whether it may request. `live` requires a real
 * publisher ID and a real slot ID: a placeholder cannot turn ads on.
 */
export function adSlotDecision(
  placement: AdPlacement,
  route: string,
  configuration: AdConfiguration = integrations.ads,
): AdSlotDecision {
  const { state, publisherId, slots } = configuration;
  const slotId = slots[adPlacements[placement].slotKey] ?? "";
  const eligible = routeIsAdEligible(route);
  const configured = state === "live" && configuration.cmpReady && publisherIdIsValid(publisherId) && slotIdIsValid(slotId);

  if (!eligible || state === "disabled" || state === "pending-review") {
    return { render: false, request: false, previewLabel: null, slotId, publisherId };
  }
  if (state === "preview") {
    return {
      render: true,
      request: false,
      previewLabel: `Ad slot preview: ${placement}`,
      slotId,
      publisherId,
    };
  }
  return {
    render: configured,
    request: configured,
    previewLabel: null,
    slotId,
    publisherId,
  };
}

export const adsAreConfigurable = integrations.ads.state !== "disabled";
