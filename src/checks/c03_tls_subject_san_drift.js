const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c03_tls_subject_san_drift',
  version: 1,
  description: 'c03 tls subject san drift',
  collect: async (ctx) => { const san=ctx.tls?.cert?.subjectaltname||'';const subj=JSON.stringify(ctx.tls?.cert?.subject||{});const fingerprint=`${subj}|${san}`;const prev=ctx.previousSnapshot?.checks?.c03_tls_subject_san_drift?.metrics?.fingerprint;const s=!fingerprint?'unknown':(prev&&prev!==fingerprint?'warning':'stable');return result(s,{fingerprint},{san,subject:ctx.tls?.cert?.subject||{}}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c03_tls_subject_san_drift', current, drift),
};
