const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c26_server_banner_info',
  version: 1,
  description: 'c26 server banner info',
  collect: async (ctx) => { const v=ctx.homepage?.headers?.server||'';return result('stable',{server:v},{server:v}); },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c26_server_banner_info', current, drift),
};
