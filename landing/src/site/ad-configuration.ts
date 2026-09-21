export type AdState = "disabled" | "preview" | "pending-review" | "live";

export interface AdConfiguration {
  state: AdState;
  publisherId: string;
  cmpReady: boolean;
  slots: Record<string, string>;
}

export const publisherIdIsValid = (id: string): boolean => /^ca-pub-\d{16}$/.test(id);
export const slotIdIsValid = (id: string): boolean => /^\d{10}$/.test(id);

export function validateAdConfiguration(configuration: AdConfiguration): void {
  if (!["disabled", "preview", "pending-review", "live"].includes(configuration.state)) {
    throw new Error("NEXT_PUBLIC_AD_STATE must be disabled, preview, pending-review or live.");
  }
  if (["pending-review", "live"].includes(configuration.state) && !publisherIdIsValid(configuration.publisherId)) {
    throw new Error("AdSense requires NEXT_PUBLIC_ADSENSE_CLIENT in ca-pub-XXXXXXXXXXXXXXXX format.");
  }
  if (configuration.state === "live") {
    if (!configuration.cmpReady) {
      throw new Error("Publish the Google CMP messages before setting NEXT_PUBLIC_ADSENSE_CMP_READY=true.");
    }
    if (!slotIdIsValid(configuration.slots.articleBody ?? "")) {
      throw new Error("Live ads require NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE from AdSense.");
    }
  }
}

export function adsTxt(configuration: AdConfiguration): string {
  return ["pending-review", "live"].includes(configuration.state) && publisherIdIsValid(configuration.publisherId)
    ? `google.com, ${configuration.publisherId.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`
    : "# Advertising is not enabled for this build.\n";
}
