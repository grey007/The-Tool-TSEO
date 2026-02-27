function nowIsoForFilename(date = new Date()) {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return date.toISOString().replace(/:/g, '-').replace('.', '-').replace('Z', `${sign}${hh}-${mm}`);
}

function roundMs(value) {
  return Math.round(Number(value || 0));
}

module.exports = { nowIsoForFilename, roundMs };
