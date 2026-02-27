const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c18_dmarc_alignment_drift',
  version: 1,
  description: 'c18 dmarc alignment drift',
  collect: async (ctx) => { const d=(ctx.dns?.TXT||[]).find(x=>x.startsWith('v=DMARC1'))||'';const adkim=(/adkim=([^;]+)/.exec(d)||[])[1]||'r';const aspf=(/aspf=([^;]+)/.exec(d)||[])[1]||'r';const s=(adkim==='s'&&aspf==='s')?'stable':'warning';return result(s,{adkim,aspf},{record:d}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c18_dmarc_alignment_drift', current, drift),
};
