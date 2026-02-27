const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c34_canonical_offdomain',
  version: 1,
  description: 'c34 canonical offdomain',
  collect: async (ctx) => { const body=ctx.homepage?.body||'';const m=body.match(/rel=['"]canonical['"][^>]*href=['"]([^'"]+)/i);let s='stable';if(m){try{const u=new URL(m[1],`https://${ctx.targetHost}`);if(u.hostname!==ctx.targetHost)s='critical';}catch{s='warning';}}return result(s,{canonical:m?m[1]:null},{canonical:m?m[1]:null}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c34_canonical_offdomain', current, drift),
};
