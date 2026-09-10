---
status: todo
---

# 04d — Safe pushes when reservations arrive together

## What to build

Several app repos can reserve at the same moment, and every reservation is a commit to the same
branch of the same GitOps repo. A lost commit means a cluster that runs a version nobody claimed.

Clone, change, push. When the push fails, rebase and try again. Stop after 5 attempts, and report
the failure.

## Acceptance criteria

- [ ] A rejected push starts a rebase and a retry.
- [ ] The command stops after 5 attempts, and it reports the failure.
- [ ] Two reservations that start together both land, and neither one loses the other.
- [ ] A retry repeats the render check before it pushes again.

## Blocked by

04a — Reserve one app on one cluster, from end to end.

## User stories covered

58.
