---
status: todo
---

# 04 — `devctl reservation reserve` — the full path, end to end

## What to build

The core of the feature. One command reserves one app on one cluster, and pushes one commit.

The command reads the target cluster in the GitOps repo. It refuses a cluster that is not enabled
for reservations, and it says how to enable it. It resolves the app. It builds a new source
object for the dev builds of the branch. It adds the component that holds that object and the
patch that points the app at it. It writes the reservation entry. It renders the result and
checks it. Then it commits and pushes to `main`.

Two rules protect against a silent failure. Build the new source object by a copy of the resolved
original, and change only the name, the annotations and the version selector. A hand-built object
loses the registry credential reference, and that failure looks like a missing chart. And a
render that only succeeds proves nothing, so assert that the rendered output really contains the
reservation.

Enable one cluster (`graveler`) in the same slice, so the command has a real target to demo
against. Until slice 05 lands, a `git revert` of the one commit undoes a reservation.

## Acceptance criteria

- [ ] The command refuses a cluster that has no reservations ConfigMap, and says how to enable it.
- [ ] The command resolves the app by a render of the cluster collections, and a match on the chart URL.
- [ ] The command does not match on the object name.
- [ ] The command refuses when the render gives no match, and says why.
- [ ] The command refuses an app from the `extras` folder, and says that this version covers collections only.
- [ ] The command needs an app argument when the repo holds more than one chart.
- [ ] The new source object keeps every field of the original, and changes only the name, the annotations and the version selector.
- [ ] The new source object selects the dev builds of the branch, and its interval is 1 minute.
- [ ] The command patches every app instance on that cluster, and creates one source object.
- [ ] The reservation entry and the component land in the same commit.
- [ ] The default duration is 10 hours. The maximum is 7 days, or the cluster value when that is lower.
- [ ] The command fails when the rendered output has no reservation reference.
- [ ] A rejected push starts a rebase and a retry, up to 5 attempts.
- [ ] The reservation is visible on the cluster as annotations.
- [ ] Flux deploys the dev build on `graveler` after a real run.

## Blocked by

01 — Export the branch sanitizer from gitsemver.

Start 02 first if you can. This slice pushes to `main`, and 02 is the only check outside the tool itself.

## User stories covered

6, 7, 8, 14, 19, 20, 21, 24, 27, 52, 53, 54, 56, 58, 59.
