# Repository change log

## 1. Pi data adapter, 2026-11-04

- Created the private root package `@jmbenedetto/pi-anthropic-data`, exposing only
  six namespaced data workflow skills. No extension, prompt or theme is exposed.
- Added `pi/scripts/build.mjs`, `pi/tests/adapter.test.mjs`, `pi/README.md`, generated
  resources under `pi/skills/`, `pi/CONNECTORS.md`, `pi/LICENSE`, `pi/NOTICE` and
  `pi/provenance.json`. Added `.gitignore` for repository-local `.tmp/` test fixtures.
- Preserved the upstream `data/` tree byte-for-byte against commit
  `2574e29377c7173d0cecffef29a6ecbd7f8ccb5d`. All ten source skill documents are
  represented: six registered workflows and four linked supporting references.
- Adapted commands, metadata, tool instructions and relative resource paths for
  Pi 1.4.0. Retained upstream analytical methods and examples. Added per-file
  modification notices and hashes. No warehouse integration or MCP placeholder
  was enabled. No unrelated upstream plugin was adapted.
- Corrected the bundled archive helper's hidden-ancestor exclusion using paths
  relative to the generated skill root. Left the upstream helper unchanged.
- TDD baseline: the initial test run failed because package resources and generator
  did not exist. The modification-notice check also failed before implementation.
  A later failing regression caught source paths being mistaken for commands;
  command rewriting now distinguishes invocations from original file paths.
- Verification passed: `npm run build`, `npm run check`, and the complete `npm test`
  suite with an installed Pi 1.4.0 package selected through `PI_TEST_HOST_DIR`.
  All 16 tests passed, with zero failures or skips. The real Pi package resolver
  and skill loader found exactly six skills with no diagnostics. JavaScript syntax
  checks and the pinned upstream comparison passed.
- The package dry run contained no unrelated plugin files. npm automatically adds
  the existing root `README.md`; the packaging inspection accounts for that
  standard behavior. No archive was published.
- Not run: real-model smoke, business-data EDA, warehouse connections, browser
  rendering, authenticated upstream CI scans and network URL probes. These checks
  require separate authorization or are outside this local implementation stage.
- No push, merge, installation, global settings change or credential access occurred.
