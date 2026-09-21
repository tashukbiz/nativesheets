import Link from "@/components/SiteLink";
import type { Metadata } from "next";
import { contact, integrations, siteConfig } from "@/site/config";
import { href } from "@/site/urls";
import { pageMetadata } from "@/site/metadata";
import { AdvertisingPreferencesLink } from "@/components/AdSense";
import { ConsentPreferencesLink } from "@/components/ConsentManager";

const title = "Privacy";
const description =
  "What this site does and does not collect, what happens to a workbook you open in the browser viewer, and how to change any choice you have made.";

export const metadata: Metadata = pageMetadata({ title, description, route: "/privacy/" });

const analyticsEnabled = integrations.analytics.enabled;
const adsState = integrations.ads.state;
const adsLive = adsState === "live";

export default function PrivacyPage() {
  return (
    <div className="container section--tight prose">
      <h1>Privacy</h1>
      <p className="lede">{description}</p>
      <p className="article-meta">
        This page describes how the site behaves as it is deployed now. It is updated when that
        behaviour changes, not on a schedule.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>Workbooks you open in the browser viewer are never uploaded.</li>
        <li>There is no account, no login and no newsletter.</li>
        <li>
          {analyticsEnabled
            ? "Measurement runs only if you allow it."
            : "No analytics or measurement service is configured, so none runs."}
        </li>
        <li>
          {adsLive
            ? "Google AdSense uses privacy choices collected through Google’s consent messages."
            : `Advertising is currently ${adsState}: no advertising script is loaded and no ad request is made.`}
        </li>
      </ul>

      <h2>Files you open in the viewer</h2>
      <p>
        The <Link href={href("/viewer/")}>XLSX viewer</Link> reads your file with the browser&rsquo;s
        own file API. The workbook is decompressed and parsed inside the page, and the result stays
        in the tab&rsquo;s memory. It is not transmitted anywhere. This site is served as static
        files and has no server-side component that could receive a file, and no file name, sheet
        name or cell value is included in anything the site sends.
      </p>
      <p>
        When you close or reload the tab, the parsed workbook is discarded. A CSV you export is
        generated in the browser and saved by your own browser&rsquo;s download handling.
      </p>

      <h2>Hosting and server logs</h2>
      <p>
        The site is hosted as static files on GitHub Pages, operated by GitHub, Inc. Like any web
        host, it receives the technical information your browser sends in order to serve a page,
        including your IP address and user agent. That processing is GitHub&rsquo;s, under its own
        terms and privacy practices, and this project has no access to those logs and does not
        receive a copy of them.
      </p>

      <h2>Storage on your device</h2>
      {analyticsEnabled || adsLive ? (
        <p>
          Analytics choices, when available, are saved in local storage with the time of your
          choice. When advertising is enabled, Google&rsquo;s consent system also stores privacy
          choices in cookies or local storage. Google and its partners may use cookies or similar
          identifiers for advertising according to your choices and applicable requirements.
          Clearing browser storage removes saved choices.
        </p>
      ) : (
        <p>
          Nothing. With no measurement or advertising configured, the site sets no cookies and
          writes nothing to local storage.
        </p>
      )}

      <h2>Measurement</h2>
      {analyticsEnabled ? (
        <>
          <p>
            Measurement uses Google Analytics 4, provided by Google. It loads only after you allow
            it, and it does not load at all before a choice is made. It records which pages are
            viewed, how the viewer is used in coarse terms (a workbook was opened, a read failed, a
            CSV was exported), and standard technical information the provider collects.
          </p>
          <p>
            Page addresses are stripped of query strings and fragments before they are sent. File
            names, sheet names, cell contents and anything else from a workbook are never included.
          </p>
        </>
      ) : (
        <p>
          No measurement or analytics service is configured for this site, so no analytics script is
          loaded and no measurement request is made. If that changes, this page will describe the
          provider and what it receives before the change takes effect, and you will be asked first.
        </p>
      )}

      <h2>Advertising</h2>
      {adsLive ? (
        <p>
          Advertising is provided by Google AdSense on guide and feature articles. The workbook
          viewer has no advertising scripts or ad slots. Google&rsquo;s consent and advertising
          scripts load on other pages to display privacy messages and read your choices. Ad units
          are requested only once Google&rsquo;s consent system has finished collecting any
          required choices; Google determines which ads may be served from those signals. This
          can include limited or non-personalised ads where permitted. Google and its partners
          may receive your IP address, browser information, page URL and advertising identifiers
          to deliver, personalise and measure ads. See{" "}
          <a href="https://policies.google.com/technologies/partner-sites">how Google uses information from sites that use its services</a>{" "}
          and <a href="https://policies.google.com/privacy">Google&rsquo;s Privacy Policy</a>.
        </p>
      ) : (
        <p>
          This site is built to carry advertising on its guide and feature articles, but
          advertising is currently <strong>{adsState}</strong>. No advertising script is loaded, no
          ad request is made and no advertising identifier is set. Should advertising be switched
          on, ads would be labelled, kept away from download and viewer controls, and managed
          through Google&rsquo;s consent system. The workbook viewer remains free of advertising.
        </p>
      )}

      <h2>Your choices</h2>
      {analyticsEnabled || adsLive ? (
        <p>
          <ConsentPreferencesLink />{analyticsEnabled && adsLive ? ". " : ""}<AdvertisingPreferencesLink />.
          Analytics withdrawal stops further measurement and clears analytics cookies this site can
          reach. Advertising settings reopen Google&rsquo;s applicable privacy message; US visitors
          may also see Google&rsquo;s “Do not sell or share my personal information” link. Changes
          cannot delete records a provider has already stored; use the provider&rsquo;s controls
          for those records.
        </p>
      ) : (
        <p>
          There is nothing optional to turn off at the moment, so the site does not ask you for
          anything. The viewer has never depended on any choice and never will: it is the free part
          of this site.
        </p>
      )}
      <p>
        If your browser sends a privacy signal such as Global Privacy Control, the site treats it as
        a refusal of optional processing and does not ask again in that session.
      </p>

      <h2>Children</h2>
      <p>
        {siteConfig.name} is aimed at people who work with spreadsheet files, not at children. The
        site does not knowingly collect information from children, and it has no accounts or
        profiles through which it could.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this page go to <a href={contact.mailto}>{contact.email}</a>. It is a
        single-person project, so replies are not immediate.
      </p>
    </div>
  );
}
