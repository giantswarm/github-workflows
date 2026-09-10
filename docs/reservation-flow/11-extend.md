---
status: todo
---

# 11 — `/extend`, and promotion from a comment

## What to build

`/extend` is a strict alias of a repeated `/deploy`. It resets the expiry, and it creates the
reservation when none exists. The scope comes from the command that runs, so
`/extend <cluster> exclusive` promotes, and it obeys the exclusive rule.

## Acceptance criteria

- [ ] `/extend <cluster>` resets the expiry.
- [ ] `/extend <cluster> for 4h` sets a new duration.
- [ ] `/extend <cluster>` creates the reservation when none exists.
- [ ] A repeated `/deploy` resets the expiry in the same way.
- [ ] `/extend <cluster> exclusive` promotes, and it obeys the exclusive rule.
- [ ] An extension over the cap gets a refusal.

## Blocked by

09 — `/deploy` from a pull request comment.
06 — Locks, scopes and refusals.

## User stories covered

11, 12, 13, 14.
