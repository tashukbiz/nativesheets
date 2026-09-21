import NextLink from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { integrations } from "@/site/config";
import { assetPath } from "@/site/urls";

/** A new document unloads advertising code before entering the local workbook viewer. */
export default function SiteLink({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  if (integrations.ads.state === "live") {
    return <a {...props} href={href.startsWith("/") ? assetPath(href) : href} />;
  }
  return <NextLink {...props} href={href} />;
}
