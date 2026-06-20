# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
however this project does not use Semantic Versioning and there are no releases.
Instead this file uses a date-based structure.

## 2026-06-20

### Added

- `vulnerability-check.yaml` reusable workflow: runs `nancy sleuth` against the Go module graph (`go list -json -m all`) to flag dependencies with known vulnerabilities, honouring `.nancy-ignore` and `.nancy-ignore.generated`. Call it on `pull_request` and `merge_group` to gate the merge queue. Authenticates to OSS Index via the `NANCY_USER`/`NANCY_TOKEN` and `OSSI_OSSINDEXURL` secrets. A scanner outage exits `0` so it does not block merges.

## 2026-06-18

### Fixed

- Download `architect` binary instead of tarball when installing it.

## 2026-06-08

### Fixed

- `update-chart` now uses the bare chart name instead of `helm/{{chart-name}}` since a new [devctl update](https://github.com/giantswarm/devctl/pull/1837) broke the current workflow.
- Update GO_VERSION on documentation-validation workflow.

## 2026-05-27

### Added

- `release.yaml` (release-please reusable workflow) gained an `auto-merge-level` input (`none`, `patch`, `minor`, `major`; default `none`). When set, the workflow enables GitHub auto-merge (`gh pr merge --auto --squash`) on the open release-please PR if the PR's bump is no larger than the configured ceiling, so the PR merges automatically once CI passes. The bump is derived from `.release-please-manifest.json` (next version on the PR head branch vs. current version on the base branch), so it is independent of each caller's PR-title configuration. Auto-merge is reconciled on every run — if a release-please PR's bump grows past the ceiling (e.g. from `patch` to `major`) before it is merged, auto-merge is disabled again. The default `none` preserves the previous behaviour (no auto-merge). The merge is performed with the `release-please` GitHub App token, so the merge is attributed to the App; the App must be granted bypass on any branch protection and the repository must have "Allow auto-merge" enabled.

### Changed

- `release.yaml` (release-please reusable workflow) now authenticates via a GitHub App instead of a PAT. Callers must pass `RELEASE_PLEASE_CLIENT_ID` and `RELEASE_PLEASE_PRIVATE_KEY` secrets in place of `TAYLORBOT_GITHUB_ACTION`. Using an App token (minted by `actions/create-github-app-token`) means release PRs trigger downstream workflows — unlike commits made with `GITHUB_TOKEN` or PRs opened by a PAT in some configurations — and removes the dependency on the taylorbot user account.
- `create-release-pr` now opens release PRs with a Conventional Commits-compatible title of the form `chore(release): vX.Y.Z` (previously `Release vX.Y.Z`). The release commit message it creates uses the same form.
- `create-release` and `update-action-version` accept both the new `chore(release): vX.Y.Z` form and the legacy `Release vX.Y.Z` form, so in-flight release PRs created by older versions of `create-release-pr` continue to be picked up after their merge commit lands.
- `validate-changelog.yaml` now validates the H3 sections of the version block against the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) set: `### Added`, `### Changed`, `### Deprecated`, `### Removed`, `### Fixed`, `### Security`. Unknown H3 sections fail validation. `### Security` is accepted for CVE fixes and vulnerability mitigations. Release CHANGELOGs that do not use `### Security` continue to pass.
- `fix-vulnerabilities` now opens PRs with the Conventional Commits title `fix(nancy): remediate findings on <branch>` (previously `Remediate Nancy findings on <branch>`). The intermediate commit it creates uses `fix(nancy): remediate nancy findings`.
- `update-chart` now opens PRs with the Conventional Commits title `chore(chart): automated update from upstream` (previously `Automated update from upstream`). The intermediate commit it creates uses the same form.

## 2026-05-20

### Added

- Add reusable workflow `semantic-pull-request.yaml`. Validates that a pull request title follows Conventional Commits, using `amannn/action-semantic-pull-request`'s default type set (sourced from [`commitizen/conventional-commit-types`](https://github.com/commitizen/conventional-commit-types): `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`). Callers trigger it on `pull_request` with `types: [opened, edited, synchronize]`.

## 2026-05-19

### Changed

