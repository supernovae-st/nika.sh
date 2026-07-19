import {
  VSCODE_EXT_URL,
  OPENVSX_EXT_URL,
  VSCODE_REPO,
  RELEASES_URL,
} from './install'
import type { LinkToken } from '../lib/i18n-inline'

/* the install corpus' LINK TOKENS: phrases every reviewed translation keeps
   (the voice contract) — the renderer turns them into the page's real
   anchors, so copy stays translatable while hrefs stay code. Grows with the
   corpus; i18n-lexicon.test pins every voice to carry every token (a
   translated token would silently unlink the page — the gate names it). */
export const INSTALL_LINKS: LinkToken[] = [
  { match: /VS Code Marketplace/, href: VSCODE_EXT_URL, external: true },
  { match: /Open VSX/, href: OPENVSX_EXT_URL, external: true },
  { match: /source \+ issues|Source \+ Issues/, href: VSCODE_REPO, external: true },
  {
    match: /latest release|dernière release|última release|letzten Release|最新 release|최신 release/,
    href: RELEASES_URL,
    external: true,
  },
]
