const { result, compareSimple, assessFromStatus } = require('./_shared');

module.exports = {
  id: 'c25_cookie_flags',
  version: 1,
  description: 'c25 cookie flags',
  collect: async (ctx) => {
    const c = ctx.homepage?.headers?.['set-cookie'] || [];
    const list = Array.isArray(c) ? c : [c];
    const valid = list.filter(Boolean);
    const bad = valid.filter((x) => !/secure/i.test(x) || !/httponly/i.test(x));
    const status = valid.length === 0 ? 'unknown' : (bad.length ? 'warning' : 'stable');
    return result(status, { cookieCount: valid.length, bad: bad.length }, { count: bad.length, sample: bad.slice(0, 3) });
  },
  compare: (current, previous) => compareSimple(current?.metrics, previous?.metrics),
  assess: (current, drift) => assessFromStatus('c25_cookie_flags', current, drift),
};
