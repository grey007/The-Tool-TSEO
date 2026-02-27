const fs = require('node:fs');
const path = require('node:path');
const { renderExecutiveText } = require('../render/executiveText');
const { renderExecutiveJson } = require('../render/executiveJson');
const { printOut } = require('./print');
const { normalizeHost, stableSort } = require('../util/normalize');
const { runEngine, markdownForSnapshot } = require('../core/engine');
const {
  writeRun,
  writeMarkdownExport,
  setBaseline,
  clearBaseline,
  readBaselineRef,
  listSnapshots,
  readSnapshotFile,
} = require('../storage/store');
const { targetDir } = require('../storage/paths');
const EXIT = require('./exitCodes');
const { getProfile } = require('../storage/config');
const { schemaVersion } = require('../storage/schema');
const { createLogger } = require('../util/logger');
const logger = createLogger();

function parseTargetsFile(file) {
  const rows = fs.readFileSync(file, 'utf8').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  return rows.map((row) => {
    const [domain, tagsPart] = row.split(/\s+/, 2);
    const tags = (tagsPart || '').replace(/^#/, '').split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean).sort();
    return { domain: normalizeHost(domain), tags };
  }).filter((x) => x.domain);
}

async function runScan({ config, args }) {
  const profileName = args.profile || config.defaultProfile;
  const profile = getProfile(config, profileName);
  if (!profile) throw new Error('invalid-profile');

  const targets = [];
  if (args.set) {
    const setCfg = config.targets.sets[args.set];
    if (!setCfg) throw new Error('unknown-target-set');
    let entries = parseTargetsFile(setCfg.file);
    if (args.tag) entries = entries.filter((e) => e.tags.includes(args.tag));
    targets.push(...stableSort(entries.map((e) => e.domain)));
  } else if (args.target) {
    targets.push(args.target);
  } else {
    throw new Error('missing-target');
  }

  let highestExit = EXIT.STABLE;
  const total = targets.length;
  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i];
    const started = Date.now();
    try {
      const snapshot = await runEngine({ targetInput: target, dataDir: config.dataDir, profile: { ...profile, name: profileName } });
      writeRun(config.dataDir, snapshot.target.canonical, snapshot);
      if (args.export === 'md') {
        try { writeMarkdownExport(config.dataDir, snapshot.target.canonical, snapshot.run.ts, markdownForSnapshot(snapshot)); } catch {}
      }
      printOut(args.format || 'text', renderExecutiveText(snapshot.rollup), renderExecutiveJson(snapshot));
      const code = snapshot.rollup.critical > 0 ? EXIT.CRITICAL : snapshot.rollup.warning > 0 ? EXIT.WARNING : EXIT.STABLE;
      highestExit = Math.max(highestExit, code);
      const elapsed = Math.max(0, Date.now() - started);
logger.info(`[${i + 1}/${total}] ${target} ... done (index=${snapshot.rollup.stabilityIndex}, durationMs=${elapsed})`);
    } catch (e) {
      highestExit = Math.max(highestExit, EXIT.ENGINE_FAILURE);
      const elapsed = Math.max(0, Date.now() - started);
logger.error(`[${i + 1}/${total}] ${target} ... failed (durationMs=${elapsed}, error=${e.message || 'scan-failed'})`);
    }
  }
  return highestExit;
}

function runProfile({ config, args, saveConfig }) {
  const op = args._[1];
  if (op === 'list') {
    console.log(stableSort([...Object.keys(config.profiles.builtins), ...Object.keys(config.profiles.customs)]).join('\n'));
    return EXIT.STABLE;
  }
  if (op === 'show') {
    const p = getProfile(config, args._[2]);
    if (!p) throw new Error('invalid-profile');
    console.log(JSON.stringify(p, null, 2));
    return EXIT.STABLE;
  }
  if (op === 'set') {
    if (!getProfile(config, args._[2])) throw new Error('invalid-profile');
    config.defaultProfile = args._[2];
    saveConfig(config);
    return EXIT.STABLE;
  }
  if (op === 'create') {
    const name = args._[2];
    const base = args.from || 'balanced';
    const p = getProfile(config, base);
    if (!name || !p) throw new Error('invalid-profile-create');
    config.profiles.customs[name] = JSON.parse(JSON.stringify(p));
    saveConfig(config);
    return EXIT.STABLE;
  }
  throw new Error('invalid-profile-command');
}

function runBaseline({ config, args }) {
  const op = args._[1];
  const target = normalizeHost(args.target || '');
  if (!target) throw new Error('invalid-target');
  if (op === 'approve') {
    const file = args.run || listSnapshots(config.dataDir, target)[0];
    if (!file) throw new Error('no-run-to-approve');
    setBaseline(config.dataDir, target, file);
    console.log('Baseline approved.');
    return EXIT.STABLE;
  }
  if (op === 'clear') {
    clearBaseline(config.dataDir, target);
    console.log('Baseline cleared.');
    return EXIT.STABLE;
  }
  if (op === 'status') {
    const ref = readBaselineRef(config.dataDir, target);
    console.log(JSON.stringify({ target, baseline: ref || null }, null, 2));
    return EXIT.STABLE;
  }
  throw new Error('invalid-baseline-command');
}

