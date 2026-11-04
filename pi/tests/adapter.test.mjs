import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const workflows = ['analyze', 'build-dashboard', 'create-viz', 'explore-data', 'validate-data', 'write-query'];
const support = ['data-context-extractor', 'data-visualization', 'sql-queries', 'statistical-analysis'];
const entry = 'pi/skills/anthropic-data-analyze/SKILL.md';
const upstream = '2574e29377c7173d0cecffef29a6ecbd7f8ccb5d';
const sha = data => createHash('sha256').update(data).digest('hex');
const read = path => readFile(join(root, path), 'utf8');
const script = join(root, 'pi/scripts/build.mjs');
const run = (args = [], cwd = root) => spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
async function files(dir) {
  const result = [];
  for (const item of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (item.isDirectory()) result.push(...await files(join(dir, item.name)));
    else result.push(join(dir, item.name));
  }
  return result;
}
async function fixture() {
  await mkdir(join(root, '.tmp'), { recursive: true });
  const dir = await mkdtemp(join(root, '.tmp/adapter space '));
  await cp(join(root, 'data'), join(dir, 'data'), { recursive: true });
  await cp(join(root, 'package.json'), join(dir, 'package.json'));
  return dir;
}
async function builder() {
  assert.ok(existsSync(script), 'deterministic adapter generator must exist');
  return import(pathToFileURL(script).href);
}

test('root package exposes exactly six namespaced workflow skills and no other resource types', async () => {
  assert.ok(existsSync(join(root, 'package.json')), 'Pi package manifest must exist at checkout root');
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.name, '@jmbenedetto/pi-anthropic-data');
  assert.equal(pkg.private, true);
  assert.ok(pkg.keywords.includes('pi-package'));
  assert.deepEqual(pkg.pi.skills, workflows.map(name => `./pi/skills/anthropic-data-${name}`));
  for (const kind of ['extensions', 'prompts', 'themes']) assert.deepEqual(pkg.pi[kind], []);
  const names = [];
  for (const name of workflows) {
    const text = await read(`pi/skills/anthropic-data-${name}/SKILL.md`);
    const declared = text.match(/^name: (.+)$/m)?.[1];
    assert.equal(declared, `anthropic-data-${name}`);
    assert.match(declared, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(declared.length <= 64);
    assert.match(text, /^description: .{1,1024}$/m);
    assert.doesNotMatch(text, /^argument-hint:|^user-invocable:/m);
    assert.match(text, new RegExp(`/skill:anthropic-data-${name}`));
    names.push(declared);
  }
  assert.equal(new Set(names).size, 6);
  const discovered = (await files(join(root, 'pi/skills'))).filter(f => f.endsWith('/SKILL.md'));
  assert.equal(discovered.length, 6, 'supporting references must not register extra skills');
});

test('provenance accounts for every original file with independently verified hashes', async () => {
  const manifest = JSON.parse(await read('pi/provenance.json'));
  assert.equal(manifest.upstream.commit, upstream);
  assert.equal(manifest.upstream.repository, 'https://github.com/anthropics/knowledge-work-plugins');
  const sourcePaths = (await files(join(root, 'data'))).map(f => relative(root, f));
  assert.deepEqual(manifest.files.map(f => f.source).sort(), sourcePaths.sort());
  const represented = [];
  for (const record of manifest.files) {
    const original = await readFile(join(root, record.source));
    assert.equal(record.sourceSha256, sha(original), record.source);
    if (!record.output) {
      assert.ok(record.reason, 'omissions need an explicit reason');
      continue;
    }
    const output = await readFile(join(root, record.output));
    assert.equal(record.outputSha256, sha(output), record.output);
    assert.ok(Array.isArray(record.transforms));
    if (record.transforms.length > 0) assert.match(output.toString('utf8'), /Modified for Pi/, `changed file needs an Apache modification notice: ${record.output}`);
    if (record.source.endsWith('/SKILL.md')) {
      assert.ok(output.toString('utf8').includes(`Modified for Pi from Anthropic's ${record.source}.`), 'modification notice must preserve the real upstream source path');
      represented.push(record.source.split('/')[2]);
    }
  }
  assert.deepEqual(represented.sort(), [...workflows, ...support].sort());
  assert.equal(await read('pi/LICENSE'), await read('data/LICENSE'));
  assert.match(await read('pi/NOTICE'), /Anthropic/);
  assert.match(await read('pi/NOTICE'), /modified/i);
});

