const net = require('node:net');

const blockedCidrsV4 = [
  ['127.0.0.0', 8],
  ['10.0.0.0', 8],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['169.254.0.0', 16],
];
const blockedHostSuffixes = ['.local', '.internal', '.localhost'];

function ipv4ToInt(ip) {
  return ip.split('.').reduce((a, c) => (a << 8) + Number(c), 0) >>> 0;
}

function inV4Cidr(ip, [base, prefix]) {
  const mask = prefix === 0 ? 0 : (~((1 << (32 - prefix)) - 1) >>> 0);
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

function normalizeHost(input) {
  const cleaned = String(input || '').trim().toLowerCase();
  const withoutProtocol = cleaned.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  if (!withoutProtocol || net.isIP(withoutProtocol)) return null;
  return withoutProtocol;
}

function isBlockedHostname(host) {
  if (!host) return true;
  if (host === 'localhost') return true;
  return blockedHostSuffixes.some((suffix) => host.endsWith(suffix));
}

function isBlockedIp(ip) {
  if (!ip) return true;
  if (ip === '169.254.169.254') return true;
  const v = net.isIP(ip);
  if (v === 4) return blockedCidrsV4.some((c) => inV4Cidr(ip, c));
  if (v === 6) {
    const norm = ip.toLowerCase();
    return norm === '::1' || norm.startsWith('fc') || norm.startsWith('fd') || norm.startsWith('fe8') || norm.startsWith('fe9') || norm.startsWith('fea') || norm.startsWith('feb');
  }
  return true;
}

function stableSort(value) {
  return [...new Set((value || []).map((x) => String(x)))].sort((a, b) => a.localeCompare(b));
}

function isPrimitive(x) {
  return x === null || ['string', 'number', 'boolean'].includes(typeof x);
}

function stableObject(obj) {
  if (Array.isArray(obj)) {
    const arr = obj.map(stableObject);
    if (arr.every(isPrimitive)) return arr.slice().sort((a, b) => String(a).localeCompare(String(b)));
    return arr.slice().sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (!obj || typeof obj !== 'object') return obj;
  return Object.keys(obj).sort().reduce((acc, k) => {
    acc[k] = stableObject(obj[k]);
    return acc;
  }, {});
}

module.exports = { normalizeHost, isBlockedHostname, isBlockedIp, stableSort, stableObject };
