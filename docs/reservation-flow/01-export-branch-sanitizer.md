---
status: todo
---

# 01 — Export the branch sanitizer from gitsemver

## What to build

`gitsemver` holds the transformation that turns a branch name into the form a dev tag carries:
lowercase, non-alphanumeric characters to dashes, and middle truncation to 63 characters. Make it
a public function of the `gitsemver` library, and release a tagged version.

Everything that builds a version filter for a reservation imports that function. A copy of the
logic drifts. A drifted copy makes a filter that matches no tag, and Flux reports nothing in that
case. This is the most likely silent failure in the whole feature, so remove the possibility
first.

## Acceptance criteria

- [ ] `gitsemver` exports the sanitizer as a public function.
- [ ] The behaviour stays the same for every existing input. No dev tag changes.
- [ ] Tests cover a plain branch, a branch with slashes and capitals, and a branch longer than 63 characters.
- [ ] `gitsemver` has a new tagged release.

## Blocked by

None - can start immediately.

## User stories covered

Supports 6 and 54.