test('all upstream procedural lines survive except explicit host adaptation', async () => {
  const manifest = JSON.parse(await read('pi/provenance.json'));
  for (const record of manifest.files.filter(r => r.source.endsWith('/SKILL.md'))) {
    const original = (await read(record.source)).split('\n---\n').slice(1).join('\n---\n');
    const output = await read(record.output);
    const dashboardCompatibilityLines = new Set([
      'Build a self-contained interactive HTML dashboard with charts, filters, tables, and professional styling. Opens directly in a browser -- no server or dependencies required.',
      'Generate a single self-contained HTML file using the base template below. The file includes:',
      '- Dashboard works completely offline',
      "2. Open it in the user's default browser",
      '3. Confirm it renders correctly',
    ]);
    for (const line of original.split('\n')) {
      if (!line.trim() || /Claude|~~|CONNECTORS|\/(?:analyze|build-dashboard|create-viz|explore-data|validate-data|write-query)\b|`(?:sql-queries|data-visualization)` skill/.test(line)) continue;
      if (record.source === 'data/skills/build-dashboard/SKILL.md' && dashboardCompatibilityLines.has(line)) continue;
      assert.ok(output.includes(line), `${record.source}: missing procedural line ${line}`);
    }
  }
});

test('loaded dashboard skill qualifies offline claims while preserving the CDN template', async () => {
  const text = await read('pi/skills/anthropic-data-build-dashboard/SKILL.md');
  assert.doesNotMatch(text, /Dashboard works completely offline|no server or dependencies required|Generate a single self-contained HTML file/);
  assert.match(text, /Offline operation requires embedding the JavaScript libraries locally/);
  assert.match(text, /CDN JavaScript is an external dependency unless embedded/);
  assert.match(text, /https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js@4\.5\.1/);
  assert.match(text, /https:\/\/cdn\.jsdelivr\.net\/npm\/chartjs-adapter-date-fns@3\.0\.0/);
  const provenance = JSON.parse(await read('pi/provenance.json'));
  assert.ok(provenance.files.find(f => f.source === 'data/skills/build-dashboard/SKILL.md').transforms.includes('dashboard-external-dependency-disclosure'));
});

test('loaded dashboard skill requires observed rendering or an explicit unverified fallback', async () => {
  const text = await read('pi/skills/anthropic-data-build-dashboard/SKILL.md');
  assert.match(text, /If an authorized browser inspection tool is available/);
  assert.match(text, /mark rendering unverified and request manual review/);
  assert.match(text, /Launching a browser alone is not verification/);
  assert.doesNotMatch(text, /^3\. Confirm it renders correctly$/m);
});

test('cross-skill references resolve to bundled namespaced resources instead of unavailable commands', async () => {
  const text = await read(entry);
  assert.match(text, /references\/anthropic-data-sql-queries\/REFERENCE\.md/);
  assert.match(text, /references\/anthropic-data-data-visualization\/REFERENCE\.md/);
  assert.match(text, /references\/anthropic-data-statistical-analysis\/REFERENCE\.md/);
  assert.match(text, /references\/anthropic-data-data-context-extractor\/REFERENCE\.md/);
  for (const file of await files(join(root, 'pi/skills'))) {
    if (!file.endsWith('.md')) continue;
    const content = await readFile(file, 'utf8');
    assert.doesNotMatch(content, /\bClaude\b|\bCowork\b|\.claude|~~data warehouse|\/home\/claude|(?<![\w/:-])\/(?:analyze|build-dashboard|create-viz|explore-data|validate-data|write-query)\b|argument-hint:|user-invocable:/);
    // Markdown links are real bundled references. Code-fenced paths in the context
    // templates describe future user-created files, not missing adapter resources.
    for (const match of content.matchAll(/\[[^\]\n]+\]\(([^)]+)\)/g)) {
      if (/^(?:https?:|#)/.test(match[1])) continue;
      assert.ok(existsSync(resolve(dirname(file), match[1])), `${file}: broken link ${match[1]}`);
    }
  }
});

test('Pi workflow instructions use local tools, resolve from skill paths, and treat warehouses as opt-in', async () => {
  for (const name of workflows) {
    const text = await read(`pi/skills/anthropic-data-${name}/SKILL.md`);
    for (const tool of ['read', 'bash', 'edit', 'write']) assert.ok(text.includes(`\`${tool}\``));
    assert.match(text, /absolute path/);
    assert.match(text, /spaces/);
    assert.match(text, /warehouse.*(?:unavailable|not configured)/i);
  }
  const connectors = await read('pi/CONNECTORS.md');
  assert.match(connectors, /Snowflake/);
  assert.match(connectors, /Databricks/);
  assert.match(connectors, /not configured/i);
  const generated = await files(join(root, 'pi'));
  assert.equal(generated.filter(f => /(?:^|\/)\.?mcp\.json$|plugin\.json$/.test(f)).length, 0);
});

