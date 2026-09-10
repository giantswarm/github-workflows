---
status: todo
---

# 06 — Locks, scopes and refusals

## What to build

A reservation has one of two scopes: `app`, which is the default, and `exclusive`. An exclusive
reservation is a lock over the cluster. It still patches only the app of the person who requests
it.

The rules:

1. An app-scoped request fails when the same app already holds a reservation on that cluster.
2. An app-scoped request fails when any exclusive reservation is active on that cluster.
3. An exclusive request fails when any reservation is active on that cluster. The exception is
   exactly one active reservation that belongs to the same user and the same app. That case is a
   promotion.
4. A refusal changes nothing anywhere, and it names the holder, the app, the branch and the
   expiry.
5. One reservation per app per cluster. The same app on different clusters is normal.

## Acceptance criteria

- [ ] An app-scoped request fails when the same app holds a reservation on that cluster.
- [ ] An app-scoped request fails when an exclusive reservation is active on that cluster.
- [ ] An exclusive request fails when any other reservation is active on that cluster.
- [ ] An exclusive request succeeds when exactly one reservation is active, and it belongs to the same user and the same app.
- [ ] A promotion rewrites the scope in place, and it keeps the reservation.
- [ ] A refusal names the holder, the app, the branch and the expiry.
- [ ] A refusal makes no commit and no push.
- [ ] The same app on two clusters works.
- [ ] An exclusive reservation patches only the app of the requester.

## Blocked by

04 — `devctl reservation reserve`.

## User stories covered

9, 10, 15, 16, 17, 18.
