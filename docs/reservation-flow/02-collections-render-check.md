---
status: todo
---

# 02 — Render each touched cluster's collections in CI

## What to build

No CI job renders a per-cluster `collections` overlay today. A change there reaches `main` with no
check, and it shows an empty rendered diff. So a broken change stops the cluster from
reconciling, and nothing reports it.

Add a per-cluster collections build target to the shared Makefile that every GitOps repo pulls
from `management-cluster-bases`. Mirror the per-cluster catalogs target that already exists there.
Then add a workflow that calls the target for the clusters that a pull request touches. Do not
call it for all 43 clusters. Roll it out to `giantswarm-management-clusters` first.

## Acceptance criteria

- [ ] The shared Makefile has a per-cluster collections build target.
- [ ] A developer can run the target on a laptop.
- [ ] A pull request that changes one cluster's collections runs the target for that cluster only.
- [ ] A malformed collections change fails the check.
- [ ] `giantswarm-management-clusters` runs the check.

## Blocked by

None - can start immediately.

## User stories covered

55.
