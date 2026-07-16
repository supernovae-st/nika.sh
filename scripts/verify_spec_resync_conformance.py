#!/usr/bin/env python3
"""verify_spec_resync_conformance.py — LENS-011 (PRE1 design-pack contract · lot 9i).

Proves the four fail-closed preconditions of .github/workflows/spec-resync.yml
against the committed pin .github/nika-spec-pin.json — deterministically, offline,
stdlib only. The spec-resync workflow runs this as its first job (verify-conformance)
and the resync job `needs:` it, so a non-conformant workflow can never publish.

  1 PINNED spec        — a committed pin with a full 40-hex spec_commit + spec_tree;
                         the spec is fetched BY SHA; no clone of a moving ref/HEAD.
  2 DIGEST VERIFY      — HEAD and HEAD^{tree} are compared to the pin and a mismatch
                         `exit 1`s, and that step PRECEDES every derivation/commit/push.
  3 UNIQUE branch      — the bot branch embeds the spec sha; no reused `bot/spec-resync`
                         stable branch, no `checkout -B`.
  4 PLAIN CREATE push  — no `--force` / `--force-with-lease` anywhere; idempotence by
                         a `gh pr list` QUERY; no swallowed failures on normative legs;
                         no `github.event` data in a shell; `set -euo pipefail`.

Exit 0 = conformant, 1 = a precondition is violated (each printed).
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent  # repo root (scripts/..)
WF = ROOT / ".github/workflows/spec-resync.yml"
PIN = ROOT / ".github/nika-spec-pin.json"
FULL_SHA = re.compile(r"^[0-9a-f]{40}$")
FAILS: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    if not ok:
        FAILS.append(f"{name}{(' — ' + detail) if detail else ''}")
    print(f"  {'ok ' if ok else 'FAIL'} {name}" + (f" — {detail}" if detail and not ok else ""))


def main() -> int:
    if not WF.is_file():
        print(f"FATAL: workflow not found at {WF}")
        return 1
    text = WF.read_text(encoding="utf-8")
    lines = text.splitlines()
    # CODE = the workflow with `#` comment lines dropped. The negative "NO X
    # anywhere" checks scan CODE, so the header prose ("no --force", "no `|| true`")
    # documenting the preconditions never trips its own gate.
    code = "\n".join(ln for ln in lines if not ln.lstrip().startswith("#"))

    print("== 1 · PINNED spec (full sha + tree · fetched by sha · no moving ref) ==")
    if not PIN.is_file():
        check("committed pin .github/nika-spec-pin.json exists", False)
        pin = {}
    else:
        pin = json.loads(PIN.read_text(encoding="utf-8"))
        check("committed pin .github/nika-spec-pin.json exists", True)
    check("pin.spec_commit is a full 40-hex sha", bool(FULL_SHA.match(pin.get("spec_commit", ""))),
          pin.get("spec_commit", "<absent>"))
    check("pin.spec_tree is a full 40-hex sha (content digest)", bool(FULL_SHA.match(pin.get("spec_tree", ""))),
          pin.get("spec_tree", "<absent>"))
    check("the workflow reads the committed pin", "nika-spec-pin.json" in text)
    check("the spec is fetched BY SHA (git fetch … SPEC_COMMIT)",
          "fetch" in text and "${SPEC_COMMIT}" in text)
    check("NO clone of a moving ref (no `git clone … nika-spec` of default HEAD)",
          "git clone" not in text, "a bare `git clone` of the spec pulls a moving HEAD")
    check("NO `ref: main` used to CHECK OUT the spec (main is the WEBSITE surface only)",
          text.count("nika-spec") == 0 or "clone" not in text)

    print("== 2 · DIGEST VERIFY before any derivation (fail-closed) ==")
    verify_i = next((i for i, ln in enumerate(lines) if "DIGEST VERIFY" in ln), None)
    check("a DIGEST VERIFY step exists", verify_i is not None)
    check("it compares HEAD to the pinned commit and HEAD^{tree} to the pinned tree",
          "rev-parse HEAD" in text and "HEAD^{tree}" in text
          and "!= \"${SPEC_COMMIT}\"" in text and "!= \"${SPEC_TREE}\"" in text)
    check("a mismatch aborts the run (exit 1)", re.search(r"mismatch[\s\S]{0,120}exit 1", text) is not None)
    # ordering: verify precedes the FIRST derivation/commit/push
    derive_i = next((i for i, ln in enumerate(lines) if "Re-derive every spec-fed surface" in ln), None)
    pr_i = next((i for i, ln in enumerate(lines) if "One idempotent PR" in ln), None)
    check("DIGEST VERIFY precedes the derivation step",
          verify_i is not None and derive_i is not None and verify_i < derive_i,
          f"verify@{verify_i} derive@{derive_i}")
    check("DIGEST VERIFY precedes the commit/push/PR step",
          verify_i is not None and pr_i is not None and verify_i < pr_i)

    print("== 3 · UNIQUE branch (per pin · never a reused stable branch) ==")
    check("the bot branch embeds the spec sha (unique to the pin)",
          "bot/spec-resync/${SPEC_COMMIT}" in text)
    check("NO reused bare stable branch (`bot/spec-resync` without the sha, or `checkout -B`)",
          "checkout -B" not in text
          and not re.search(r"bot/spec-resync(?![/$])", text.replace("bot/spec-resync/${SPEC_COMMIT}", "")),
          "a bare bot/spec-resync is a reused stable branch")

    print("== 4 · PLAIN CREATE push · no force · query idempotence · no event injection ==")
    check("NO --force anywhere (code)", "--force" not in code)
    check("NO --force-with-lease anywhere (code)", "force-with-lease" not in code)
    check("the push is a plain create (git push origin <branch>, no flags)",
          re.search(r'git push origin "\$\{branch\}"\s*$', text, re.M) is not None)
    check("PR idempotence decided by QUERY (gh pr list --head)", "gh pr list --head" in text)
    check("no normative leg swallows failures (`|| true` absent, code)", "|| true" not in code)
    check("no github.event data reaches a shell",
          "github.event" not in code and "github.head_ref" not in code)
    for tok in ("set -euo pipefail",):
        check(f"defensive shell: `{tok}` present", tok in text)

    print("== 5 · OUTPUT PROVENANCE — generated bytes verified before git add (LENS-011) ==")
    guard = ROOT / "scripts/verify_generated_outputs.mjs"
    check("the output guard script exists (scripts/verify_generated_outputs.mjs)", guard.is_file())
    guard_i = next((i for i, ln in enumerate(lines) if "verify_generated_outputs.mjs" in ln), None)
    check("the workflow RUNS the output guard", guard_i is not None)
    # the guard must run AFTER the generators and BEFORE the commit/push/PR
    check("the output guard runs AFTER derivation and BEFORE the PR step",
          guard_i is not None and derive_i is not None and pr_i is not None
          and derive_i < guard_i < pr_i, f"derive@{derive_i} guard@{guard_i} pr@{pr_i}")
    # NO unscoped add — the exact LENS-011 hole (`git add -A` / `git add .` sweeps a
    # tamper file). The stage must be an explicit declared-output pathspec.
    check("NO `git add -A` (the unscoped sweep that let the tamper file ride the PR)",
          "git add -A" not in code, "git add -A sweeps undeclared bytes into the proposal")
    check("NO `git add .` (equally unscoped)", not re.search(r"git add \.(?:\s|$)", code))
    check("the stage is a SCOPED declared-output pathspec (src/**/*.generated.* · catalog)",
          ".generated." in code and "git add --" in code)
    if guard.is_file():
        gtext = guard.read_text(encoding="utf-8")
        check("the guard enumerates the WORKING TREE (git status --porcelain, untracked included)",
              "status" in gtext and "porcelain" in gtext and "untracked-files=all" in gtext)
        check("the guard REFUSES undeclared outputs with a non-zero exit (no commit/push/PR)",
              "process.exit(1)" in gtext and "undeclared" in gtext.lower())
        check("the guard's allow-list is the declared generated surface (.generated. + catalog)",
              ".generated." in gtext and "catalog.json" in gtext)

    print()
    print(f"RESULT: {'GREEN — spec-resync is LENS-011 conformant' if not FAILS else 'RED'} · {len(FAILS)} failing")
    for f in FAILS:
        print(f"  FAIL {f}")
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
