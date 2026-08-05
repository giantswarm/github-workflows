# Self-test fixture chart

Not a real chart, and not published anywhere. This exists only so
`.github/workflows/selftest-json-schema-validation.yaml` has something for
`json-schema-validation.yaml` to run against on pull requests.

Both composite actions that workflow calls locate their input with
`find ./helm -maxdepth 2 -name values.schema.json`, and a `workflow_call` job cannot be given a
working directory, so the fixture has to sit at the repository root under `helm/`.

- `values.schema.json` — copied from schemalint's own
  `pkg/lint/rulesets/testdata/cluster_azure.json` (its `rulesets_test.go` asserts zero errors
  under the `cluster-app` rule set), then passed through `schemalint normalize`, which `verify`
  also requires. The ~90 recommendations it reports are advisory and do not fail the run.
- `values.yaml` — the exact stdout of `helm-values-gen values.schema.json`. The `generate` job
  diffs the two, so regenerate this file whenever the schema changes:

  ```bash
  helm-values-gen helm/selftest-cluster-app/values.schema.json > helm/selftest-cluster-app/values.yaml
  ```
