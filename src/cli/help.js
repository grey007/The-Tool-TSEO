function helpText(topic = 'root') {
  const root = [
    'IRTE - Infrastructure Risk Trigger Engine',
    '',
    'Usage:',
    '  irte scan --target <domain> [--format text|json] [--profile <name>] [--export md]',
    '  irte scan --set <name> [--tag <tag>] [--format text|json] [--profile <name>] [--export md]',
    '  irte profile <list|show|set|create> ...',
    '  irte baseline <approve|clear|status> --target <domain> [--run <file>]',
    '  irte history --target <domain> [--last <n>] [--format text|json]',
    '  irte targets <add-set|list|show> ...',
    '  irte doctor',
    '  irte stats --target <domain>',
    '  irte --help | --version',
  ].join('\n');

  const topics = {
    scan: 'Scan usage:\n  irte scan --target <domain> [--format text|json] [--profile <name>] [--export md]\n  irte scan --set <name> [--tag <tag>] [--format text|json] [--profile <name>] [--export md]',
    profile: 'Profile usage:\n  irte profile list\n  irte profile show <name>\n  irte profile set <name>\n  irte profile create <name> --from <base>',
    baseline: 'Baseline usage:\n  irte baseline approve --target <domain> [--run <snapshot-file>]\n  irte baseline clear --target <domain>\n  irte baseline status --target <domain>',
    history: 'History usage:\n  irte history --target <domain> [--last <n>] [--format text|json]',
    targets: 'Targets usage:\n  irte targets add-set <name> --file <path>\n  irte targets list\n  irte targets show <name>',
    doctor: 'Doctor usage:\n  irte doctor',
    stats: 'Stats usage:\n  irte stats --target <domain>',
    root,
  };
  return topics[topic] || root;
}

module.exports = { helpText };
