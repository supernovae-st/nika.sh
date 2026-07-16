#!/usr/bin/env python3
"""Fail-closed conformance proof for the LENS-011 exact resync contract."""
from __future__ import annotations

import hashlib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
WF = ROOT / ".github/workflows/spec-resync.yml"
PIN = ROOT / ".github/nika-spec-pin.json"
CONTRACT = ROOT / "scripts/spec-resync.contract.json"
LIB = ROOT / "scripts/spec-resync-lib.mjs"
RUNNER = ROOT / "scripts/spec-resync-run.mjs"
GUARD = ROOT / "scripts/verify_generated_outputs.mjs"
TEST = ROOT / "scripts/test-spec-resync-adversarial.mjs"
SHA40 = re.compile(r"^[0-9a-f]{40}$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")
FAILS: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    print(f"  {'ok  ' if ok else 'FAIL'} {name}" + (f" — {detail}" if detail and not ok else ""))
    if not ok:
        FAILS.append(name + (f" — {detail}" if detail else ""))


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    required = [WF, PIN, CONTRACT, LIB, RUNNER, GUARD, TEST]
    for path in required:
        check(f"required artifact exists: {path.relative_to(ROOT)}", path.is_file())
    if any(not path.is_file() for path in required):
        return 1

    workflow = WF.read_text(encoding="utf-8")
    code = "\n".join(line for line in workflow.splitlines() if not line.lstrip().startswith("#"))
    runner = RUNNER.read_text(encoding="utf-8")
    lib = LIB.read_text(encoding="utf-8")
    guard = GUARD.read_text(encoding="utf-8")
    adversarial = TEST.read_text(encoding="utf-8")
    pin = json.loads(PIN.read_text(encoding="utf-8"))
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))

    print("== exact source + generator DAG ==")
    check("contract is version 1", contract.get("contract_version") == 1)
    spec = contract.get("spec", {})
    check("spec commit is full 40-hex", bool(SHA40.fullmatch(spec.get("commit", ""))))
    check("spec tree is full 40-hex", bool(SHA40.fullmatch(spec.get("tree", ""))))
    check("contract commit equals committed pin", spec.get("commit") == pin.get("spec_commit"))
    check("contract tree equals committed pin", spec.get("tree") == pin.get("spec_tree"))
    check("contract repository equals committed pin", spec.get("repository") == pin.get("repository"))

    generators = contract.get("generators", [])
    ids: set[str] = set()
    produced: list[str] = []
    dag_ok = True
    digest_ok = True
    website_digest_ok = True
    for generator in generators:
        generator_id = generator.get("id")
        dag_ok &= bool(generator_id) and generator_id not in ids
        dag_ok &= all(dependency in ids for dependency in generator.get("depends_on", []))
        ids.add(generator_id)
        digest_ok &= bool(SHA256.fullmatch(generator.get("sha256", "")))
        produced.extend(generator.get("outputs", []))
        if generator.get("root") == "website":
            path = ROOT / generator.get("path", "")
            website_digest_ok &= path.is_file() and digest(path) == generator.get("sha256")
    check("generator IDs are unique and DAG is topological", dag_ok)
    check("every generator has a pinned SHA-256", digest_ok)
    check("all website generator files match pinned digests", website_digest_ok)
    check("toolchain is fixed in the contract", contract.get("toolchain") == {
        "node": "22", "pnpm": "10.32.1", "python": "3.12", "pyyaml": "6.0.3"
    })
    check("child environment inherit allowlist is closed", contract.get("environment_policy") == {
        "inherit": ["PATH"],
        "generator_derived": ["NIKA_SPEC_ROOT", "NIKA_WEBSITE_ROOT", "NIKA_WEBSITE_SRC"],
    })
    check("fixed child environment is exact", contract.get("environment") == {
        "LANG": "C.UTF-8", "LC_ALL": "C.UTF-8", "NIKA_BIN": "/__nika_spec_resync_no_binary__",
        "PYTHONHASHSEED": "0", "SOURCE_DATE_EPOCH": "0", "TZ": "UTC",
    })

    print("== literal output set + byte digests ==")
    outputs = contract.get("outputs", [])
    paths = [entry.get("path") for entry in outputs]
    check("output paths are literal and unique", len(paths) == len(set(paths)) and all(paths))
    check("generator output union equals exact output contract", sorted(produced) == sorted(paths))
    check("every output has a SHA-256", all(SHA256.fullmatch(entry.get("sha256", "")) for entry in outputs))
    check("every committed output currently matches the contract", all(
        (ROOT / entry["path"]).is_file() and digest(ROOT / entry["path"]) == entry["sha256"]
        for entry in outputs
    ))
    check("every non-public output declares a build/test consumer", all(
        entry.get("dist") or entry.get("consumers") for entry in outputs
    ))

    print("== dual disposable generation + exact staging + sealed build ==")
    runner_command = re.search(r"node scripts/spec-resync-run\.mjs[\s\\]+--spec-root ../spec", workflow)
    check("workflow invokes the exact runner", runner_command is not None)
    for flag in ("--build", "--apply", "--stage", "--receipt"):
        check(f"workflow exact runner includes {flag}", flag in workflow)
    check("workflow installs locked dependencies before sealed build", "pnpm install --frozen-lockfile" in workflow)
    check("workflow pins PyYAML", "pip install pyyaml==6.0.3" in workflow)
    check("workflow does not permit toolchain variance", "--allow-toolchain-mismatch" not in workflow)
    check("runner creates first + second disposable runs", "generateRun(scratch, 'first'" in runner and "generateRun(scratch, 'second'" in runner)
    check("runner compares dual-run bytes", "compareOutputTrees(first.website, second.website" in runner)
    check("runner clears every expected output before the DAG", "clearContractOutputs(websiteRoot, contract)" in lib)
    check("each producer must newly materialize its declared output set", "proveGeneratorOutputs" in lib and "did not newly materialize" in lib)
    check("producer proof is bound into the receipt", "producer_proofs" in runner)
    check("generator/output paths are root-confined", "assertRelativePath" in lib and "generator resolves outside" in lib)
    check("runner builds both generated sealed clones", "for (const run of [first, second])" in runner
          and "runSealedBuild(run.website" in runner)
    check("runner byte-compares the complete dual-build dist", "compareDirectoryTrees(" in runner
          and "dual-run directory byte mismatch" in lib)
    check("generation and build use the closed child environment", "sealedEnvironment(contract" in lib
          and "env: { ...process.env" not in lib)
    check("staging passes an exact path array after `--`", "['add', '--', ...changed]" in lib)
    check("raw Git index blobs are compared for the complete contract set",
          "for (const output of contract.outputs)" in lib
          and "['show', `:${output.path}`]" in lib
          and "raw index digest mismatch" in lib)
    check("built public bytes are compared to contract digests", "sealed build did not consume exact" in lib)
    for receipt_field in (
        "contract_sha256", "website_tree", "generators", "fixed_environment",
        "inherited_environment_allowlist", "generator_derived_environment_allowlist",
        "build_environment_keys",
        "expected_toolchain", "actual_tool_versions", "toolchain_conformant",
        "index_verified_outputs", "build_input_verified_outputs", "build_command",
        "build_output_directory", "build_output_tree_sha256", "build_output_files", "dual_build",
    ):
        check(f"receipt binds {receipt_field}", receipt_field in runner)
    check("NO broad generated-file pathspec remains", ":(glob)" not in code and "**/*.generated" not in code)
    check("NO unscoped git add", "git add -A" not in code and not re.search(r"git add \.(?:\s|$)", code))
    check("post-generation exact guard runs", "node scripts/verify_generated_outputs.mjs" in workflow and "verifyOutputTree" in guard)

    print("== adversarial coverage ==")
    cases = (
        "supplied allowed-path tamper", "missing output", "extra output", "renamed output",
        "source pin/tree mismatch", "generator digest mismatch", "newline-only byte drift",
        "post-verification raw index mutation", "missing build/test consumer", "dual-run byte mismatch",
        "no-op producer after output clearing", "stale producer bytes after output clearing",
        "output path confinement escape", "undeclared build environment neutralized",
        "sealed dist byte mismatch",
    )
    for case in cases:
        check(f"adversarial case is present: {case}", case in adversarial)

    print("== proposal safety ==")
    verify_i = workflow.find("DIGEST VERIFY")
    runner_i = workflow.find("spec-resync-run.mjs")
    proposal_i = workflow.find("One idempotent PR")
    check("spec HEAD + tree are compared before runner", "rev-parse HEAD" in workflow and "HEAD^{tree}" in workflow and 0 <= verify_i < runner_i)
    check("runner precedes proposal", 0 <= runner_i < proposal_i)
    check("unique branch embeds spec commit", "bot/spec-resync/${SPEC_COMMIT}" in workflow)
    check("plain create push", re.search(r'git push origin "\$\{branch\}"\s*$', workflow, re.M) is not None)
    check("idempotence is a PR query", "gh pr list --head" in workflow)
    check("no force push or swallowed normative failure", "--force" not in code and "|| true" not in code)
    check("no event payload enters shell", "github.event" not in code and "github.head_ref" not in code)
    check("strict shell mode remains", "set -euo pipefail" in workflow)

    print()
    print(f"RESULT: {'GREEN' if not FAILS else 'RED'} · {len(FAILS)} failing")
    for failure in FAILS:
        print(f"  FAIL {failure}")
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
