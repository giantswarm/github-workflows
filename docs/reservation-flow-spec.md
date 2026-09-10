# Spec — PR-comment MC reservation and dev deploy

> Status: **READY FOR IMPLEMENTATION.** Written 2026-09-09 from a completed grilling session
> (36 decisions).
>
> This file **supersedes and replaces** the earlier `reservation-flow-plan.md` and
> `reservation-flow-prd.md`, which are deleted. Several of their central decisions were
> reversed, so read the *Reversals* table in *Further Notes* before you trust anything you
> remember from them.
>
> Grounding: the [semver-based-automatic-upgrades RFC](https://github.com/giantswarm/rfc/tree/main/semver-based-automatic-upgrades),
> the live GitOps repos (`management-cluster-bases` and the 14 `*-management-clusters` repos),
> `gitsemver`, `architect-orb`, `devctl`, and the handbook pages under
> `dev-and-releng/how-to-deploy-to-a-management-cluster`.
>
> This spec describes **one** solution. The alternatives that the research phase surfaced were
> rejected on purpose and are not recorded here.

## Glossary

- **MC (management cluster):** a control-plane cluster that runs Giant Swarm apps as Flux
  `HelmRelease` objects.
- **GitOps repo:** a repo with per-MC configuration under `management-clusters/<MC>/…`. There
  are 14 of them: `giantswarm-management-clusters` and 13 `<customer>-management-clusters`.
  Flux reconciles each one from `main`.
- **MCB:** `management-cluster-bases`. It defines each collection app as an `OCIRepository` plus
  a `HelmRelease`, and MCs pull those definitions in as remote Kustomize bases.
- **Collection app:** an app that an MC gets through `management-clusters/<MC>/collections/`.
  This spec supports collection apps only.
- **Stage:** `testing`, `staging`, `stable-testing` or `stable`. It exists only as a path
  segment inside the remote base URL. No field records it.
- **Dev build / dev tag:** a chart that CI publishes from a topic branch, tagged
  `X.Y.Z-dev.<branch>.<date>.<time>.h<sha7>` by `gitsemver`.
- **Sanitized branch:** the branch name after the `gitsemver` transformation (lowercase,
  `[^a-z0-9]+` becomes `-`, middle truncation to 63 characters). The dev tag carries this form,
  not the raw branch name.
- **Reservation:** a time-boxed claim on one app on one MC, which points that MC's copy of the
  app at the dev builds of one branch.
- **Holder:** the developer who owns an active reservation.
- **Scope:** `app` (the default) or `exclusive`. See the collision rules.
- **Central repo:** one new dedicated repo that holds the privileged workflows and the only
  credential that pushes to the GitOps repos.
- **Reaper:** the scheduled job that releases reservations that ran out of time.

## Problem Statement

I am a Giant Swarm engineer. I changed an app on a topic branch, and now I need to see it run on
a real management cluster before I merge it.

Today that costs me a manual, error-prone ritual:

1. I announce my intent in a Slack channel, and hope nobody else works on the same app.
2. I find the app in the GitOps repo, which needs me to know how MCB bases, stages and per-MC
   overrides fit together.
3. I hand-edit a version selector so the MC picks my branch's build instead of a release build.
4. I test.
5. I remember to undo the edit.

Every step fails in a predictable way. I forget the announcement, so a colleague overwrites my
deployment and neither of us understands why the app keeps changing. I get the GitOps edit
wrong, and nothing tells me — the app simply keeps its old version, because a version selector
that matches nothing looks exactly like a selector that has nothing new to match. I finish
testing on a Friday and forget step 5, so the MC stays pinned to a dead branch until somebody
notices weeks later. And nobody, including me, can answer "who is testing what, where, right
now" without reading git history across 14 repos.

## Solution

I comment on my own pull request:

```
/deploy graveler for 4h
```

The system reserves my app on that MC, points the MC at my branch's dev builds, and tells me so
in a comment on the PR. Flux then deploys every new build I push, for as long as I hold the
reservation. When somebody else already holds that app on that MC, my request fails and the
comment names them, their branch and their expiry, so I know who to ask.

I release it with `/undeploy graveler`, or I let it run out. Merging or closing the PR releases
it too. A colleague can release it for me when I go offline, and an engineer can release a stuck
lock from a laptop with `devctl`. A scheduled reaper cleans up whatever everyone forgets, and
posts about it.

Every effect is a commit in the GitOps repo, so the state is one `git log` and one
`kubectl get cm reservations -n giantswarm` away.

## User Stories

### Reserving

1. As an engineer, I want to reserve an MC for my app with one PR comment, so that I never
   hand-edit a GitOps manifest.
2. As an engineer, I want the default reservation to last 10 hours, so that a normal working day
   needs no arguments at all.
3. As an engineer, I want to state a duration in plain words (`/deploy graveler for 4h`), so that
   I do not have to remember flag syntax.
4. As an engineer, I want to write `30m`, `4h` or `2d`, so that short and long tests both work.
5. As an engineer, I want a wrong duration rejected with the list of accepted forms, so that I
   can fix it without reading documentation.
6. As an engineer, I want the MC to follow **every** new build on my branch automatically, so
   that I push a commit and see the result without touching the reservation again.
7. As an engineer, I want to reserve the same app on several MCs at the same time, so that I can
   test one branch against two providers.
8. As an engineer, I want several people to reserve different apps on one MC at the same time,
   so that one MC serves a whole team.
9. As an engineer testing a high-impact app, I want to reserve the MC exclusively, so that
   nobody else's test can interfere with what I measure.
10. As an engineer, I want to promote my own reservation to exclusive without releasing it
    first, so that I do not lose my slot in the process.
11. As an engineer, I want a repeated `/deploy` to reset the expiry, so that extending is the
    same command I already know.
12. As an engineer, I want `/extend` to work as an alias of `/deploy`, so that the word I reach
    for first does what I expect.
13. As an engineer, I want `/extend` to create the reservation when none exists, so that the
    alias never surprises me with a special case.
14. As an engineer, I want the reservation to be capped (7 days, or lower per MC), so that no
    single claim can hold a shared cluster forever.

### Being refused

15. As an engineer, I want my request refused when somebody else holds that app on that MC, so
    that we never overwrite each other silently.
16. As an engineer, I want the refusal to name the holder, the app, the branch and the expiry,
    so that I can ask that person directly.
17. As an engineer, I want a refusal to change nothing at all in any GitOps repo, so that a
    failed request cannot leave debris.
18. As an engineer, I want my exclusive request refused while any other reservation is active on
    that MC, so that "exclusive" means what it says.
19. As an engineer, I want a clear message when the MC name does not exist or is not enabled for
    reservations, together with how to enable it, so that I am not left guessing.
20. As an engineer, I want a clear message when my app is not a collection app on that MC, so
    that I stop looking for a bug in my command.
21. As an engineer, I want a clear message when my repo holds several charts and my command does
    not say which one, so that I can name it and retry.

### Watching it work

22. As an engineer, I want one comment per MC that updates in place with the current state, so
    that a long PR stays readable.
23. As an engineer, I want the comment to tell me that no dev build exists yet, so that I
    understand why nothing changed on the cluster.
24. As an engineer, I want the reservation to proceed even when no build exists yet, so that I
    can reserve and let the running build land by itself.
25. As an engineer, I want to know roughly when Flux will pick the build up, so that I wait
    instead of debugging.
26. As an engineer, I want to see all active reservations on an MC from the command line, so
    that I can plan around my colleagues.
27. As an engineer, I want the reservation visible on the cluster itself, so that I can explain
    an odd version while I debug with `kubectl`.
28. As a team, we want a Slack message for every reservation, extension and expiry, so that the
    channel shows who works where without anybody typing it.
29. As a team, we want the Slack channel to be configurable per MC, so that a team's own MC
    reports into that team's own channel.

### Releasing

30. As an engineer, I want to release my reservation with one comment, so that I free the MC as
    soon as I finish.
31. As an engineer, I want the MC restored exactly to its previous version selection, so that
    releasing needs no follow-up work.
32. As an engineer, I want my reservation released when I merge or close the PR, so that the
    common case needs no discipline from me.
33. As an engineer, I want a colleague to be able to release my reservation, so that my day off
    does not block the team.
34. As an engineer, I want to know who released a reservation, so that an unexpected change is
    traceable.
35. As an engineer, I want `/undeploy` to tell me when there was nothing to release, so that I
    do not assume it worked.
36. As an on-call engineer, I want to force-release a lock with `devctl` from my laptop, so that
    a broken workflow never leaves an MC stuck.
37. As an engineer, I want my reservation released after I rename the PR branch, so that the MC
    does not track a branch that stopped producing builds.

### Expiry

38. As an engineer, I want my reservation to expire on its own, so that a cluster I forget about
    returns to normal.
39. As an engineer, I want a PR comment when my reservation expires, so that a version change
    never surprises me.
40. As a team, we want expired reservations swept on a schedule, so that cleanup never depends
    on a human remembering.
41. As a platform maintainer, I want the sweep interval easy to change, so that we can tune it
    after we see what it costs.

### Builds

42. As an engineer, I want no build at all before I open a PR, so that a scratch branch costs no
    CI time and no registry space.
43. As an engineer, I want basic checks to run on a branch without a PR, so that I still get
    fast feedback on obvious mistakes.
44. As an engineer, I want the current head commit built as soon as I open the PR, so that a
    reservation has something to deploy immediately.
45. As an engineer, I want every commit after that built, so that the reserved MC tracks my
    newest code.

### Safety

46. As a platform maintainer, I want only members of the `giantswarm` org to trigger a
    reservation, so that an outside account can never change cluster configuration.
47. As a platform maintainer, I want the commenter to also hold write access to the app repo, so
    that only people who can change the code can deploy it.
48. As a platform maintainer, I want the app repo itself to be under the `giantswarm` org, so
    that a fork or an unrelated repo cannot drive the flow.
49. As a platform maintainer, I want the authorization decided in the trusted central repo, so
    that an app-repo maintainer cannot edit their way past it.
50. As a platform maintainer, I want the dispatch payload treated as untrusted input, so that a
    forged field changes nothing.
51. As a platform maintainer, I want the credential that pushes to GitOps repos to live in one
    place only, so that a leak in any app repo cannot reach cluster configuration.
52. As a platform maintainer, I want an MC enabled for reservations only by a reviewed commit in
    its own GitOps repo, so that a dev build can never reach a cluster whose owners did not
    agree.
53. As a platform maintainer, I want the tool to render the changed configuration and check the
    result before it pushes, so that a malformed change cannot stop an MC from reconciling.
54. As a platform maintainer, I want the tool to fail loudly when the rendered result does not
    contain the reservation, so that a silent no-op is impossible.
55. As a platform maintainer, I want a CI check that renders each touched MC's collections, so
    that manual changes to that path stop being invisible.
56. As a platform maintainer, I want each reservation recorded in git, so that the state is
    auditable and needs no cluster access to read.
57. As a platform maintainer, I want release and expiry to restore the previous state exactly,
    so that repeated use cannot make a cluster drift.
58. As a platform maintainer, I want parallel requests from different app repos to serialize
    safely, so that two reservations at the same second cannot lose one another's change.
59. As a platform maintainer, I want the reservation to never touch a release or
   release-candidate version selector, so that the existing upgrade flows keep working.

## Implementation Decisions

### 1. Execution model

- Every effect is a **commit to the GitOps repo that holds the target MC**. Flux reconciles it.
  Nothing writes to a cluster directly, and no workflow holds cluster credentials.
- The commit goes **straight to `main`**, with no pull request. The safety comes from the local
  render check below, not from a review that a bot would approve. Reconfigure branch protection
  in the GitOps repos to permit this for the reservation identity.
- Concurrency: clone, change, push. On rejection, rebase and retry, up to 5 attempts, then fail
  and report on the PR.

### 2. The effect on the cluster

- A reservation adds a **new `OCIRepository`** named `<app>-dev-reservation` in namespace
  `giantswarm`, and patches the app's `HelmRelease.spec.chartRef` to point at it. **The app's
  own `OCIRepository` is never changed.**
- Build the new object by **copying the resolved original object and changing exactly three
  things**: `metadata.name`, the annotations, and `spec.ref`. A hand-built object silently loses
  `secretRef`, `provider`, `verify`, `insecure` and `layerSelector`, and a lost `secretRef` means
  a registry authentication failure that looks like a missing chart.
- `spec.ref` becomes an auto-follow selector, as the RFC describes:
  `semver: ">=0.0.0-0"` and
  `semverFilter: '^[0-9]+\.[0-9]+\.[0-9]+-dev\.<sanitized-branch>\..*$'`.
- Override `spec.interval` to `1m` on the reservation object, so a new build lands quickly.
- Stamp the reservation on the new object as annotations, so `kubectl` can answer "why this
  version": `reservation.giantswarm.io/user`, `/branch`, `/pr`, `/scope`, `/from`, `/until`.
- The `HelmRelease` patch is a **strategic-merge patch**, not a JSON6902 patch. The base shape
  differs between stages, so an `op`-based patch would need per-stage branching.
- **Several instances of one app on one MC:** create **one** reservation `OCIRepository`, and
  patch **every** matching `HelmRelease`. All instances share the chart and the branch, so a
  second source object adds nothing.

Why a second object instead of an in-place change: the `testing` stage applies a version selector
that targets `OCIRepository` **by kind, with no name**. A new object that our own Kustomize
component introduces is invisible to that selector, so no merge-order question can break it. A
leftover object that nobody references is inert, while a forgotten in-place change keeps pinning
the app.

### 3. Layout in the GitOps repo

- One reservation is **one Kustomize `Component` directory**:
  `management-clusters/<MC>/collections/reservations/<app>/`. It holds the new `OCIRepository`
  and the inline `chartRef` patch.
- The MC's `collections/kustomization.yaml` gains **one line** under `components:`.
- Kustomize evaluates `components` **after** `resources`. That is what lets the component patch
  a `HelmRelease` that a remote MCB base contributes. This mechanism is already in production for
  the stage version selectors.
- Release deletes the directory and that one line. `ls .../collections/reservations/` lists what
  is active.
- Do not put a reservation patch inline in `collections/kustomization.yaml`. Two edits per
  reservation in one shared file is the git-conflict surface this layout removes.

### 4. Reservation state

- The source of truth is a **committed `ConfigMap` named `reservations` in namespace
  `giantswarm`**, one file per MC:
  `management-clusters/<MC>/configmap-reservations.yaml`.
- The MC root `kustomization.yaml` lists it under `resources`. That path **is** rendered by the
  existing `lint` and `generate_diffs` checks, so every reservation produces a visible diff.
- **One key per reservation, keyed by app name**, because `(app, MC)` is the lock key and the
  file is per MC. Duplicate keys are then impossible.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: reservations
  namespace: giantswarm
  annotations:
    reservations.giantswarm.io/max-duration: 7d
    reservations.giantswarm.io/slack-channel: "#reservations"
data:
  app-operator: "{user: alice, branch: fix-crash, pr: giantswarm/app-operator#123, scope: app, from: 2026-09-09T10:00:00Z, until: 2026-09-09T20:00:00Z}"
```

- The value is a one-line YAML flow mapping, so `kubectl get cm reservations -n giantswarm -o yaml`
  stays readable and a machine can still parse it. Timestamps are RFC3339 in UTC.
- The file stays in the repo with `data: {}` when nothing is reserved.
- The reservation appears in the same commit as its component directory. Never write one without
  the other.

### 5. Per-MC opt-in

- **The presence of `configmap-reservations.yaml`, wired into the MC root `kustomization.yaml`,
  is the opt-in.** No second file and no allowlist.
- One reviewed pull request by the MC owners turns the feature on for that MC. The same PR adds
  the file and the `resources` entry.
- Per-MC settings ride as annotations on that ConfigMap: `max-duration` and `slack-channel`. The
  central repo holds the defaults for an MC that sets neither.
- The tool refuses any MC without that ConfigMap, and says how to opt in.
- Do not gate on stage. Only 2 of 43 MCs run stage `testing`, so a stage rule would cover 2
  clusters.
- The file name must not contain `secret` or `credential`. Those words match the SOPS creation
  rules in these repos.

### 6. Locking and collision rules

Scopes: `app` (default) and `exclusive`. An `exclusive` reservation still patches only the
requester's own app — it is a lock over the MC, not a change to other apps.

1. A new `app` reservation fails when the same app already holds a reservation on that MC.
2. A new `app` reservation fails when any `exclusive` reservation is active on that MC.
3. A new `exclusive` reservation fails when any reservation is active on that MC, **except** when
   exactly one is active and it belongs to the same user **and** the same app. That case is a
   promotion: rewrite the entry's scope in place and keep the reservation.
4. On failure, change nothing anywhere, and report the holder, the app, the branch and the
   expiry on the PR.
5. One reservation per `(app, MC)`. The same app on different MCs is allowed and normal.

### 7. Locating the app

- Resolve by **rendering the MC's `collections/` and matching the rendered `OCIRepository`
  objects on `spec.url`**, against the chart name taken from the app repo's `helm/*/Chart.yaml`
  at the PR head. Do not match on object name, and do not assume the repo name is the chart name.
- Refuse, with the reason, when the render yields no match.
- Accept an optional `app <name>` argument. Require it when the repo holds several charts, and
  accept it as an override when a chart name does not match its URL.
- Patch **all** matching `HelmRelease` objects when the app runs several times on one MC.
- Refuse a `HelmRelease` that uses `spec.chart` instead of `spec.chartRef`. Collection apps all
  use `chartRef` today.

### 8. Validation

- Before it pushes, the tool renders the MC's `collections/` and **checks that the rendered
  output really contains the reservation `chartRef`**. That assertion, not the render alone, is
  what catches a wrong component merge order.
- A failed render or a failed assertion aborts the push and reports on the PR.
- Add a `build-<MC>-collections` target to the **shared** Makefile in MCB, mirroring the
  `build-<MC>-catalogs` target that already exists there. Every GitOps repo then gets it, and a
  developer can run it on a laptop.
- Add a CI workflow that calls that target **for the MCs a pull request touches**, not for all 43.
  Roll it out to `giantswarm-management-clusters` first.

### 9. Commands

```
/deploy <MC>                       # 10h, app-scoped
/deploy <MC> for 4h
/deploy <MC> exclusive
/deploy <MC> exclusive for 4h
/deploy <MC> app <name>            # when the repo holds several charts
/extend <MC> [for <dur>]           # strict alias of a repeated /deploy
/undeploy <MC>
```

- Prose keywords, `exclusive` and `for`, with no dashes. The parser also accepts `--exclusive`.
- A repeated `/deploy` by the holder resets the expiry.
- `/extend` creates the reservation when none exists.
- The scope comes from the command that runs. `/extend <MC> exclusive` promotes, and must pass
  rule 3.
- `/undeploy` with nothing to release tells the user so.
- Durations: `30m`, `4h`, `2d`. Default 10h. Maximum 7 days, or lower per MC. Reject anything
  else with the list of accepted forms.

### 10. Core logic in `devctl`

- Add a `devctl reservation` command group: `reserve`, `release`, `list`, `extend`, `reap`. It
  owns all the GitOps logic above.
- The GitHub Actions are thin. They parse, authorize, run `devctl` and report. "Implemented as
  GitHub Actions" describes the user-facing surface, not the business logic.
- `release` must work from a laptop, so an engineer can force-release a stuck lock without CI. A
  laptop run pushes as the invoking user and needs the same push rights.
- **Export the branch sanitizer from `gitsemver` as a public function, and import it.** Do not
  copy the logic. A drifted copy produces a `semverFilter` that never matches, and neither Flux
  nor the tool reports anything wrong. This is the single most likely silent failure in the
  feature.
- Residual risk to state in the tool's output: two different branch names can sanitize to the
  same string. Record the real branch name in the reservation, so a collision is detectable.

### 11. Privilege topology

- Create **one new dedicated repo** for this feature, for example `giantswarm/reservations`. It
  holds the reserve, release and reaper workflows, and the **only** credential that pushes to the
  GitOps repos.
- App repos hold a token scoped to that one repo. A leaked app-repo token therefore reaches one
  small repo, and no GitOps repo and no shared workflow repo.
- Do not receive the dispatch in `github-workflows`. A dispatch needs `contents: write` on the
  target, which would make the org's shared workflows writable from every app repo.
- Do not put the receiving workflow in each GitOps repo. That is 14 copies of the credential, and
  it leaves the reaper with no central home.
- The app repo side is a **pure trigger with no security value**, because a repo admin can edit
  its workflow. It sends only `{repo, pr_number, comment_id, commenter_login}`.
- The central repo **re-reads** the comment, the pull request and the branch from the API, and
  ignores everything else in the payload.

### 12. Authorization

The central repo performs all three checks, and each one must pass:

1. The app repo is under the `giantswarm` org.
2. The commenter is a member of the `giantswarm` org, by API check.
3. The commenter holds write access to the app repo, by API check.

- The built-in `GITHUB_TOKEN` **cannot** read org membership, so this check has to run centrally
  with the central App's credential. The App needs `members: read` on the org and `metadata: read`
  on the app repos.
- The app repo may run a cheap advisory pre-check for fast feedback. The central check decides.
- `author_association` alone is not sufficient evidence of membership.

### 13. Release triggers

A reservation ends in five ways, and all five run the same release logic:

1. `/undeploy <MC>`.
2. The pull request is merged or closed.
3. The expiry passes, and the reaper sweeps it.
4. The PR head branch no longer matches the stored branch. The reaper detects this and releases,
   because the old branch produces no more builds. The developer can then run `/deploy` again.
5. A manual `devctl reservation release` run.

Who may release: any org member with write access to the app repo, **from the pull request that
holds the reservation**. So a colleague can free an MC, and nobody can touch a reservation from
an unrelated PR. The PR comment names who released it.

### 14. The reaper

- One central reaper in the central repo, on a schedule. It sweeps every enabled MC in every
  GitOps repo it has access to.
- The cadence must be easy to change without a code change — a repository variable. Start at
  about 30 minutes and tune it once the cost is visible.
- It reports each release on the originating pull request and in Slack. It stays silent when it
  finds nothing.

### 15. Notifications

- Slack gets a message for a reservation, an extension and an expiry. Denials do not go to Slack;
  they concern the requester only, who gets a PR comment.
- The channel comes from the MC's ConfigMap annotation, and falls back to the central default.
- On the pull request: **one sticky comment per MC**, updated in place, showing the current state
  — MC, app, branch, expiry, and whether a dev build exists yet. A denial and an expiry each get
  a **new** comment, because editing a comment notifies nobody.
- When no dev build exists yet, reserve anyway and say so plainly in the comment. The PR build
  often runs at that same moment, and Flux picks the chart up as soon as it lands. A refusal
  would be wrong most of the time, and a silent "nothing happened" is the confusing case.

### 16. Builds

This feature depends on a build rule that does not exist yet, and it carries that rule as its own
requirement:

- No build runs on a branch without a pull request. Basic checks still run.
- When a pull request opens, CI builds the **current head commit**.
- Every later commit on that branch is built while the pull request is open.
- There is **no** `builds-on` label and **no** `nobuild/<name>` branch prefix. The earlier
  `nobuild/` design is dropped entirely.
- This touches `devctl`'s CircleCI config generation and `architect-orb`. A reservation is
  worthless without a dev build, so the guarantee belongs in this spec, with one named owner.

### 17. Rollout scope

- Requirements cover all 14 GitOps repos. **The first deployment enables
  `giantswarm-management-clusters` only.** Nothing in the design is specific to it.
- Collection apps only. `extras` apps are refused with a clear message.

## Testing Decisions

**What makes a good test here.** Assert external behaviour, never internals. For this feature the
external behaviour is *the content of the resulting commit* and *the outcome reported to the
user*. So a test provides a repo state plus a command, and then asserts on the produced files and
the returned outcome. No test asserts on a private helper, and no test asserts that some function
was called.

**Primary seam — aim for exactly one.** The `devctl reservation` business-logic package, driven
against a **git working-tree fixture**: a temporary clone of a CMC-shaped repo with an MC, a
`collections/kustomization.yaml` that references an MCB-shaped base, an app pair, and a
`reservations` ConfigMap. `devctl` follows the "logic in the package, wiring in the command"
convention, so the commands are thin wrappers and this one seam covers the behaviour.

Through that one seam, test:

1. Reserve writes the component directory, the reservation `OCIRepository`, the `chartRef` patch,
   the ConfigMap key and the annotations — all in one commit.
2. The new `OCIRepository` carries over `secretRef`, `provider` and `verify` from an original
   that sets them.
3. The `semverFilter` matches a tag that `gitsemver` really emits for the same branch. Drive both
   sides from the exported sanitizer, and include a branch that needs truncation.
4. All five collision rules, including the promotion case from rule 3, and including the holder
   details in the refusal.
5. Release, expiry and a merged pull request each restore the repo to a state identical to the
   state before the reservation.
6. The render assertion fails when the component lands in a position where the rendered output
   does not carry the reservation `chartRef`.
7. Resolution refuses on no match, on an ambiguous multi-chart repo with no `app` argument, and
   on a `spec.chart` HelmRelease. Resolution patches every instance when an app runs twice.
8. An MC without the ConfigMap is refused, with the opt-in instructions.
9. Two reservations for different apps on one MC coexist, and the second one does not disturb the
   first one's files.
10. A push rejection triggers a rebase and a retry.

**Two pure functions, tested at their own boundary.**

- The comment parser: every command form in section 9, the `--exclusive` tolerance, a bad
  duration, an over-cap duration, and text that is not a command at all.
- The authorization predicate: each of the three checks failing on its own, and all passing.

**Manual end-to-end.** Validate the workflow wiring against `release-test-app` on the `graveler`
MC: reserve, watch Flux pick the dev chart up, check the annotations with `kubectl`, hit a
collision, release, and let the reaper sweep a back-dated expiry.

**Prior art.** `devctl`'s existing package-level tests, and its git and GitHub client usage.

## Out of Scope

- `extras` apps. They use a different namespace, a Flux Kustomization with `prune: false`,
  kustomizations nested two levels deep, and at least one `OCIRepository` shared by several
  `HelmRelease` objects. That sharing needs its own collision rule. The tool detects an `extras`
  app and refuses it, so nothing fails silently.
- Apps that own no `OCIRepository`: App CRs, `cluster-app-manifests.yaml`, `catalogs/`.
- Any change to release or release-candidate version selection. Those flows keep working
  untouched.
- Any live cluster write. There is no `kubectl patch` path and no cluster credential in CI.
- Reporting deploy status from CI. The workflows never read the cluster, so the PR comment
  reports the commit, not the running version.
- Promoting one app version across environments. The RFC puts that out of scope.
- Flux image automation (`ImageUpdateAutomation`, `ImagePolicy`). Those controllers do not run in
  the fleet, and a 10-hour reservation does not justify deploying them.
- The `nobuild/` branch-prefix opt-out. Dropped.
- Extending the shared `make build-<MC>` to render `collections/` for every MC on every pull
  request. It is the better end state, and it also fixes the empty rendered diff for manual
  changes, but it changes CI for 14 repos at once.

## Further Notes

### Reversals from the superseded documents

| Area | Superseded plan said | This spec says |
|---|---|---|
| Effect | Patch the app's own `OCIRepository` in place | Add `<app>-dev-reservation` and patch `chartRef` |
| Layout | A `patches:` entry in `collections/kustomization.yaml` | One Kustomize `Component` directory per reservation |
| State | `reservations.yaml`, not applied by Flux | A committed `reservations` ConfigMap |
| Eligibility | Stage `testing`, GS MCs only | A per-MC opt-in file, any repo |
| Builds | Off by default, gated on a `builds-on` label | On when a pull request is open. No label |
| Central workflow | In the GitOps repo | In one new dedicated repo |
| Commands | `/build-deploy`, `/release`, flag syntax | `/deploy`, `/undeploy`, `/extend`, prose syntax |
| Reaper | A scheduled caller per GitOps repo | One central reaper, cadence in a variable |
| Maximum duration | 48h | 7d |

### Environment facts, verified 2026-09-09

These invalidate assumptions that a reader may bring from the older documents.

- **43 MCs across 14 repos.** 4 repos hold zero MCs, so tooling must tolerate an empty
  `management-clusters/`.
- **Stage census:** `stable` 19 (all customer repos), `stable-testing` 21 (all GS), `testing` 2
  (`glean`, `graveler`), `staging` 1 (`gazelle`). The stage exists only inside the remote base
  URL. No field, label or annotation records it, and 5 MCs reference 2-3 collections at once, so
  "the stage of MC X" is not structurally single-valued.
- **Collection apps are uniform.** All 90 `OCIRepository` objects in the MCB collections use
  `spec.ref: {semver: x.x.x}`, namespace `giantswarm`, URL
  `oci://gsoci.azurecr.io/charts/giantswarm/<name>`, and pair 1:1 with a same-named `HelmRelease`
  that uses `chartRef`. 132 `chartRef` uses, zero `spec.chart` uses.
- **17 of 90 collection names repeat** across provider collections. Combined with the 5
  multi-collection MCs, a name-based lookup is ambiguous by construction. Hence the
  render-and-match-on-URL rule.
- **Nothing renders a per-MC `collections/` overlay in CI.** `make build-<MC>` renders the MC root
  and `extras`; `generate_diffs` renders the MC root only. MCB's own `build-collections` (added
  2026-08-04) renders MCB's `bases/collections/*/stages/*` and is absent from the shared Makefile
  that the GitOps repos use. So a per-MC collections change reaches `main` with no validation and
  an **empty rendered diff**. This is why the tool must render and assert before it pushes, and
  why the new CI check exists.
- **Renovate does not touch these fields.** The `kubernetes` and `kustomize` managers are disabled
  fleet-wide. No bot fights the reservation, and no bot cleans it up either. Note that MCB's
  `AGENTS.md` claims Renovate updates collection versions. That claim is false; do not build on it.
- **The `testing` stage version selector targets `OCIRepository` by kind with no name**, and must
  stay last in `components:`. This is the reason for a separate reservation object.
- **`spec.ref` precedence is `digest`, then `semver`, then `tag`.** A `tag` written while `semver`
  is present does nothing.
- **The registry removes dev tags after about one month.** Harmless for a reservation of hours,
  but relevant to any later idea of pinning an old dev build.
- **CODEOWNERS covers every path** in these repos, with `team-honeybadger` on all of them, so
  review is required unless the reservation identity bypasses it.
- **SOPS creation rules match file names containing `secret` or `credential`.** A new unencrypted
  file must avoid both words.
- **Flux runs v2.6** in the fleet. Every field this spec uses exists there.

### Delivery order

The work is broken into 18 vertical slices, one file each, in the `reservation-flow` directory
next to this spec. Its `README.md` holds the dependency table, and each slice file carries a
`status` field. Take the order from there, not from this spec.

Three things about that order matter here:

1. **The `gitsemver` sanitizer comes first** (slice 01). It is small and additive, and everything
   else depends on a byte-for-byte match with it.
2. **The `devctl` core is validated from a laptop against `graveler`** (slice 04a) before any
   workflow exists. The commit is the whole product, so the CLI proves the feature on its own.
3. **The build rule is independent** (slice 03). It shares no code with the rest, and a
   reservation is worthless without it.

### Repo conventions to respect

`github-workflows` requires a CHANGELOG entry, least-privilege `permissions`, `actions/checkout`
with `persist-credentials: false`, and action versions pinned to a commit SHA.
