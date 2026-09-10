---
status: todo
---

# 14 — Enable the remaining clusters and the app repos

## What to build

A cluster becomes eligible when its GitOps repo holds the reservations ConfigMap, and the cluster
root references it. That is the opt-in, and one reviewed pull request turns the feature on. So the
owners of a cluster always agree before a dev build can reach it.

Enable the remaining clusters in `giantswarm-management-clusters`, one reviewed pull request per
cluster. Onboard the app repos through the shared workflow repo. Customer repos stay out of this
rollout.

## Acceptance criteria

- [ ] Each cluster gets its opt-in through a pull request that its owners review.
- [ ] The remaining `giantswarm-management-clusters` clusters are enabled.
- [ ] App repos get the trigger workflow through the shared workflow repo.
- [ ] The collections render check runs in `giantswarm-management-clusters`.
- [ ] Customer repos stay out of scope.

## Blocked by

09 — `/deploy` from a pull request comment.
02 — Render each touched cluster's collections in CI.
04d — Safe pushes when reservations arrive together.

## User stories covered

52.
