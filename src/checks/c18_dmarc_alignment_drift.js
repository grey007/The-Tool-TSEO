const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c18_dmarc_alignment_drift',
  version: 1,
  description: 'c18 dmarc alignment drift',
  collect: async (ctx) => {
    const record = (ctx.dns?.DMARC_TXT || []).find((x) => /^v=DMARC1/i.test(x)) || '';
    if (!record) return result('warning', { adkim: 'r', aspf: 'r' }, { record: '' });

    const adkim = (/adkim=([^;\s]+)/i.exec(record) || [])[1] || 'r';
    const aspf = (/aspf=([^;\s]+)/i.exec(record) || [])[1] || 'r';
    const status = (adkim === 's' && aspf === 's') ? 'stable' : 'warning';
    return result(status, { adkim, aspf }, { record });
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c18_dmarc_alignment_drift', current, drift),
};
