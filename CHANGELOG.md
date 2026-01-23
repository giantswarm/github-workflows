# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
however this project does not use Semantic Versioning and there are no releases.
Instead this file uses a date-based structure.

## 2026-01-23

### Changed

- Restrict permissions for GITHUB_TOKEN in "Fix Vulnerabilities" workflow.
- Restrict permissions for GITHUB_TOKEN in "Create Release PR" workflow.

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
