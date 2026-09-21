# Landing site

The website for Native Sheets. Next.js App Router, static export, no backend.

Published to GitHub Pages at https://tashukbiz.github.io/nativesheets/ by `.github/workflows/pages.yml` on every push to `main`.

```bash
pnpm install
pnpm dev
```

## Commands

| Command | Action |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | Exports the static site to `out/` |
| `pnpm preview` | Serves `out/` at http://localhost:4173 |
| `pnpm check` | Typecheck, lint, test, build and verify |

`pnpm verify` compares the sitemap against the exported HTML files. It checks canonicals, social metadata, JSON-LD, internal links, orphan routes and placeholder text. Any disagreement fails the build.

## Configuration

Build-time environment variables. Local builds default to ads disabled. The GitHub Pages workflow defaults to `pending-review` with the publisher ID below; repository Actions variables override those defaults.

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_SITE_ORIGIN` | Public origin. Must be HTTPS. Without it, every page gets `noindex` |
| `NEXT_PUBLIC_BASE_PATH` | Sub-path for a project site. `/nativesheets` here |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Enables analytics and the consent banner |
| `NEXT_PUBLIC_AD_STATE` | `disabled`, `preview`, `pending-review` or `live` |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Publisher ID. Required for `pending-review` and `live` |
| `NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE` | Slot ID for article pages |
| `NEXT_PUBLIC_ADSENSE_CMP_READY` | Set to `true` only after publishing and checking Google consent messages |

## Content

Content is typed records under `src/site/content/`. There is no CMS.

1. Add a file under `src/site/content/articles/` or `features/`. Export one `ContentRecord`.
2. Register it in `src/site/content/index.ts`.
3. Run `pnpm content:validate`.

The registry validates on import. A broken record fails the build. Records with `status: "draft"` do not appear in listings or the sitemap.

## Ads

The AdSense site is `tashukbiz.github.io`, publisher `ca-pub-7074622316308983`. AdSense does not accept the `/nativesheets/` subdirectory as a separate site.

The dedicated responsive display unit is **Native Sheets — Article display**, slot `2864779511`. European and US state consent messages are published for this site. The European message includes a reject option; the US message covers all current and future supported states. Live serving remains disabled until site approval and verification of the published consent flow.

- `disabled`: no ad script, slot, publisher verification tag or seller entry.
- `preview`: labelled layout placeholders only; never requests Google ads.
- `pending-review`: verification meta tag on every page plus exported `ads.txt`; no ad scripts or slots. This is the deployment default while Google reviews the site.
- `live`: requires a publisher ID, article slot ID and `NEXT_PUBLIC_ADSENSE_CMP_READY=true`. Invalid configurations fail the build.

### Root hostname

The landing build exports `/nativesheets/ads.txt`. Google needs `https://tashukbiz.github.io/ads.txt` instead. The root is a separate repository, `tashukbiz/tashukbiz.github.io`. Prepared files are in `hosting/github-root/`: publish `ads.txt` there and replace its placeholder `index.md` with the Native Sheets introduction. These files are not automatically deployed by this repository's workflow. Keep the root seller record in sync if the publisher changes.

### Finish account activation

1. Publish the root files and this landing build. Check that the root `ads.txt` returns HTTP 200 with the seller line from this build.
2. In AdSense → Sites → `tashukbiz.github.io`, select **Ads.txt snippet**, verify ownership, then request review. Review is Google's decision; adding code does not imply approval.
3. In Privacy and messaging, publish the site's European regulations message with Consent, Do not consent and Manage options, and a US state regulations message. Set the site name to Native Sheets and privacy URL to `https://tashukbiz.github.io/nativesheets/privacy/`. Keep Google's default US opt-out entrypoint enabled.
4. In Ads → By ad unit, create a responsive Display unit for Native Sheets articles. Set `NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE` to its ID in repository Actions variables. Keep **Auto ads off** for this hostname so Google does not insert extra placements near downloads or on excluded pages.
5. Once the site's status is **Ready**, check the CMP configuration, set `NEXT_PUBLIC_ADSENSE_CMP_READY=true` and `NEXT_PUBLIC_AD_STATE=live`, and run the Pages workflow. Test the privacy messages using `?fc=alwaysshow&fctype=gdpr` and `?fc=alwaysshow&fctype=usnat`, including rejection and reopening preferences. Never click your own live ads.

### Runtime behavior

Manual ad units appear in substantive guide and feature articles. The homepage, indexes, about, privacy, terms, errors and workbook viewer carry no ad slots. The viewer also excludes the advertising loader; live-mode internal links load a new document so an ad script cannot survive navigation into the viewer. The app itself is unchanged and contains no ads.

Google's published, certified CMP loads through the AdSense tag. Slots wait for `CONSENT_DATA_READY`; Google applies TCF/GPP signals to ad serving, including any permitted limited ads. The custom consent banner is for analytics only and cannot authorize advertising. Global Privacy Control prevents the advertising loader entirely. Missing or blocked CMP code leaves slots inactive. Advertising privacy settings reopen Google's message, while Google's own US entrypoint handles US opt-outs.

Sources: [site verification](https://support.google.com/adsense/answer/7584263), [ads.txt crawling](https://support.google.com/adsense/answer/7679060), [CMP requirements](https://support.google.com/adsense/answer/13554116), [Privacy & messaging API](https://developers.google.com/funding-choices/fc-api-docs), [ad placement policies](https://support.google.com/adsense/answer/1346295).

## Layout

```
src/site/         configuration, product facts, content registry
src/components/   shell, article layout, consent, ads, viewer
src/lib/          client-side ZIP reader and XLSX parser
src/app/          routes, sitemap, robots
scripts/          share card, preview server, verifier, validator
tests/            node:test suites
```

Two rules: every public fact comes from `src/site/`, and every URL comes from `src/site/urls.ts`.
