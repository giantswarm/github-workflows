---
status: todo
---

# 09 — `/deploy` from a pull request comment

## What to build

The user-facing surface. A developer comments on their own pull request, and the reservation
happens.

Add the trigger workflow for app repos. It is a pure trigger, and it sends the dispatch. Add the
parser for the prose commands. Add the report on the pull request.

The command forms:

```
/deploy <cluster>
/deploy <cluster> for 4h
/deploy <cluster> exclusive
/deploy <cluster> exclusive for 4h
/deploy <cluster> app <name>
```

The parser also accepts `--exclusive`. Durations are `30m`, `4h` or `2d`.

One comment per cluster shows the state, and it updates in place, so a long pull request stays
readable. A refusal and an expiry each add a new comment, because an edit notifies nobody.

Check the registry for a dev build, then continue in either case. When no build exists, say so in
the comment. The build often runs at that same moment, and Flux takes the chart as soon as it
lands.

## Acceptance criteria

- [ ] `/deploy <cluster>` reserves with the default duration.
- [ ] `/deploy <cluster> for 4h` sets the duration.
- [ ] `/deploy <cluster> exclusive` and `/deploy <cluster> exclusive for 4h` work.
- [ ] `/deploy <cluster> app <name>` names the chart.
- [ ] The parser accepts `--exclusive`.
- [ ] A bad duration gets a refusal that lists the accepted forms.
- [ ] A comment that is not a command does nothing.
- [ ] One comment per cluster shows the state, and it updates in place.
- [ ] A refusal adds a new comment. An expiry adds a new comment.
- [ ] The comment says when no dev build exists yet, and the reservation still succeeds.
- [ ] The comment says when Flux takes the build.
- [ ] `release-test-app` reserves `graveler` from a comment.

## Blocked by

08 — Receive the dispatch, and authorize it.
06 — Locks, scopes and refusals.
04b — Resolve the app, and refuse what is not supported.
04c — Durations and the cluster limits.

## User stories covered

1, 2, 3, 4, 5, 21, 22, 23, 24, 25.
