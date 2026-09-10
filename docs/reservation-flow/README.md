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
| 04 | `devctl reservation reserve` — the full path, end to end | 01 |
| 05 | `devctl reservation release` and `list` | 04 |
| 06 | Locks, scopes and refusals | 04 |
| 07 | The central repo and its credential | 04 |
| 08 | Receive the dispatch, and authorize it | 07 |
| 09 | `/deploy` from a pull request comment | 08, 06 |
| 10 | `/undeploy`, and release on a closed pull request | 05, 09 |
| 11 | `/extend`, and promotion from a comment | 09, 06 |
| 12 | The reaper | 05, 07 |
| 13 | Slack notifications | 09, 12 |
| 14 | Enable the remaining clusters and the app repos | 09, 02 |
| 15 | Document the flow in the handbook | 09, 10 |

Slices 01, 02 and 03 have no blockers, and they can run in parallel. 03 is a separate build-rule
change, and a reservation is worthless without it.
