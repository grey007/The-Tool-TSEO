const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c07_tls_ocsp_stapling',
  version: 1,
  description: 'c07 tls ocsp stapling',
  collect: async () => {
    return result(
      'unknown',
      { ocspStapled: null, detection: 'not-supported' },
      { reason: 'OCSP stapling is not reliably observable via current Node TLS collector API.' },
    );
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c07_tls_ocsp_stapling', current, drift),
};