test('generation works from another cwd, checks committed outputs, and is byte deterministic', async () => {
  const { build } = await builder();
  const dir = await fixture();
  await build({ root: dir });
  const before = JSON.parse(await readFile(join(dir, 'pi/provenance.json'), 'utf8'));
  await build({ root: dir });
  assert.deepEqual(JSON.parse(await readFile(join(dir, 'pi/provenance.json'), 'utf8')), before);
  const first = (await files(join(dir, 'pi'))).map(async f => [relative(dir, f), sha(await readFile(f))]);
  const stable = await Promise.all(first);
  await build({ root: dir, check: true });
  assert.deepEqual(await Promise.all((await files(join(dir, 'pi'))).map(async f => [relative(dir, f), sha(await readFile(f))])), stable);
  const cli = run(['--check'], dir);
  assert.equal(cli.status, 0, cli.stderr);
  for (const [path, hash] of stable) assert.equal(sha(await readFile(join(root, path))), hash, path);
});

test('check mode detects missing, changed and unexpected generated resources without rewriting them', async () => {
  const { build } = await builder();
  const dir = await fixture();
  await assert.rejects(build({ root: dir, check: true }), /missing|out of date/i);
  await build({ root: dir });
  await writeFile(join(dir, entry), 'edited locally\n');
  await assert.rejects(build({ root: dir, check: true }), /out of date|changed/i);
  assert.equal(await readFile(join(dir, entry), 'utf8'), 'edited locally\n');
  await build({ root: dir });
  await mkdir(join(dir, 'pi/skills/unexpected'), { recursive: true });
  await writeFile(join(dir, 'pi/skills/unexpected/SKILL.md'), 'extra');
  await assert.rejects(build({ root: dir, check: true }), /unexpected/i);
});

test('generator rejects unknown skill inventory rather than silently importing more plugins', async () => {
  const { build } = await builder();
  const dir = await fixture();
  await mkdir(join(dir, 'data/skills/unexpected'), { recursive: true });
  await writeFile(join(dir, 'data/skills/unexpected/SKILL.md'), '---\nname: unexpected\ndescription: extra\n---\n');
  await assert.rejects(build({ root: dir }), /inventory|unexpected/i);
  assert.ok(!existsSync(join(dir, entry)), 'validation must precede writes');
});

test('invalid names, missing descriptions and unresolved host assumptions fail closed', async () => {
  const { build } = await builder();
  for (const mutation of [
    s => s.replace('name: analyze', 'name: Invalid_Name'),
    s => s.replace('name: analyze', `name: ${'a'.repeat(65)}`),
    s => s.replace(/^description:.*\n/m, ''),
    s => s + '\nUse ${CLAUDE_PLUGIN_ROOT}/scripts/tool.py\n',
  ]) {
    const dir = await fixture();
    const target = join(dir, 'data/skills/analyze/SKILL.md');
    await writeFile(target, mutation(await readFile(target, 'utf8')));
    await assert.rejects(build({ root: dir }), /name|description|host|unsupported/i);
    assert.ok(!existsSync(join(dir, entry)));
  }
});

test('symlinked source resources are rejected before reading outside the data plugin', async () => {
  const { build } = await builder();
  const dir = await fixture();
  await symlink(join(root, 'LICENSE'), join(dir, 'data/skills/analyze/external-license'));
  await assert.rejects(build({ root: dir }), /symlink/i);
});

