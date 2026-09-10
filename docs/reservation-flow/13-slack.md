---
status: todo
---

# 13 — Slack notifications

## What to build

Slack gets a message for a reservation, an extension and an expiry. The channel shows who works
where, and nobody types it by hand.

A refusal posts nothing to Slack. It concerns the requester only, and that person gets a comment
on the pull request.

The channel comes from an annotation on the cluster reservations ConfigMap. A cluster without that
annotation uses the central default.

## Acceptance criteria

- [ ] A reservation posts to Slack.
- [ ] An extension posts to Slack.
- [ ] An expiry posts to Slack.
- [ ] A refusal posts nothing to Slack.
- [ ] The channel comes from the cluster annotation.
- [ ] A cluster with no annotation uses the central default.

## Blocked by

09 — `/deploy` from a pull request comment.
12 — The reaper.

## User stories covered

28, 29.
