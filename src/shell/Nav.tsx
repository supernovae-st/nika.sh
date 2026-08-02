import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { BrandMark } from "./BrandMark";
import { REPO, DOCS, ENGINE_VERSION } from "../content";
import {
  FOOTER_COLS,
  NAV_BAR_LINKS,
  NAV_VERSION_PILL,
  type NavItem,
} from "../content/lens-nav.generated";
import { useMagnetic } from "../fx/use-magnetic";
import { useFocusTrap, useFocusReturn } from "../lib/focus";
import { acquireScrollLock, releaseScrollLock } from "../lib/scroll-lock";
import "./nav.css";

/* ─── Nav · the eight worlds, flat ───────────────────────────────────────────
   TABLE RASE 2026-08-02 (operator: « la navbar n'a aucun sens · supprime tout
   · refais par rapport au nouveau monde »).

   What died, and why:
     · the two MEGA PANELS. They were named « Product » and « Reference » —
       words from our own layer model, not questions a visitor asks — and
       between them they hid eleven doors, a constellation drawing and a
       stats HUD behind a hover. A panel that lists what a hub already lists
       is a second copy of that hub living in the chrome, and it drifts.
     · the roving-index menu machinery, the disclosure state, the panel
       viewport morph, and the icon set that existed only for panel rows.

   What the bar is now: the WORLDS. Six flat links, each one a world with its
   own hub, and the hub is where a reader browses — /how, /language,
   /workflows, /catalog, plus Docs and Blog. Nothing hovers, nothing hides.
   The mobile sheet renders the footer's world columns, so the phone and the
   desktop footer teach the same map from one source.

   The chrome stays a PROJECTION: every link reads lens-nav.generated.ts,
   compiled from scripts/lens/graph/sets.yaml. A world is born by a
   descriptor row, never by an edit here. */

function GitHubGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
      />
    </svg>
  );
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 14 14" width="11" height="11" aria-hidden focusable="false">
      <circle cx="6" cy="6" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.2 9.2 12.4 12.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** one bar link · internal or external, no state, no panel */
function BarLink({ item }: { item: NavItem }) {
  const { pathname } = useLocation();
  if (item.external || item.href) {
    return (
      <a
        href={item.href ?? DOCS}
        target="_blank"
        rel="noreferrer"
        className="v4nav-link"
      >
        {item.label}
        <span className="v4nav-ext" aria-hidden>
          ↗
        </span>
      </a>
    );
  }
  /* the world a reader stands IN wears the mark — a room inside it counts */
  const here = Boolean(
    item.to && (pathname === item.to || pathname.startsWith(`${item.to}/`)),
  );
  return (
    <Link
      to={item.to ?? "/"}
      className="v4nav-link"
      aria-current={here ? "page" : undefined}
    >
      {item.label}
    </Link>
  );
}

