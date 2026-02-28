const path = require('node:path');
const os = require('node:os');

function appConfigDir() {
  const base = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  return path.join(base, 'IRTE');
}

function targetDir(dataDir, target) {
  return path.join(dataDir, 'runs', target);
}

function exportsTargetDir(dataDir, target) {
  return path.join(dataDir, 'exports', target);
}

module.exports = { appConfigDir, targetDir, exportsTargetDir };
