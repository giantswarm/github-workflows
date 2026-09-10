---
status: todo
---

# 08 — Receive the dispatch, and authorize it

## What to build

The central repo receives a repository dispatch from an app repo. The payload carries only the
repo, the pull request number, the comment identifier and the login of the person who commented.

Treat that payload as untrusted input. The central repo re-reads the comment, the pull request and
the branch from the API, and it ignores everything else in the payload. An app repo maintainer can
edit their own workflow, so the app repo side holds no security value.

All three checks run centrally, and each one must pass:

1. The app repo is under the `giantswarm` org.
2. The person who commented is a member of the `giantswarm` org.
3. That person holds write access to the app repo.

The built-in Actions token cannot read org membership, so check 2 needs the central App
credential.

## Acceptance criteria

- [ ] The workflow accepts a repository dispatch with the small payload.
- [ ] The workflow re-reads the comment, the pull request and the branch from the API.
- [ ] The workflow ignores every other field of the payload.
- [ ] A person who is not a member of the `giantswarm` org gets a refusal.
- [ ] A person without write access to the app repo gets a refusal.
- [ ] An app repo outside the `giantswarm` org gets a refusal.
- [ ] A refusal makes no commit.
- [ ] The membership check uses the central App credential.

## Blocked by

07 — The central repo and its credential.

## User stories covered

46, 47, 48, 49, 50.
