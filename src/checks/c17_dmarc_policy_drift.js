const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c17_dmarc_policy_drift',
  version: 1,
  description: 'c17 dmarc policy drift',
  collect: async (ctx) => {
    const record = (ctx.dns?.DMARC_TXT || []).find((x) => /^v=DMARC1/i.test(x)) || '';
    const policy = (/p=([^;\s]+)/i.exec(record) || [])[1] || '';
    let status = 'warning';
    if (!record) status = 'warning';
    else if (policy.toLowerCase() === 'none') status = 'warning';
    else status = 'stable';
    return result(status, { policy, record }, { record });
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c17_dmarc_policy_drift', current, drift),
};
