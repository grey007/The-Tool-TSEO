const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c06_tls_protocol_advertised',
  version: 1,
  description: 'c06 tls protocol advertised',
  collect: async (ctx) => { const p=ctx.tls?.protocol||null;return result(p?'stable':'unknown',{protocol:p,alpn:ctx.tls?.alpnProtocol||null},{protocol:p}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c06_tls_protocol_advertised', current, drift),
};
