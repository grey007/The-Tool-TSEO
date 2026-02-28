function result(status = 'unknown', metrics = {}, evidence = {}) { return { status, metrics, evidence }; }
function compareSimple(current, previous) {
  const c = JSON.stringify(current || {});
  const p = JSON.stringify(previous || {});
  return { drifted: c !== p, changes: c === p ? [] : ['value-changed'] };
}
function assessFromStatus(id, current, drift, headlineMap = {}) {
  const severity = current?.status === 'critical' ? 'critical' : current?.status === 'warning' ? 'warning' : current?.status === 'stable' ? 'stable' : 'unknown';
  return {
    severity,
    headline: headlineMap[severity] || `${id} ${severity}`,
    reasonCodes: drift?.drifted ? [`${id}:drifted`] : [`${id}:${severity}`],
  };
}
module.exports = { result, compareSimple, assessFromStatus };
