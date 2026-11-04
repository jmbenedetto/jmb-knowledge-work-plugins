# Anthropic data workflows for Pi

Unofficial Pi 1.4.0 adaptation of Anthropic's Apache-2.0 data plugin, version 1.1.0,
from [knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins/tree/2574e29377c7173d0cecffef29a6ecbd7f8ccb5d/data)
at commit `2574e29377c7173d0cecffef29a6ecbd7f8ccb5d`.

The checkout root is the Pi package. Its name is `@jmbenedetto/pi-anthropic-data`;
`private: true` prevents accidental npm publication. Distribution is through git
or a local checkout, not the npm registry. No extension code or install scripts run.

## 1. Use the package

Review the source before loading it. For a one-invocation trial from a checkout,
run this at the repository root, then use the skill command inside Pi:

```sh
pi -e .
```

```text
/skill:anthropic-data-analyze Describe the dataset and answer my question.
```

A separate installation step, if desired, is:

```sh
pi install git:github.com/jmbenedetto/knowledge-work-plugins
```

Use a reviewed commit or tag suffix, such as `@<commit>`, when installing a pinned
version. The default git command follows the fork's default branch; that branch
must contain this adapter before the command will expose these skills. Installation
changes Pi settings and is not part of building or testing this package. Reload Pi
after an approved installation. No installation is necessary for the trial above.

The explicit root manifest exposes only:

- `anthropic-data-analyze`. Answer data questions, from lookups to formal analyses.
- `anthropic-data-build-dashboard`. Build HTML dashboards with charts and filters.
- `anthropic-data-create-viz`. Create Python visualizations.
- `anthropic-data-explore-data`. Profile data structure, quality and patterns.
- `anthropic-data-validate-data`. Review methodology, calculations and conclusions.
- `anthropic-data-write-query`. Write dialect-specific SQL.

All six support explicit `/skill:<name>` invocation and model discovery. The main
entry is [`skills/anthropic-data-analyze/SKILL.md`](skills/anthropic-data-analyze/SKILL.md).
No other upstream plugin, extension, prompt template or theme is exposed.

## 2. What is retained and changed

The pinned source has ten skill documents, despite the six-workflow interface.
The six command workflows above become Pi skills. The other four documents remain
available as namespaced, linked references below the analyze skill:

- `anthropic-data-sql-queries/REFERENCE.md`.
- `anthropic-data-statistical-analysis/REFERENCE.md`.
- `anthropic-data-data-visualization/REFERENCE.md`.
- `anthropic-data-data-context-extractor/REFERENCE.md`, with its four templates and
  references plus its Python packaging script.

Other workflows link to those references using paths relative to their own skill
file. They are not additional Pi skill registrations. The old upstream overview
contains stale skill names; the generated manifest and actual source inventory,
not that overview, define this adapter's resources.

The generator preserves analytical procedures, thresholds, SQL, Python examples,
and dashboard templates. It adds no shared EDA methodology. Changes are limited to:

- Namespaced frontmatter and `/skill:anthropic-data-*` commands.
- Removal of unsupported command-hint and user-invocation metadata.
- Cross-skill references rewritten to bundled, namespaced reference files.
- Pi `read`, `bash`, `edit` and `write` instructions and optional-tool availability.
- Path resolution from the installed skill or reference file, with quoted absolute
  shell paths. Running from outside the checkout or from a path with spaces works.
- Replacement of host-specific connector setup with opt-in capability guidance.
- Portable packaging-script examples and a hidden-ancestor archive fix. The archive
  helper checks hidden paths relative to the generated skill, so a hidden working
  or installation ancestor does not produce an empty archive.

`data/` is unchanged. Every Pi-facing instruction, template and helper lives under
`pi/`; none needs the original `data/` directory at runtime. Keep the package's
`pi/` tree intact because supporting references are shared between the six skills.
Generated company context belongs in a separate private working directory, never
in this repository.

## 3. Dependencies and limitations

Read [`CONNECTORS.md`](CONNECTORS.md) before using external tools.

- No warehouse, notebook, analytics or project-tracker integration is configured.
  Upstream metadata and MCP settings stay inactive in `data/`; they are not copied
  into the Pi resources. In particular, blank Snowflake and Databricks URL entries
  are not enabled. A working connection must be configured and authorized separately.
- Local file analysis needs an available Python environment and the libraries used
  by the chosen workflow. The package installs none. CSV parsing can use the Python
  standard library; pandas, openpyxl, pyarrow, matplotlib, seaborn and plotly are
  optional and depend on the input and output formats.
- The context-extractor archive helper needs Python 3.10 or later. It emits a zip
  archive, not an installable Pi package. Extract a generated skill and load its
  directory with `pi --skill "path/to/generated-skill"`.
- The upstream HTML dashboard template loads Chart.js and its date adapter from
  CDNs. Its offline claim only holds after those libraries are embedded locally.
  Do not promise offline operation for the unmodified CDN template.
- Pi's core tools can inspect a saved PNG with `read`, but do not include a browser
  renderer. Browser validation requires a separately available browser tool or
  manual review. Report unverified rendering rather than claiming it was checked.
- Static and local execution tests do not establish whether an LLM follows the
  workflows well. A real-model end-to-end smoke and independent EDA evaluation
  are separate checks, not run by this suite.

## 4. Build and verify

Node.js 20 or later and Python 3.10 or later are needed for the complete local
suite. There are no npm dependencies to install. Run at the checkout root:

```sh
npm run build
npm run check
npm test
```

The generator derives its root from its own script location, not the current
working directory. `--check` detects missing, changed or unexpected generated
files without writing. Generation rejects unexpected skill inventories, invalid
frontmatter, remaining host assumptions and symlinked resources. It never deletes
stale outputs. Resolve those explicitly before rebuilding.

For the optional no-model integration test, set `PI_TEST_HOST_DIR` to the directory
containing an installed Pi 1.4.0 package's `package.json` and `dist/`, then run:

```sh
PI_TEST_HOST_DIR="$PI_TEST_HOST_DIR" npm test
```

This uses Pi's actual package resolver and skill loader with in-memory settings
and isolated test directories. It neither calls a model nor installs the package.
Without that variable, the integration test is explicitly skipped. The test uses
Pi's version-specific internal module paths and is pinned to 1.4.0.

The suite checks all six names and invocations, all ten source skill documents,
preserved procedural text, byte hashes, bundled links, the archive helper from
an unrelated working directory with spaces and hidden ancestors, deterministic
builds, missing or tampered outputs, unknown inventories, invalid names, unsupported
host assumptions, binary assets and symlink rejection. It also compares `data/`
against the pinned git commit, so development tests require that commit locally.
Test fixtures remain in the ignored repository `.tmp/` directory for inspection.

The upstream repository has no general local test or lint runner. Its GitHub
workflows include authenticated plugin scans and network URL probes; they are not
required for this local, data-only adapter and are not run by `npm test`.

## 5. License and provenance

[`LICENSE`](LICENSE) is copied byte-for-byte from `data/LICENSE`.
[`NOTICE`](NOTICE) identifies the modified adaptation and original source.
[`provenance.json`](provenance.json) records every original data-plugin path,
SHA-256 hash, generated path and hash, and applied transformation. Metadata omitted
from Pi output has an explicit reason. The generator adds no timestamps, absolute
installation paths or machine-dependent content.

Edit `scripts/build.mjs` and rebuild to change generated resources. Commit the
resulting resources and provenance so git installations work without a build step.