test('bundled context extractor script runs outside checkout with spaces and hidden ancestors', async () => {
  const dir = await fixture();
  const skill = join(dir, 'example skill');
  await mkdir(join(skill, 'references'), { recursive: true });
  await writeFile(join(skill, 'SKILL.md'), '---\nname: example-skill\ndescription: Example data context.\n---\n# Example\n');
  await writeFile(join(skill, 'references/domain.md'), '# Domain\n');
  const packager = join(root, 'pi/skills/anthropic-data-analyze/references/anthropic-data-data-context-extractor/scripts/package_data_skill.py');
  assert.ok(existsSync(packager), 'upstream script must be bundled');
  const output = join(dir, 'output files');
  const result = spawnSync('python3', [packager, skill, output], { cwd: dir, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const zipped = spawnSync('python3', ['-c', 'import sys,zipfile,json; print(json.dumps(zipfile.ZipFile(sys.argv[1]).namelist()))', join(output, 'example skill.zip')], { encoding: 'utf8' });
  assert.equal(zipped.status, 0, zipped.stderr);
  assert.deepEqual(JSON.parse(zipped.stdout).sort(), ['example skill/SKILL.md', 'example skill/references/domain.md']);
  const bad = join(dir, 'bad skill');
  await mkdir(bad);
  const rejected = spawnSync('python3', [packager, bad, output], { cwd: dir, encoding: 'utf8' });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stdout, /Missing SKILL.md/);
  assert.ok(!existsSync(join(output, 'bad skill.zip')));
});

test('upstream data tree is byte-identical to the pinned commit', async () => {
  const baseline = spawnSync('git', ['ls-tree', '-r', '--name-only', upstream, '--', 'data/'], { cwd: root, encoding: 'utf8' });
  assert.equal(baseline.status, 0, baseline.stderr);
  const paths = baseline.stdout.trim().split('\n');
  assert.deepEqual((await files(join(root, 'data'))).map(p => relative(root, p)).sort(), paths.sort());
  for (const path of paths) {
    const original = spawnSync('git', ['show', `${upstream}:${path}`], { cwd: root });
    assert.equal(original.status, 0);
    assert.equal(sha(await readFile(join(root, path))), sha(original.stdout), path);
  }
});

test('binary assets and paths with spaces survive relocation without upstream dependencies', async () => {
  const { build } = await builder();
  const dir = await fixture();
  const asset = 'data/skills/analyze/assets/example chart.bin';
  await mkdir(dirname(join(dir, asset)), { recursive: true });
  const bytes = Buffer.from([0, 255, 128, 1, 10]);
  await writeFile(join(dir, asset), bytes);
  await build({ root: dir });
  assert.deepEqual(await readFile(join(dir, 'pi/skills/anthropic-data-analyze/assets/example chart.bin')), bytes);
  const manifest = JSON.parse(await readFile(join(dir, 'pi/provenance.json'), 'utf8'));
  assert.equal(manifest.files.find(f => f.source === asset).outputSha256, sha(bytes));
  await build({ root: dir, check: true });
});

test('generator rejects manifest expansion and output symlink redirection before writing', async () => {
  const { build } = await builder();
  const dir = await fixture();
  const manifest = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
  manifest.pi.skills.push('./finance/skills');
  await writeFile(join(dir, 'package.json'), JSON.stringify(manifest));
  await assert.rejects(build({ root: dir }), /manifest/i);
  assert.ok(!existsSync(join(dir, entry)));
  const safe = await fixture();
  const external = await fixture();
  await mkdir(join(external, 'output'));
  await symlink(join(external, 'output'), join(safe, 'pi'));
  await assert.rejects(build({ root: safe }), /symlink/i);
  assert.deepEqual(await readdir(join(external, 'output')), []);
});

test('CLI rejects unsupported arguments', async () => {
  await builder();
  const result = run(['--unknown']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage|unknown|unsupported/i);
});

test('real Pi package manager and skill loader discover exactly six resources without warnings', {
  skip: !process.env.PI_TEST_HOST_DIR && 'Set PI_TEST_HOST_DIR to an installed Pi 1.4.0 package directory for no-model discovery verification.',
}, async () => {
  const host = process.env.PI_TEST_HOST_DIR;
  const version = JSON.parse(await readFile(join(host, 'package.json'), 'utf8')).version;
  assert.equal(version, '1.4.0');
  const { loadSkills } = await import(pathToFileURL(join(host, 'dist/core/skills.js')).href);
  const { DefaultPackageManager } = await import(pathToFileURL(join(host, 'dist/core/package-manager.js')).href);
  const { SettingsManager } = await import(pathToFileURL(join(host, 'dist/core/settings-manager.js')).href);
  const dir = await fixture();
  const manager = new DefaultPackageManager({ cwd: dir, agentDir: dir, settingsManager: SettingsManager.inMemory() });
  const resources = await manager.resolveExtensionSources([root], { temporary: true });
  assert.equal(resources.skills.length, 6);
  assert.ok(resources.skills.every(r => r.enabled));
  for (const kind of ['extensions', 'prompts', 'themes']) assert.deepEqual(resources[kind], []);
  const result = loadSkills({ cwd: dir, agentDir: dir, skillPaths: resources.skills.map(r => r.path), includeDefaults: false });
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.skills.map(s => s.name).sort(), workflows.map(n => `anthropic-data-${n}`).sort());
  assert.ok(result.skills.every(s => !s.disableModelInvocation));
});
