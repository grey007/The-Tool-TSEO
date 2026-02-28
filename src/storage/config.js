const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { appConfigDir } = require('./paths');

const builtinProfiles = {
  fast: {
    limits: { maxPages: 15, maxDepth: 1, timeout: 5000, concurrency: 4, maxRedirections: 5, maxSize: 2 * 1024 * 1024, maxEngineMs: 60000 },
    enabledChecks: null,
    thresholds: {},
  },
  balanced: {
    limits: { maxPages: 60, maxDepth: 2, timeout: 6000, concurrency: 6, maxRedirections: 5, maxSize: 2 * 1024 * 1024, maxEngineMs: 60000 },
    enabledChecks: null,
    thresholds: {},
  },
  strict: {
    limits: { maxPages: 80, maxDepth: 3, timeout: 7000, concurrency: 6, maxRedirections: 5, maxSize: 2 * 1024 * 1024, maxEngineMs: 60000 },
    enabledChecks: null,
    thresholds: {},
  },
};

function configPath() {
  return path.join(appConfigDir(), 'config.json');
}

function applyDefaults(raw = {}) {
  return {
    dataDir: raw.dataDir,
    defaultProfile: raw.defaultProfile || 'balanced',
    profiles: {
      builtins: builtinProfiles,
      customs: raw.profiles?.customs || {},
    },
    targets: {
      sets: raw.targets?.sets || {},
    },
  };
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, filePath);
}

function loadConfig() {
  const p = configPath();
  if (!fs.existsSync(p)) return applyDefaults({});
  return applyDefaults(JSON.parse(fs.readFileSync(p, 'utf8')));
}

function saveConfig(config) {
  fs.mkdirSync(appConfigDir(), { recursive: true });
  writeJsonAtomic(configPath(), applyDefaults(config));
}

async function ensureDataDirInteractive(existing) {
  const cfg = applyDefaults(existing);
  if (cfg.dataDir) return cfg;
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = await rl.question('Choose a folder to store IRTE runs and reports. ');
  rl.close();
  cfg.dataDir = path.resolve(answer.trim());
  saveConfig(cfg);
  return cfg;
}

function getProfile(config, name) {
  return config.profiles.customs[name] || config.profiles.builtins[name] || null;
}

module.exports = { configPath, loadConfig, saveConfig, ensureDataDirInteractive, builtinProfiles, getProfile };
