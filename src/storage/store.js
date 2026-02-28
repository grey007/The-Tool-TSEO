const fs = require('node:fs');
const path = require('node:path');
const { stableObject } = require('../util/normalize');
const { targetDir, exportsTargetDir } = require('./paths');
const { nowIsoForFilename } = require('../util/time');
const { applyRetention } = require('./retention');
const { schemaVersion } = require('./schema');
const { createLogger } = require('../util/logger');
const logger = createLogger();

function warn(msg) {
  logger.warn(msg);
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, filePath);
}

function isValidSnapshot(snap) {
  return !!(snap && typeof snap === 'object' && snap.schemaVersion === schemaVersion && snap.run && snap.target && snap.rollup);
}

function readSnapshotFile(file) {
  if (!fs.existsSync(file)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!isValidSnapshot(parsed)) {
      warn(`Ignoring invalid snapshot file: ${file}`);
      return null;
    }
    return parsed;
  } catch {
    warn(`Ignoring corrupt snapshot file: ${file}`);
    return null;
  }
}

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function writeRun(dataDir, target, snapshot) {
  const dir = targetDir(dataDir, target);
  fs.mkdirSync(path.join(dataDir, 'logs'), { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'exports'), { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
  const name = `${nowIsoForFilename(new Date(snapshot.run.ts))}.json`;
  const stable = stableObject(snapshot);
  writeJsonAtomic(path.join(dir, name), stable);
  writeJsonAtomic(path.join(dir, 'latest.json'), stable);
  applyRetention(dir);
  return { file: name, fullPath: path.join(dir, name) };
}

function readPrevious(dataDir, target) {
  return readSnapshotFile(path.join(targetDir(dataDir, target), 'latest.json'));
}

function baselinePointerPath(dataDir, target) {
  return path.join(targetDir(dataDir, target), 'baseline.json');
}

function readBaselineRef(dataDir, target) {
  return readJsonIfExists(baselinePointerPath(dataDir, target));
}

function readBaselineSnapshot(dataDir, target) {
  const refPath = baselinePointerPath(dataDir, target);
  const ref = readBaselineRef(dataDir, target);
  if (!ref?.file) return null;
  const snapshotPath = path.join(targetDir(dataDir, target), ref.file);
  const snap = readSnapshotFile(snapshotPath);
  if (!snap) {
    if (fs.existsSync(refPath)) {
      try { fs.unlinkSync(refPath); } catch {}
      warn(`Baseline pointer auto-cleared for ${target}: missing or invalid ${ref.file}`);
    }
    return null;
  }
  return { ref, snapshot: snap };
}

function setBaseline(dataDir, target, file) {
  const dir = targetDir(dataDir, target);
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) throw new Error('baseline-run-not-found');
  const snap = readSnapshotFile(p);
  if (!snap) throw new Error('baseline-run-invalid');
  writeJsonAtomic(baselinePointerPath(dataDir, target), { ts: snap.run.ts, file });
}

function clearBaseline(dataDir, target) {
  const p = baselinePointerPath(dataDir, target);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

function listSnapshots(dataDir, target) {
  const dir = targetDir(dataDir, target);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json') && f !== 'latest.json' && f !== 'baseline.json')
    .sort((a, b) => b.localeCompare(a));
}

function writeMarkdownExport(dataDir, target, ts, markdown) {
  const dir = exportsTargetDir(dataDir, target);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${nowIsoForFilename(new Date(ts))}.md`;
  const full = path.join(dir, name);
  const tmp = `${full}.tmp`;
  fs.writeFileSync(tmp, markdown);
  fs.renameSync(tmp, full);
  return full;
}

module.exports = {
  writeRun,
  readPrevious,
  readBaselineRef,
  readBaselineSnapshot,
  setBaseline,
  clearBaseline,
  listSnapshots,
  writeMarkdownExport,
  readSnapshotFile,
  isValidSnapshot,
};
