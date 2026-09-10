---
status: todo
---

# 04a — Reserve one app on one cluster, from end to end

## What to build

The tracer bullet. One command reserves one app on one cluster, and it pushes one commit that
Flux acts on. Keep the case as narrow as possible. The caller names the app, the app runs once on
the cluster, and the duration is a fixed 10 hours. Slices 04b to 04d widen it.

The command reads the target cluster in the GitOps repo. It refuses a cluster that has no
reservations ConfigMap, and it says how to enable it. It builds a new source object for the dev
builds of the branch. It adds the component that holds that object and the patch that points the
app at it. It writes the reservation entry. It renders the result and checks it. Then it commits
and pushes to `main`.

Two rules protect against a silent failure. Build the new source object by a copy of the resolved
original, and change only the name, the annotations and the version selector. A hand-built object
loses the registry credential reference, and that failure looks like a missing chart. And a
render that only succeeds proves nothing, so assert that the rendered output really contains the
reservation.

Enable one cluster (`graveler`) in the same slice, so the command has a real target. Until slice
05 lands, a `git revert` of the one commit undoes a reservation.

## Acceptance criteria

- [ ] The command refuses a cluster that has no reservations ConfigMap, and says how to enable it.
- [ ] The new source object keeps every field of the original, and changes only the name, the annotations and the version selector.
- [ ] The new source object selects the dev builds of the branch, and its interval is 1 minute.
- [ ] The version filter comes from the exported sanitizer, and it matches a real dev tag of the same branch.
- [ ] The reservation entry and the component land in the same commit.
- [ ] The reservation is visible on the cluster as annotations.
- [ ] The command fails when the rendered output has no reservation reference.
- [ ] The command touches no release version selector and no release-candidate version selector.
- [ ] Two people can hold reservations for different apps on the same cluster.
- [ ] The same app can hold a reservation on two clusters.
- [ ] Flux deploys the dev build on `graveler` after a real run.

## Blocked by

01 — Export the branch sanitizer from gitsemver.

Start 02 first if you can. This slice pushes to `main`, and 02 is the only check outside the tool itself.

## User stories covered

6, 7, 8, 19, 27, 52, 53, 54, 56, 59.
