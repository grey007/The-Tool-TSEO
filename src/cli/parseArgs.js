function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) { args[key] = next; i += 1; } else { args[key] = true; }
    } else {
      args._.push(a);
    }
  }
  return args;
}

module.exports = { parseArgs };
