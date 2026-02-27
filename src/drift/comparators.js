function compareChecks(currentChecks, previousChecks) {
  const out = {};
  for (const [id, cur] of Object.entries(currentChecks)) {
    const prev = previousChecks?.[id];
    out[id] = JSON.stringify(cur?.metrics || {}) !== JSON.stringify(prev?.metrics || {});
  }
  return out;
}

module.exports = { compareChecks };
