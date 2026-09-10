---
status: todo
---

# 05 — `devctl reservation release` and `list`

## What to build

`release` removes the component, the one line that references it, and the reservation entry. It
makes one commit. The repo returns to a state identical to the state before the reservation.

`list` prints the active reservations on a cluster.

Both commands run from a laptop, so an engineer can free a stuck lock without CI.

## Acceptance criteria

- [ ] `release` restores the repo to an identical state.
- [ ] `release` on a cluster with no reservation for the app says so, and changes nothing.
- [ ] `list` prints the app, the user, the branch, the pull request, the scope and the expiry.
- [ ] Both commands work from a laptop.
- [ ] Repeated reserve and release cycles leave nothing behind.

## Blocked by

04 — `devctl reservation reserve`.

## User stories covered

26, 31, 35, 36, 57.
