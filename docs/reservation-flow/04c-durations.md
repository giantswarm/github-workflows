---
status: todo
---

# 04c — Durations and the cluster limits

## What to build

Slice 04a uses a fixed duration. Now make it an option, and give it limits.

The default is 10 hours. The maximum is 7 days. A cluster can set a lower maximum through an
annotation on its reservations ConfigMap, next to the channel annotation.

The accepted forms are `30m`, `4h` and `2d`. A wrong form gets a refusal that lists the accepted
forms, so nobody has to read documentation to fix it.

The duration sets the start time and the end time in the reservation entry, and in the
annotations on the source object. Timestamps are RFC3339 in UTC.

## Acceptance criteria

- [ ] The default duration is 10 hours.
- [ ] The maximum is 7 days, or the cluster value when that is lower.
- [ ] The command accepts `30m`, `4h` and `2d`.
- [ ] A wrong form gets a refusal that lists the accepted forms.
- [ ] A duration over the maximum gets a refusal that names the maximum.
- [ ] The entry and the annotations carry the start time and the end time in UTC.

## Blocked by

04a — Reserve one app on one cluster, from end to end.

## User stories covered

2, 4, 5, 14.
