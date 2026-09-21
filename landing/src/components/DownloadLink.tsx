"use client";

import type { ReactNode } from "react";
import { download } from "@/site/product";
import { trackDownload, type DownloadPlacement } from "@/site/analytics";

/** Tracking never intercepts or delays the actual file download. */
export function DownloadLink({ placement, children }: { placement: DownloadPlacement; children: ReactNode }) {
  return (
    <a
      id={`download-${placement}`}
      className="button button--primary"
      href={download.url}
      onClick={() => trackDownload(placement)}
      onAuxClick={(event) => { if (event.button === 1) trackDownload(placement); }}
    >
      {children}
    </a>
  );
}
