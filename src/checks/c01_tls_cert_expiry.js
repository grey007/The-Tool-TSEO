const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c01_tls_cert_expiry',
  version: 1,
  description: 'c01 tls cert expiry',
  collect: async (ctx) => { const d=new Date(ctx.tls?.cert?.valid_to||0);const days=Math.round((d-Date.now())/86400000);let s='unknown';if(ctx.tls?.error)s='unknown';else if(days<14)s='critical';else if(days<30)s='warning';else s='stable';return result(s,{daysToExpiry:days},{validTo:ctx.tls?.cert?.valid_to||null}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c01_tls_cert_expiry', current, drift),
};
