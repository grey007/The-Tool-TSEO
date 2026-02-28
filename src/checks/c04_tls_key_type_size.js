const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c04_tls_key_type_size',
  version: 1,
  description: 'c04 tls key type size',
  collect: async (ctx) => { const bits=Number(ctx.tls?.cert?.bits||0);const alg=(ctx.tls?.cert?.pubkeyAlgorithm||'').toLowerCase();let s='unknown';if(!alg)s='unknown';else if(alg.includes('rsa')&&bits<2048)s='critical';else if(alg.includes('rsa')&&bits<3072)s='warning';else s='stable';return result(s,{alg,bits},{alg,bits}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c04_tls_key_type_size', current, drift),
};
