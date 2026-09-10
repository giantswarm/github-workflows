---
status: todo
---

# 10 — `/undeploy`, and release on a closed pull request

## What to build

`/undeploy <cluster>` releases the reservation. When it finds nothing to release, it says so.

A merged pull request and a closed pull request each release every reservation that the pull
request holds.

Any member of the org with write access to the app repo can release, from the pull request that
holds the reservation. So a colleague can free a cluster, and nobody can touch a reservation from
an unrelated pull request. The comment names the person who released it.

## Acceptance criteria

- [ ] `/undeploy <cluster>` releases the reservation.
- [ ] `/undeploy` with nothing to release tells the user.
- [ ] A merged pull request releases every reservation that it holds.
- [ ] A closed pull request releases every reservation that it holds.
- [ ] A member of the org with write access can release from the pull request that holds the reservation.
- [ ] A release attempt from an unrelated pull request gets a refusal.
- [ ] The comment names the person who released it.

## Blocked by

05 — `devctl reservation release` and `list`.
09 — `/deploy` from a pull request comment.

## User stories covered

30, 32, 33, 34, 35.
