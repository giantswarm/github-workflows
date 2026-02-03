# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
however this project does not use Semantic Versioning and there are no releases.
Instead this file uses a date-based structure.

## 2026-02-03

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
