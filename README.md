# GitHub workflows

A repository of reusable workflows, intended for use in the `giantswarm` organization.

## js-dependency-audit

[`js-dependency-audit.yaml`](.github/workflows/js-dependency-audit.yaml) audits the JS dependencies of every directory with a `package.json` and a recognized lockfile (npm, pnpm, Yarn 1, Yarn Berry). It runs on whatever event the caller passes. On a pull request it also audits the base and posts a sticky comment listing the vulnerabilities the PR adds or removes. On any other event (a push to a branch or tag, a schedule, `workflow_dispatch`) it audits the checkout only.

| Input | Default | Meaning |
|---|---|---|
| `working_directory` | `""` | Audit this one project instead of auto-discovering them. |
| `node_version` | `24` | Node.js version that runs the audit. |
| `fail_on_level` | `none` | `none` never fails on a vulnerability: the signal is the PR comment. `low`, `moderate`, `high` or `critical` fail the job on any vulnerability at or above that level, after the comment is posted, and list them in the job log. |
| `ignore_file` | `.npm-audit-ignore` | Time-boxed ignores honoured when `fail_on_level` is not `none`. A missing file ignores nothing. |

The job always fails when an audit did not run, whatever `fail_on_level` says.

A gate on pull requests, the default branch, release tags and a weekly run:

```yaml
on:
  pull_request:
    paths:
      - '**/package.json'
      - '**/package-lock.json'
      - '**/npm-shrinkwrap.json'
      - '**/yarn.lock'
      - '**/.yarnrc'
      - '**/.yarnrc.yml'
      - '**/pnpm-lock.yaml'
      - '**/pnpm-workspace.yaml'
      - '.npm-audit-ignore'
  push:
    branches: [main]
    tags: ['v*']
  schedule:
    - cron: '17 6 * * 1'
  workflow_dispatch:

permissions: {}

jobs:
  audit:
    uses: giantswarm/github-workflows/.github/workflows/js-dependency-audit.yaml@main
    permissions:
      contents: read
      pull-requests: write # the PR comment; unused on other events
    with:
      fail_on_level: high
```

Without `with:` and with only the `pull_request` trigger, the workflow comments and never fails on a vulnerability.

An advisory that cannot be fixed right away goes into the ignore file, one per line, with an expiry date and the issue that tracks its fix:

```text
GHSA-xxxx-xxxx-xxxx until=2026-11-12 # https://github.com/<owner>/<repo>/issues/<n>
```

An entry matches the advisory's GHSA ID or the audit's own advisory ID. An entry without `until=YYYY-MM-DD` or an issue URL fails the job. An expired entry no longer ignores its advisory, so the job fails again while the advisory is still present. Delete the entry with the fix.
