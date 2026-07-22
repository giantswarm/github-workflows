# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
however this project does not use Semantic Versioning and there are no releases.
Instead this file uses a date-based structure.

## 2026-07-22

### Fixed

- `semantic-pull-request.yaml` - fix the case where the required check doesn't run on `merge_groups`.

## 2026-07-15

### Fixed

- `create-release.yaml` / `create-release-pr.yaml` — fix a bug in the `install-binary-action` step that resulted in a double-`v` prefix in the `gitsemver` version.

## 2026-07-14

### Changed

- `create-release-pr.yaml` — bumped `architect` to `v8.3.0`, which aggregates release-candidate changelogs when promoting to a stable release. On an RC → stable promotion, `architect prepare-release` now merges every `## [X.Y.Z-rc.N]` section into the promoted stable section, so the GitHub release page (built from that version's section) shows the full change set instead of the often-empty delta. No workflow logic is needed — the behavior lives in the binary that already writes `CHANGELOG.md`.

## 2026-07-07

### Fixed

- `fix-vulnerabilities.yaml` — the nancy remediation job no longer fails to push when a previous run's PR is still open. The stable, regenerated `remediate-vulnerabilities-<base>` branch had divergent history, so the plain push was rejected. Dropped the silently-failing `git pull`, switched to `git push --force`, and made `gh pr create` idempotent.

## 2026-07-06

### Fixed

- `sync-from-upstream.yaml` — the dependency-version detection step now falls back to a subchart's `version:` field when `appVersion:` is not set, instead of skipping the dependency. Subcharts vendored without an `appVersion` (e.g. `giantswarm/kyverno-crds`) were always reported as "No version change", so `CHANGELOG.md` was never updated by the automated upstream-sync PR. Extraction also tolerates a trailing `# VERSION` comment on the `version:` line.

### Changed

- `sync-from-upstream.yaml` — the automated PR title now names the updated dependencies instead of a static "automated update from upstream". A single change reads `chore(chart): update <dep> to <version> from upstream`; two or three list the names; more than three collapse to `chore(chart): update N dependencies from upstream`.

## 2026-07-02

### Added

- `gitops-validate.yaml` — new reusable workflow for validating GitOps repositories built from `giantswarm/gitops-template` (runs pre-commit, `./tools/test-all-ff validate`, a rendered-manifest `dyff` comment, and the `tests/ats` kind e2e). Consolidates CI that was previously hand-maintained in each consumer's `validate.yaml`/`basic.yml`; all actions are on current node24 releases and SHA-pinned. Consumers call it with `uses:` and pass the `GITOPS_MASTER_GPG_KEY` secret.

### Changed

- `yaml-diff.yaml` now posts its `dyff` output inside a ` ```diff ` fenced block so GitHub colourises it — removed values render red, added values green, and each file gets a `@@ … @@` header. dyff's go-patch `-`/`+` markers are moved to column 0 (indentation preserved after the marker) so the highlighter picks them up; the rewrite only reorders leading whitespace, so the comment-size truncation limits are unaffected. dyff's own ANSI colour stays disabled (comments can't render it). Requested in giantswarm/roadmap#4121.

## 2026-06-30

### Fixed

- `yaml-diff.yaml`'s `should_exclude()` now correctly excludes the default `**/*.enc.yaml` (SOPS) pattern. Patterns containing a `/` but not ending in `/**` fell through to a quoted, non-glob exact-match comparison that never matched, so SOPS-encrypted files were diffed and their contents posted as PR comments — the opposite of the documented default. A new matcher branch handles the `**/<glob>` shape by matching `<glob>` against the basename at any depth. Verified end-to-end against giantswarm/gitops-template#136.

## 2026-06-24

### Security

- Fixed a GitHub Actions script injection (CWE-94) in the `debug_info` "Print github context JSON" step of `create-release.yaml`, `create-release-pr.yaml`, `update-chart.yaml` and `ensure-major-version-tags.yaml`. The step interpolated `${{ toJson(github) }}` directly into a `run:` shell heredoc, so attacker-controllable event fields (e.g. a commit message containing an `EOF` line plus shell commands) could break out of the heredoc and execute arbitrary commands on the runner. The context is now passed through an `env:` variable (`GITHUB_CONTEXT`) and printed with `echo "$GITHUB_CONTEXT"`, treating it as data rather than script text — the same safe pattern already used for `COMMIT_MESSAGE` in `create-release.yaml`. Reported via giantswarm/giantswarm#36940.

### Added

- `validate-workflows.yaml` now runs a report-only [`zizmor`](https://github.com/zizmorcore/zizmor-action) security scan on this repository's own workflows. It uploads findings to the GitHub Security tab (code scanning) for visibility but does not block PRs (`continue-on-error: true`), so regressions of the script-injection class above are surfaced even though CodeQL did not catch them.

## 2026-06-03

### Fixed

- `create-release.yaml` now marks release-candidate releases (`vX.Y.Z-rc.N`) as GitHub pre-releases by passing `prerelease` to `ncipollo/release-action`, derived from the existing `gather_facts.is_rc` output. Previously RC tags were published as full releases and could become the repo's "Latest release".
- `validate-changelog.yaml` now recognises release-candidate branches. It parses the release token from the segment after the last `#` (mirroring `create-release-pr.yaml`) instead of pattern-matching the whole branch, so it accepts the RC bump tokens (`major-rc`, `minor-rc`, `patch-rc`, `rc`, `rc-release`) and explicit RC versions (`#v1.2.3-rc.4`) in addition to the stable tokens. The changelog version regex now allows an optional `-rc.N` suffix. As a side effect this also fixes the prefix-less `release#<token>` naming scheme, which the previous `*#release#<token>` patterns never matched.
- `create-release-pr.yaml`'s `check_skip` step no longer false-positively skips when an RC (or any) release branch is pushed from a base-branch HEAD that already carries a `Release-Workflow-Run:` trailer from a previous release. The trailer check now only applies when the release branch is actually ahead of the base (i.e., the workflow already committed to it), so freshly-pushed RC branches like `main#release#minor-rc` correctly proceed to create the release PR.
- `create-release.yaml`'s `create-release-branch` job now pushes the new long-lived maintenance branch using the `TAYLORBOT_GITHUB_ACTION` token (same authenticated remote URL pattern used by every other push in the file), rather than a bare `git push origin` that silently fails when `persist-credentials: false` is set. This bug was pre-existing on `main` and would have silently skipped release-branch creation on every minor/major release.

## 2026-06-01

### Changed

- `create-release-pr.yaml` and `create-release.yaml` install [`giantswarm/gitsemver`](https://github.com/giantswarm/gitsemver) `v1.1.2` via `giantswarm/install-binary-action` (the same mechanism already used for `architect` and Renovate-tracked), replacing the short-lived local composite action `.github/actions/gitsemver-install`. A local composite referenced as `uses: ./.github/actions/...` does not resolve inside a reusable (`workflow_call`) workflow — the runner looks the path up in the **caller** repository's checkout, not in `github-workflows` — so it failed for every consumer of these workflows. `v1.1.2` also fixes the `gitsemver --version` self-info flag, which the install step's smoke test now uses. This aligns these workflows with `architect-orb` v9.0.0, where `gitsemver` is the single source of git-based semver.
- `create-release.yaml`'s build-artifacts job keeps installing `architect` purely as a transition aid: consumer Makefiles still on the pre-gitsemver `devctl` template stamp release artifacts with `VERSION := $(shell architect project version)`. `devctl`'s current `Makefile.gen.go.mk` template uses `gitsemver version` (already installed in that job), so the `architect` install becomes removable once all consumers regenerate their Makefile. No version or git tag in these workflows is produced by `architect` — `gitsemver` is the sole source (`architect prepare-release` only consumes the already-resolved `--version`).

### Removed

- `create-release.yaml` no longer installs the `architect` binary in the `update_project_go` job. It was installed but never invoked — the post-release `-dev` bump of `project.go` is computed entirely with `gitsemver next patch` plus a `sed` rewrite.
- `create-release.yaml` drops the leftover `needs.gather_facts.outputs.ref_version != 'true'` guards on the `update_project_go` job and the `Ensure correct version in project.go` step. The `ref_version` output was removed together with the legacy reference-version handling, so the guards always evaluated truthy and only obscured the real conditions.

## 2026-05-29

### Added

- Add reusable workflow `yaml-diff.yaml`. Posts a semantic YAML diff (via `dyff`) of source files changed in a PR as a sticky PR comment. Key reordering without value changes is ignored, so reviewers see only meaningful changes. Companion to `helm-render-diff.yaml` (which diffs rendered Helm output rather than source). Shares the `/no_diffs_printing` opt-out with the helm workflow. Enables consumers to drop alphabetical-key-ordering enforcement from their YAML linters without losing diff readability (see [giantswarm/roadmap#4121](https://github.com/giantswarm/roadmap/issues/4121)).

## 2026-05-28

### Added

- `create-release-pr.yaml` accepts new bump tokens on the trigger branch (`branch#<token>`): `patch-rc`, `minor-rc`, `major-rc`, `rc`, `rc-release`. They are passed verbatim to `gitsemver next` and produce release-candidate versions like `v1.3.0-rc.1`, `v1.3.0-rc.2`, then `v1.3.0` via `rc-release`. The existing `patch` / `minor` / `major` tokens continue to work unchanged.
- `create-release.yaml` exposes a new `is_rc` output on its `gather_facts` job (true when the released tag is an RC per `gitsemver validate --type rc`).

### Changed

- `create-release-pr.yaml` now computes the next version with `gitsemver next <token>` instead of the inline `gh api releases/latest` + manual increment. Explicit-version trigger branches (`branch#vX.Y.Z[-rc.N]`) are now validated by `gitsemver validate --type any` and rejected on invalid input — strings that previously slipped through the loose regex (e.g. `1.2.3.foo`) are now hard failures with a clear error. The job now checks out the base branch with `fetch-depth: 0` and `persist-credentials: false` so gitsemver can see full tag history.
- `create-release.yaml` validates the version parsed from the release-PR commit title with `gitsemver` rather than an inline regex. RC tags (`vX.Y.Z-rc.N`) are first-class: they create the tag and GH release like a stable version, and they DO still trigger the post-release `-dev` bump of `project.go` (the new dev string targets the stable the RC is leading toward, e.g. `1.3.0-rc.1` ➝ `1.3.0-dev`). The long-lived `release-vX.Y.x` branch is only cut for stable major/minor releases — RC releases skip that job.
- `release.yaml` (release-please) auto-merge reconciler now strips any pre-release suffix from the manifest versions before the numeric `X.Y.Z` compare, so a `1.3.0-rc.1 → 1.3.0-rc.2` PR (or an RC ➝ stable promotion) is classified as `bump=patch` rather than silently `bump=none`. Auto-merge therefore honours the configured `auto-merge-level` ceiling on RC PRs too. Consumers wanting RC support on this path enable it in their own `release-please-config.json` with `"versioning": "prerelease"`, `"prerelease": true`, `"prerelease-type": "rc"` — `release.yaml` itself stays single-code-path.

### Removed

- `create-release.yaml` no longer recognises the legacy "reference version" form `vX.Y.Z-N` (e.g. `v1.2.3-4`) — the dedicated `ref_version` job and its special-case regex are gone. Any repo still pushing such tags via this workflow will need to migrate to the RC form (`vX.Y.Z-rc.N`).
- `create-release.yaml` and `create-release-pr.yaml` no longer install `fsaintjacques/semver-tool`; all next-version arithmetic now goes through `gitsemver` (or bash parameter expansion on a version string already validated by it).
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
