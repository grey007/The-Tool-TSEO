const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c19_spf_lookup_risk',
  version: 1,
  description: 'c19 spf lookup risk',
  collect: async (ctx) => { const spf=(ctx.dns?.TXT||[]).find(x=>x.startsWith('v=spf1'))||'';const lookups=(spf.match(/ include:| a | mx | ptr | exists:/g)||[]).length;let s='stable';if(lookups>=10)s='critical';else if(lookups>=8)s='warning';return result(spf?s:'unknown',{lookups,spf},{spf}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c19_spf_lookup_risk', current, drift),
};
