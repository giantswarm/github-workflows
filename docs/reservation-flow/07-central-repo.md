---
status: todo
---

# 07 — The central repo and its credential

## What to build

Create one dedicated repo for this feature. It holds the privileged workflows and the only
credential that pushes to the GitOps repos. A leaked token in an app repo must not reach cluster
configuration.

Provision the GitHub App that pushes to `giantswarm-management-clusters`. Give that identity a
branch-protection bypass in the GitOps repo, because the commits go straight to `main`.

Add a reserve workflow that a maintainer starts by hand with inputs. It runs the `devctl` command
and pushes. No app repo talks to it yet. This slice proves the credential topology, which is the
largest infrastructure risk in the feature.

## Acceptance criteria

- [ ] The new repo exists, and it holds the reserve workflow.
- [ ] The App can push to `main` in `giantswarm-management-clusters`.
- [ ] No other repo holds a credential that pushes to a GitOps repo.
- [ ] A manual run makes the same commit as the laptop command.
- [ ] The workflow uses least-privilege permissions.
- [ ] The workflow checks out without persistent credentials, and it pins every action to a commit SHA.

## Blocked by

04a — Reserve one app on one cluster, from end to end.

## User stories covered

51.
