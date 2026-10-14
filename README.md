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

## check-readme-links

[`check-readme-links.yaml`](.github/workflows/check-readme-links.yaml) checks the links in a repository's README (or in the Markdown files passed as `files`): every absolute URL answers, every relative path and `#anchor` resolves inside the checkout, and no link uses the reversed syntax `(text)[url]`. The checker configuration (ignore list, timeouts) lives in [`link-check/`](link-check/) and is taken from `main` for every caller, whatever ref the caller pins.

| Input | Default | Meaning |
|---|---|---|
| `files` | `README.md` | Markdown files to check, paths relative to the repository root separated by whitespace. No globs. |
| `fail_on_error` | `true` | Fail the job on a broken link. With `false` the findings are filed as one issue, updated on later runs and closed once the links are fixed (for scheduled runs). The issue is filed from the default branch only. |
| `issue_title` | `Broken links in README` | Title of that issue. An open issue with this title is updated. |
| `issue_labels` | `kind/bug` | Comma-separated labels for that issue. |
| `config_ref` | `main` | Ref of this repository to take the link-check configuration from. Leave at `main` unless piloting a branch. |

| Secret | Meaning |
|---|---|
| `LINK_CHECK_APP_CLIENT_ID` | Client ID of the GitHub App that resolves links into private Giant Swarm repositories (see below). Optional. |
| `LINK_CHECK_APP_PRIVATE_KEY` | Private key of that App. Optional. |

A gate on pull requests and a weekly run that files its findings as an issue, which is what devctl's `check_readme_links` template generates:

```yaml
on:
  pull_request:
    paths:
      - 'README.md'
  schedule:
    - cron: '17 6 * * 1'
  workflow_dispatch: {}

permissions: {}

jobs:
  check-readme-links:
    uses: giantswarm/github-workflows/.github/workflows/check-readme-links.yaml@main
    with:
      fail_on_error: ${{ github.event_name == 'pull_request' }}
    permissions:
      contents: read
      issues: write # the issue filed by the scheduled run; unused on pull requests
    secrets:
      LINK_CHECK_APP_CLIENT_ID: ${{ secrets.LINK_CHECK_APP_CLIENT_ID }}
      LINK_CHECK_APP_PRIVATE_KEY: ${{ secrets.LINK_CHECK_APP_PRIVATE_KEY }}
```

### Links into private Giant Swarm repositories

A link into a private repository answers 404 to the anonymous checker although it works for a reader who is logged in. With the two secrets the workflow resolves every `github.com/giantswarm/…` and `raw.githubusercontent.com/giantswarm/…` link through the GitHub API instead ([`link-check/probe-github-links.js`](link-check/probe-github-links.js)): a repository, file, directory, ref, release, commit or heading anchor that exists is skipped by the checker; one that does not exist stays in the check, fails there as 404, and the job summary or the issue names it with the reason; a page the App cannot read (issues, pull requests, discussions, Actions, wiki) is skipped and listed as not checked. Links into public repositories are left to the checker. A caller that does not pass the secrets keeps the static ignore list in `link-check/markdown-link-check.json` as its only defence, and its job summary says so.

The secrets belong to the organisation-owned GitHub App `giantswarm-link-check`, owned by team-honeybadger:

- Repository permission Contents: read only (Metadata: read comes with it), nothing writable, no webhook, no OAuth.
- Installed on all repositories of the organisation. This is a requirement, not a convenience: the workflow reads a 404 from the API as "repository does not exist", which is only true when no private repository sits outside the installation.
- The two secrets are organisation secrets with visibility "Selected repositories": the app-flavour repositories plus this one (for the self-test), not every repository. A repository outside the selection runs without the probe. To add one, an organisation admin runs, with the repository id:

  ```sh
  gh api -X PUT orgs/giantswarm/actions/secrets/LINK_CHECK_APP_CLIENT_ID/repositories/<repo id>
  gh api -X PUT orgs/giantswarm/actions/secrets/LINK_CHECK_APP_PRIVATE_KEY/repositories/<repo id>
  ```

  or replaces the whole list with `gh api -X PUT orgs/giantswarm/actions/secrets/<name>/repositories --input selection.json`, where the file holds `{"selected_repository_ids": [...]}`.
- The token minted in a run lives one hour and stays in the job; it never reaches the checker or the configuration file.
- Key rotation is on demand (suspected leak, an admin leaves, GitHub asks): generate a new private key in the App settings, `gh secret set LINK_CHECK_APP_PRIVATE_KEY --org giantswarm < new.pem` (visibility and selection are kept), delete the old key. No release is needed; the next run uses the new key.
