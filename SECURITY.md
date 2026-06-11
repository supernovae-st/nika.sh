# Security Policy

This repository carries the source of **nika.sh** — the public website,
the served `install.sh`, and the published artifacts under
`/schema/v1.json` + `/llms.txt`. Security-relevant surface here · the
install script piped to shells, and the schema/contract files consumed
by editors and CI.

## Supported Versions

Only `main` is supported · the site deploys from it.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub
issues, discussions, or pull requests.**

Send an email to **security@supernovae.studio** with ·

- A description of the issue (e.g. install.sh integrity · XSS · a served
  contract file diverging from the spec repository)
- Steps to reproduce or a minimal proof-of-concept
- The commit SHA or deployed URL where you observed it

We acknowledge receipt within **72 hours** and aim for a substantive
response (initial triage + ETA) within **7 days**. Reports touching
`install.sh` are treated as highest severity.

## Disclosure Process

1. **Triage** · maintainers verify the report and confirm the scope
2. **Fix development** · patch authored privately
3. **Public release** · GitHub Security Advisory + redeploy
4. **Credit** · reporter named in the advisory unless anonymity is requested

We aim for **≤90 days** between report and public disclosure, shorter for
actively-exploited issues.
