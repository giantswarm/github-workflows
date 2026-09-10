---
status: todo
---

# 12 — The reaper

## What to build

One scheduled job in the central repo sweeps every enabled cluster in every GitOps repo that it
can reach. It releases each reservation that ran out of time, and it reports each release.

It also compares the stored branch with the current head branch of the pull request. A rename
means the old branch makes no more builds, so the job releases the reservation. The developer can
then run `/deploy` again.

The cadence must change without a code change, so keep it in a repository variable. Start at about
30 minutes, and tune it after the cost is visible.

## Acceptance criteria

- [ ] A scheduled job sweeps every enabled cluster in every GitOps repo that it can reach.
- [ ] The job releases each reservation whose expiry passed.
- [ ] The job releases a reservation whose stored branch differs from the head branch of the pull request.
- [ ] The job adds a comment on the pull request for each release.
- [ ] The job stays silent when it finds nothing.
- [ ] A repository variable sets the cadence. The first value is 30 minutes.
- [ ] `devctl reservation reap` does the same work from a laptop.

## Blocked by

05 — `devctl reservation release` and `list`.
07 — The central repo and its credential.

## User stories covered

37, 38, 39, 40, 41.
