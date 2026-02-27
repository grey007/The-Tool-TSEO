const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c05_tls_chain_validity',
  version: 1,
  description: 'c05 tls chain validity',
  collect: async (ctx) => { const auth=ctx.tls?.authorized;const err=ctx.tls?.authorizationError||null;let s='unknown';if(auth===true)s='stable';else if(err)s='critical';return result(s,{authorized:auth,error:err},{error:err}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c05_tls_chain_validity', current, drift),
};