function runHistory({ config, args }) {
  const target = normalizeHost(args.target || '');
  if (!target) throw new Error('invalid-target');
  const n = Number(args.last || 10);
  const dir = targetDir(config.dataDir, target);
  const files = listSnapshots(config.dataDir, target).slice(0, n);
  const rows = files.map((f) => {
    const s = readSnapshotFile(path.join(dir, f));
    if (!s) return null;
    return {
      ts: s.run.ts,
      index: s.rollup.stabilityIndex,
      critical: s.rollup.critical,
      warning: s.rollup.warning,
      unknown: s.rollup.unknown,
      mostImmediate: s.rollup.mostImmediateRisk,
    };
  }).filter(Boolean);
  if ((args.format || 'text') === 'json') console.log(JSON.stringify(rows, null, 2));
  else rows.forEach((r) => console.log(`${r.ts}  index=${r.index}  critical=${r.critical}  warning=${r.warning}  unknown=${r.unknown}  mostImmediate="${r.mostImmediate}"`));
  return EXIT.STABLE;
}

function runTargets({ config, args, saveConfig }) {
  const op = args._[1];
  if (op === 'add-set') {
    const name = args._[2];
    if (!name || !args.file) throw new Error('invalid-targets-add-set');
    config.targets.sets[name] = { file: args.file, tags: {} };
    saveConfig(config);
    return EXIT.STABLE;
  }
  if (op === 'list') {
    console.log(stableSort(Object.keys(config.targets.sets)).join('\n'));
    return EXIT.STABLE;
  }
  if (op === 'show') {
    const name = args._[2];
    const s = config.targets.sets[name];
    if (!s) throw new Error('unknown-target-set');
    const entries = parseTargetsFile(s.file);
    console.log(JSON.stringify({ name, file: s.file, count: entries.length, entries }, null, 2));
    return EXIT.STABLE;
  }
  throw new Error('invalid-targets-command');
}


function runDoctor({ config }) {
  const checks = [];
  checks.push({ name: 'config:dataDir', ok: Boolean(config.dataDir && fs.existsSync(config.dataDir)), detail: config.dataDir || '' });
  checks.push({ name: 'config:defaultProfile', ok: Boolean(getProfile(config, config.defaultProfile)), detail: config.defaultProfile });

  for (const name of Object.keys(config.profiles.customs || {}).sort()) {
    const p = config.profiles.customs[name];
    const ok = !!(p && p.limits && Number(p.limits.maxPages) > 0 && Number(p.limits.maxDepth) >= 0);
    checks.push({ name: `profile:${name}`, ok, detail: ok ? 'ok' : 'invalid-limits' });
  }

  const targets = Object.keys(config.targets?.sets || {}).sort();
  for (const setName of targets) {
    const setFile = config.targets.sets[setName].file;
    checks.push({ name: `targets:${setName}`, ok: fs.existsSync(setFile), detail: setFile });
  }

  const runRoot = config.dataDir ? path.join(config.dataDir, 'runs') : null;
  if (runRoot && fs.existsSync(runRoot)) {
    const targetDirs = fs.readdirSync(runRoot).sort();
    for (const t of targetDirs) {
      const dir = path.join(runRoot, t);
      const baseline = readBaselineRef(config.dataDir, t);
      if (baseline?.file) {
        checks.push({ name: `baseline:${t}`, ok: fs.existsSync(path.join(dir, baseline.file)), detail: baseline.file });
      }
      for (const file of listSnapshots(config.dataDir, t).slice(0, 20)) {
        const snap = readSnapshotFile(path.join(dir, file));
        checks.push({ name: `snapshot:${t}:${file}`, ok: !!snap && snap.schemaVersion === schemaVersion, detail: '' });
      }
    }
  }

  const pass = checks.filter((c) => c.ok).length;
  const warn = checks.length - pass;
  console.log(`PASS: ${pass}`);
  console.log(`WARN: ${warn}`);
  for (const c of checks) console.log(`${c.ok ? 'PASS' : 'WARN'} ${c.name}${c.detail ? ` (${c.detail})` : ''}`);
  return warn > 0 ? EXIT.WARNING : EXIT.STABLE;
}

function runStats({ config, args }) {
  const target = normalizeHost(args.target || '');
  if (!target) throw new Error('invalid-target');
  const files = listSnapshots(config.dataDir, target);
  const dir = targetDir(config.dataDir, target);
  const rows = files.map((f) => readSnapshotFile(path.join(dir, f))).filter(Boolean);
  const totalRuns = rows.length;
  const lastIndex = rows[0]?.rollup?.stabilityIndex ?? null;
  const avg10Base = rows.slice(0, 10).map((r) => Number(r.rollup?.stabilityIndex || 0));
  const avgIndexLast10 = avg10Base.length ? Math.round((avg10Base.reduce((a, b) => a + b, 0) / avg10Base.length) * 100) / 100 : null;
  const baseline = readBaselineRef(config.dataDir, target);
  const out = { target, totalRuns, lastIndex, avgIndexLast10, baselineInUse: Boolean(baseline?.file) };
  console.log(JSON.stringify(out, null, 2));
  return EXIT.STABLE;
}

module.exports = { runScan, runProfile, runBaseline, runHistory, runTargets, runDoctor, runStats };
