const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c17_dmarc_policy_drift',
  version: 1,
  description: 'c17 dmarc policy drift',
  collect: async (ctx) => { const d=(ctx.dns?.TXT||[]).find(x=>x.startsWith('v=DMARC1'))||'';const p=(/p=([^;]+)/.exec(d)||[])[1]||'';let s='warning';if(!d)s='warning';else if(p==='none')s='warning';else s='stable';return result(s,{policy:p,record:d},{record:d}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c17_dmarc_policy_drift', current, drift),
};
