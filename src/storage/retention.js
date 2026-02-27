const fs = require('node:fs');
const path = require('node:path');

function applyRetention(targetPath, keep = 20) {
  if (!fs.existsSync(targetPath)) return;
  const files = fs.readdirSync(targetPath)
    .filter((f) => f.endsWith('.json') && f !== 'latest.json' && f !== 'baseline.json')
    .sort();
  if (files.length <= keep) return;
  for (const file of files.slice(0, files.length - keep)) {
    fs.unlinkSync(path.join(targetPath, file));
  }
}

module.exports = { applyRetention };