export default function Nav() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const installRef = useRef<HTMLAnchorElement>(null);
  useMagnetic(installRef);

  /* the capsule compresses once the page has moved — the only scroll state
     left (the always-glass branch and its field-route list died with the
     panels; the capsule is glass everywhere now) */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    /* the first read is DEFERRED (a synchronous setState inside an effect
       cascades a render on every mount) — a page loaded mid-scroll settles
       on the next frame instead */
    const first = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* a route change closes the sheet — a menu that survives a navigation
     covers the page the reader just asked for. GUARDED by a ref, never
     unconditional (the house pattern the old nav pioneered): a setState
     that runs on every render cascades. */
  const lastPathRef = useRef(pathname);
  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    setSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sheetOpen) return;
    acquireScrollLock();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      releaseScrollLock();
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  useFocusTrap(sheetRef, sheetOpen);
  useFocusReturn(sheetOpen);

  const close = useCallback(() => setSheetOpen(false), []);

  return (
    <>
      {/* lang="en" · the chrome is ENGLISH on every page, and the 14 locale
          pages set <html lang="fr|es|…> over it. 108 of the footer's 108 text
          segments are byte-identical English there, so without this the
          document asserts French over words that are not French — a screen
          reader takes the document at its word. If the chrome is ever
          translated, this attribute moves with it. */}
      <header
        className="v4nav"
        lang="en"
        data-solid="true"
        data-scrolled={scrolled || undefined}
      >
        <div className="v4nav-capsule">
          <nav
            className="v4nav-row"
            aria-label="Primary"
            itemScope
            itemType="https://schema.org/SiteNavigationElement"
          >
            {/* THE LEFT ZONE · the mark carries its own wordmark (a second one
                printed « nikanika ») and the version rides beside it. The
                version used to sit on the right, where it competed with the
                CTA for the eye: four boxes in a row, three of them quiet. The
                references we measured (Raycast · Linear) keep exactly two
                things on the right, and so do we now. */}
            <div className="v4nav-left">
              <BrandMark />
              <Link
                to={NAV_VERSION_PILL.to}
                className="v4nav-vpill"
                title={NAV_VERSION_PILL.title}
                aria-label={`Version ${ENGINE_VERSION} · the ship log`}
              >
                {ENGINE_VERSION}
              </Link>
            </div>

            {/* THE WORLDS · flat, no dropdown, optically centred in the capsule */}
            <div className="v4nav-rail">
              {NAV_BAR_LINKS.map((item) => (
                <BarLink key={item.label} item={item} />
              ))}
            </div>

            <div className="v4nav-right">
              <button
                type="button"
                className="ck-trigger"
                aria-label="Search the site (Command K)"
                onClick={() => window.dispatchEvent(new Event("ck:open"))}
              >
                {/* the glyph is what makes this readable to a stranger: on
                    its own, « ⌘K » is a keycap floating between two links */}
                <SearchGlyph />
                <span aria-hidden>⌘</span>K
              </button>
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                className="v4nav-ghost"
                aria-label="Nika on GitHub"
              >
                <GitHubGlyph />
                <span className="v4nav-ghost-label">GitHub</span>
              </a>
              <Link
                ref={installRef}
                to="/install"
                className="v4nav-cta vfx-mag"
                aria-label="Install Nika"
              >
                <span className="v4nav-cta-glyph" aria-hidden>
                  ❯
                </span>
                Install
              </Link>

              <button
                ref={burgerRef}
                type="button"
                className="v4nav-burger"
                aria-label="Open menu"
                aria-expanded={sheetOpen}
                aria-controls={sheetId}
                onClick={() => setSheetOpen(true)}
              >
                <span aria-hidden />
                <span aria-hidden />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* the phone's whole map · the SAME columns the footer draws, from one
          source (FOOTER_COLS), so the two can never teach different maps */}
      {sheetOpen && (
        <>
          <div className="v4sheet-scrim" onClick={close} aria-hidden />
          <div
            ref={sheetRef}
            id={sheetId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="v4sheet"
            lang="en"
          >
            <div className="v4sheet-head">
              {/* BrandMark IS a link and carries its own wordmark · wrapping it
                  in a second one nested an anchor inside an anchor and printed
                  « nikanika » on every phone */}
              <BrandMark />
              <button
                type="button"
                className="v4sheet-close"
                aria-label="Close menu"
                onClick={close}
              >
                ✕
              </button>
            </div>

            <button
              type="button"
              className="v4sheet-link v4sheet-search"
              onClick={() => {
                close();
                window.dispatchEvent(new Event("ck:open"));
              }}
            >
              Search everything
              <span aria-hidden className="v4sheet-search-glyph">
                ⌘K
              </span>
            </button>

            {FOOTER_COLS.map((col) => (
              <div className="v4sheet-sec" key={col.kick}>
                <p className="v4sheet-sectitle">{col.kick}</p>
                {col.items.map((l) =>
                  l.external || l.href ? (
                    <a
                      key={l.label}
                      href={l.href ?? (l.label === "GitHub" ? REPO : DOCS)}
                      target="_blank"
                      rel="noreferrer"
                      className="v4sheet-link"
                      onClick={close}
                    >
                      {l.label}
                      <span aria-hidden className="v4nav-ext">
                        ↗
                      </span>
                    </a>
                  ) : (
                    <Link
                      key={l.label}
                      to={l.to ?? "/"}
                      className="v4sheet-link"
                      onClick={close}
                    >
                      {l.label}
                    </Link>
                  ),
                )}
              </div>
            ))}

            <Link to="/install" className="v4sheet-cta" onClick={close}>
              Install Nika
            </Link>
          </div>
        </>
      )}
    </>
  );
}
