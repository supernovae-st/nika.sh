# REPRO — Lot 9I (LENS-011) — website spec-resync workflow (nika.sh)

Corrective descendant of 302c3af (the lot-7 LENS-011 commit) on
`claude/pre1-lens-remediation`, LOCAL and unpushed by design. Closing LENS-011,
which the Codex final re-review found BLOCKED: the workflow still contradicted the
four packet preconditions (spec HEAD unpinned, no byte/digest verify, a reused
stable branch pushed with force-with-lease). Env: Python 3.14.5.

## RED before (the verifier against the 302c3af workflow — 17 failing)

The old `spec-resync.yml` cloned the spec's moving HEAD (`git clone --depth 1
… nika-spec`), had no pin and no digest verification, and reused the stable
`bot/spec-resync` branch with `--force-with-lease`:

```
FAIL committed pin .github/nika-spec-pin.json exists
FAIL the spec is fetched BY SHA
FAIL NO clone of a moving ref
FAIL a DIGEST VERIFY step exists
FAIL the bot branch embeds the spec sha (unique to the pin)
FAIL NO --force-with-lease anywhere
… RESULT: RED · 17 failing
```

## Fix (the four fail-closed preconditions)

1. **PINNED spec** — `.github/nika-spec-pin.json` carries the exact
   `spec_commit` + `spec_tree` (full 40-hex); the workflow fetches the spec BY
   SHA (`git fetch … ${SPEC_COMMIT}`), never a moving ref or HEAD.
2. **DIGEST VERIFY before derivation** — a dedicated step compares the fetched
   `HEAD` to `spec_commit` and `HEAD^{tree}` to `spec_tree` and `exit 1`s on a
   mismatch; it PRECEDES every generator leg, commit, push and PR.
3. **UNIQUE branch** — `bot/spec-resync/${SPEC_COMMIT}`, unique to the pin; no
   reused stable branch, no `checkout -B`.
4. **PLAIN CREATE push** — `git push origin "${branch}"`, no `--force`, no
   `--force-with-lease`; idempotence is a `gh pr list --head` QUERY (a PR already
   open for the pin ⇒ exit clean), and a create race fails non-fast-forward.

Plus: every generator leg propagates (no `|| true`), no `github.event` data
reaches a shell, `set -euo pipefail`. The workflow SELF-GATES — a
`verify-conformance` job runs `scripts/verify_spec_resync_conformance.py` and the
`resync` job `needs:` it, so a non-conformant workflow can never publish.

## GREEN after

```
scripts/verify_spec_resync_conformance.py  RESULT: GREEN — spec-resync is LENS-011 conformant · 0 failing
```

LENS-011: fixed at this descendant — READY_FOR_TARGETED_REREVIEW (LOCAL, unpushed;
the Lens lane owns publication).
