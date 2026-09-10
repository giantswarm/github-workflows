---
status: todo
---

# 03 — Build when a pull request opens, then build every commit

## What to build

A reservation deploys a dev build, so a dev build must exist. Change the build rule.

A push to a branch with no pull request builds nothing. Basic checks still run. When a pull
request opens, CI builds the current head commit. CI then builds every later commit while the
pull request stays open.

This touches the CircleCI configuration that `devctl` generates, and `architect-orb`. There is no
label and no branch prefix that switches builds on. The earlier `nobuild/` design is dropped.

## Acceptance criteria

- [ ] A push to a branch with no pull request builds no chart.
- [ ] Basic checks still run on that push.
- [ ] Opening a pull request builds the current head commit.
- [ ] Every later commit builds while the pull request stays open.
- [ ] The dev tag keeps its current format.

## Blocked by

None - can start immediately.

## User stories covered

42, 43, 44, 45.
