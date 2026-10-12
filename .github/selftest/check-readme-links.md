# check-readme-links self-test fixture

Status badges are not links a reader follows for content; the link check
ignores them (`link-check/markdown-link-check.json`).

- CircleCI badge of an archived repository:
  [![CircleCI](https://circleci.com/gh/giantswarm/klaus-operator.svg?style=shield)](https://circleci.com/gh/giantswarm/klaus-operator)
- CircleCI badge of a project CircleCI does not serve anonymously, which
  answers 404 like a private repository's badge:
  [![CircleCI](https://circleci.com/gh/giantswarm/check-readme-links-selftest-no-such-project.svg?style=shield)](https://circleci.com/gh/giantswarm/check-readme-links-selftest-no-such-project)
- CircleCI status badge in the newer form:
  [![CircleCI](https://dl.circleci.com/status-badge/img/gh/giantswarm/check-readme-links-selftest-no-such-project/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/giantswarm/check-readme-links-selftest-no-such-project/tree/main)
- shields.io badge:
  [![License](https://img.shields.io/badge/license-Apache%202.0-blue)](https://github.com/giantswarm/github-workflows/blob/main/LICENSE)

A relative link that resolves: [the changelog](/CHANGELOG.md).
