const { compareChecks } = require('./comparators');

function buildDrift(current, previous) {
  if (!previous) return {};
  return compareChecks(current.checks, previous.checks);
}

module.exports = { buildDrift };
