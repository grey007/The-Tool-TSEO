const { severityPenalty, checkWeights, driftMultiplier } = require('./weights');

const severityRank = { critical: 4, warning: 3, unknown: 2, stable: 1 };

function computePenalty(id, check) {
  const sev = check.severity || 'unknown';
  const base = severityPenalty[sev] ?? 0;
  const weight = checkWeights[id] || 1;
  const drift = check.drift?.drifted ? driftMultiplier : 1;
  return Math.round(base * weight * drift * 100) / 100;
}

function compareRisk(a, b) {
  return (severityRank[b.severity] - severityRank[a.severity])
    || (Number(Boolean(b.drifted)) - Number(Boolean(a.drifted)))
    || (b.penalty - a.penalty)
    || a.id.localeCompare(b.id);
}

function scoreChecks(checks) {
  let score = 100;
  let critical = 0; let warning = 0; let stable = 0; let unknown = 0;

  const ranked = Object.entries(checks).map(([id, c]) => {
    const severity = c.severity || 'unknown';
    if (severity === 'critical') critical += 1;
    else if (severity === 'warning') warning += 1;
    else if (severity === 'stable') stable += 1;
    else unknown += 1;

    const penalty = computePenalty(id, c);
    score -= penalty;

    return {
      id,
      severity,
      drifted: !!c.drift?.drifted,
      penalty,
      headline: c.headline || `${id} ${severity}`,
    };
  }).sort(compareRisk);

  score = Math.max(0, Math.min(100, Math.round(score)));

  const mostImmediateRisk = ranked[0]?.headline || 'No immediate risk identified.';
  const secondaryRisks = ranked
    .filter((r) => r.severity !== 'stable' && r.severity !== 'unknown')
    .slice(0, 6)
    .map((r) => r.headline);

  return { critical, warning, stable, unknown, stabilityIndex: score, mostImmediateRisk, secondaryRisks };
}

module.exports = { scoreChecks, compareRisk, computePenalty };
