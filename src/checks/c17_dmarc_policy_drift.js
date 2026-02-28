const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c17_dmarc_policy_drift',
  version: 1,
  description: 'c17 dmarc policy drift',
  collect: async (ctx) => {
    const lookupError = ctx.dns?.lookupErrors?.dmarcTxt || null;
    if (lookupError) {
      return {
        ...result('unknown', { policy: '', record: '' }, {
          lookupError,
          resolver: ctx.dns?.lookupErrorMeta?.dmarcTxt?.resolver || 'system',
        }),
        reasonCodes: ['dns_txt_lookup_failed'],
      };
    }

    const record = (ctx.dns?.DMARC_TXT || []).find((x) => /^v=DMARC1/i.test(x)) || '';
    const policy = (/p=([^;\s]+)/i.exec(record) || [])[1] || '';
    let status = 'warning';
    if (!record) status = 'warning';
    else if (policy.toLowerCase() === 'none') status = 'warning';
    else status = 'stable';
    return result(status, { policy, record }, { record });
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => {
    const base = assessFromStatus('c17_dmarc_policy_drift', current, drift);
    if (current?.status === 'unknown' && current?.evidence?.lookupError) {
      return { ...base, reasonCodes: [...new Set([...(base.reasonCodes || []), 'dns_txt_lookup_failed'])] };
    }
    return base;
  },
};
