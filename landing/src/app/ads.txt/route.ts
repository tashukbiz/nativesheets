import { integrations } from "@/site/config";
import { adsTxt } from "@/site/ad-configuration";

export const dynamic = "force-static";

export function GET() {
  return new Response(adsTxt(integrations.ads), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
