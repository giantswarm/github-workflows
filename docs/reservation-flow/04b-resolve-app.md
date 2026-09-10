---
status: todo
---

# 04b — Resolve the app, and refuse what is not supported

## What to build

Slice 04a takes the app name from the caller. Now find it.

Render the collections of the cluster, and match the rendered source objects on the chart URL.
Take the chart name from the app repo. Do not match on the object name: 17 of 90 collection names
repeat across collections, so a name match is ambiguous by construction.

Refuse the cases that this version does not support, and say why each time. Silence is the failure
mode to avoid here, because a wrong lookup looks the same as an app that does not move.

An app can run more than once on one cluster. All instances share the chart and the branch, so
create one source object, and patch every instance.

## Acceptance criteria

- [ ] The command resolves the app by a render of the cluster collections, and a match on the chart URL.
- [ ] The command does not match on the object name.
- [ ] The command refuses when the render gives no match, and says why.
- [ ] The command refuses an app from the `extras` folder, and says that this version covers collections only.
- [ ] The command refuses an app whose release holds an inline chart instead of a chart reference.
- [ ] The command needs an app argument when the repo holds more than one chart.
- [ ] The app argument overrides the match when a chart name and a URL disagree.
- [ ] The command patches every app instance on the cluster, and it creates one source object.

## Blocked by

04a — Reserve one app on one cluster, from end to end.

## User stories covered

20, 21.