- Replace `mindsers/changelog-reader-action` with an inline `awk` extractor in the `create-release` workflow. The upstream action is unmaintained and still runs on Node 20, which is being deprecated by GitHub Actions on 2026-06-02 (see [giantswarm/giantswarm#36091](https://github.com/giantswarm/giantswarm/issues/36091)). Inline shell has no Node runtime, so the workflow is no longer exposed to future Node-deprecation cycles. The replacement was validated byte-for-byte against 128 historical release bodies produced by the action across 100 consumer repos.

## 2026-05-12

### Added

- Add reusable workflow `js-dependency-audit.yaml`. It runs an audit (`npm`, `pnpm`, `yarn npm audit`, or `yarn audit`) on every JS project in a PR's head and base, then posts a sticky PR comment summarizing vulnerabilities and highlighting which ones the PR adds or removes.

## 2026-05-11

### Fixed

- Renamed `HERALD_CLIENT_ID` to `HERALD_APP_ID` in fix-vulnerabilities workflow to avoid a missing secret scenario in devctl generated files.

## 2026-05-07

### Changed

- Change actions/create-github-app-token param `app-id` to `client-id`.

## 2026-04-24

- Fix interpretation of `fetch-deep-gitlog-for-build` input in `crteate-release` workflow, to allow for fetching git log.

## 2026-04-17

### Changed

- Bump `giantswarm/install-binary-action` from `v4.0.0` to `v4.0.1` in `create-release`, `create-release-pr`, and `helm-render-diff` workflows to pick up the fix for the `mkdir: File exists` collision in pre-commit runs (see `giantswarm/install-binary-action#334`).

## 2026-04-15

### Added

- Add a new `dispatch-update-chart-events` action to send `update-chart` events to a central repository.

## 2026-03-05

### Added

- Add tool configuration options for `zizmor` (GitHub Action security scanning).

## 2026-03-04

### Added

- Add `analyze-github-actions` action for scanning GitHub Actions.

## 2026-02-09

### Fixed

- Revert job reordering in `create-release-pr` and use `Release-Workflow-Run` trailer on all commits to prevent duplicate workflow runs.

## 2026-02-07

### Added

- Add reusable workflow `update-action-version.yaml` to update version in composite action.yml files during release PRs.

## 2026-02-06

### Changed

- Skip `ossf-scorecard` workflow in private repositories to avoid unnecessary failures.

## 2026-02-05

### Fixed

- Prevent duplicate workflow runs in `create-release-pr` by reordering jobs.

## 2026-02-04

### Added

- Add reusable workflow `create-release.yaml` with inputs for CLI build artifacts and optional full git history fetch.

### Fixed

- Prevent duplicate workflow runs in `create-release-pr` by marking commits with `Release-Workflow-Run` trailer.

## 2026-02-03

### Added

- Add reusable workflow `ensure-major-version-tags.yaml`.
- Add reusable workflow `documentation-validation.yaml`.
- Add reusable workflow `json-schema-validation.yaml`.
- Add reusable workflow `cluster-values-validation.yaml`.
- Add reusable workflow `helm-render-diff.yaml`.
- Add reusable workflow `update-chart.yaml`.

### Fixed

- Prevent duplicate `prepare_release_pr` job runs in `create-release-pr` workflow by adding `[skip ci]` to the commit message.

## 2026-02-02

### Fixed

- Set fall-back log level "info" for nancy-fixer workflow.

## 2026-01-30

### Fixed

- Replace `permissions: read-all` with explicit job-level permissions in `ossf-scorecard` and `publish-techdocs` workflows to work correctly when called from workflows with restricted permissions. Added full set of read permissions to `ossf-scorecard` job as recommended for private repositories (`contents`, `actions`, `issues`, `pull-requests`, `checks`).

## 2026-01-23

### Added

- Add pull request template with checklist for changelog.

### Changed

- Set restrictive default token permissions for `create-release-pr`, `fix-vulnerabilities`, `chart-values`, `gitleaks`, `go-coverage`, `issue-to-customer-board`, `validate-changelog`, `validate-file-names`, and `validate-workflows` workflows.

### Fixed

- Fix git push in "Create Release PR" workflow by disabling credential persistence in checkout steps.

## 2026-01-16

### Changed

- Allow setting log level for nancy-fixer workflow.

## 2025-12-16

### Changed

- Make `create-release-pr` aware of ABS setting `.replace-app-version-with-git` and update `Chart.yaml` accordingly.

## 2025-10-31

### Added

- Add workflow "Add issue to general customer board".

### Changed

- Improve output of "Validate workflows" workflow.

## 2025-10-28

### Added

- Add workflow to validate file names.

## 2025-10-16

### Added

- Add OSSI credentials to fix-vulnerabilities workflow.

### Fixed

- Fix wrong env variable name for fix-vulnerabilities.

## 2025-10-10

### Fixed

- Fix go-coverage workflow.

## 2025-08-18

### Changed

- Relax yamllint rule: min-spaces-from-comments.

## 2025-08-15

### Added

- Add yaml linting to validate-workflows.

## 2025-07-09

### Changed

- Set CODEOWNERS for specific files.
- Specify workflow permissions.

## 2025-06-26

### Added

- Add changelog validation workflow for release PRs.

## 2025-06-03

### Added

- Add workflow "Validate chart values and schema".
- Add OSSF Scorecard workflow.
- Add "Fix vulnerabilities" workflow.
- Create Renovate config.

### Changed

- Allow Renovate to update binaries in workflows.

### Removed

- Delete non-functioning "Create release" workflow.

## 2025-06-02

### Added

- Add go-coverage workflow.

## 2025-05-30

### Added

- Add Publish TechDocs workflow.
- Add workflow to validate workflows.

### Changed

- Rename first workflow files.

## 2025-05-28

### Changed

- Assign honeybadgers as CODEOWNERS.

## 2025-05-21

### Added

- Initial commit with reusable workflows: Create Release PR, Gitleaks.
