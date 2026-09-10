# Reservation flow — issues

Vertical slices for the feature in [`../reservation-flow-spec.md`](../reservation-flow-spec.md).
Each slice cuts through every layer, and each one is demoable on its own.

One file per slice. The `status` field in the front matter tracks the progress. Values:
`todo`, `in-progress`, `blocked`, `done`.

Show the progress:

```
grep -H '^status:' docs/reservation-flow/[0-9]*.md
```

## Dependency order

| # | Title | Blocked by |
|---|---|---|
| 01 | Export the branch sanitizer from gitsemver | — |
| 02 | Render each touched cluster's collections in CI | — |
| 03 | Build when a pull request opens, then build every commit | — |
| 04a | Reserve one app on one cluster, from end to end | 01 |
| 04b | Resolve the app, and refuse what is not supported | 04a |
| 04c | Durations and the cluster limits | 04a |
| 04d | Safe pushes when reservations arrive together | 04a |
| 05 | `devctl reservation release` and `list` | 04a |
| 06 | Locks, scopes and refusals | 04a |
| 07 | The central repo and its credential | 04a |
| 08 | Receive the dispatch, and authorize it | 07 |
| 09 | `/deploy` from a pull request comment | 08, 06, 04b, 04c |
| 10 | `/undeploy`, and release on a closed pull request | 05, 09 |
| 11 | `/extend`, and promotion from a comment | 09, 06 |
| 12 | The reaper | 05, 07 |
| 13 | Slack notifications | 09, 12 |
| 14 | Enable the remaining clusters and the app repos | 09, 02, 04d |
| 15 | Document the flow in the handbook | 09, 10 |

Slices 01, 02 and 03 have no blockers, and they can run in parallel. 03 is a separate build-rule
change, and a reservation is worthless without it.

04a is the tracer bullet: it walks the whole path for the narrowest case. 04b, 04c and 04d widen
that path, and they can run in parallel after 04a.
