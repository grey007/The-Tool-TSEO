#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('../src/cli/parseArgs');
const { promptInteractive } = require('../src/cli/interactive');
const { loadConfig, ensureDataDirInteractive, saveConfig } = require('../src/storage/config');
const EXIT = require('../src/cli/exitCodes');
const { runScan, runProfile, runBaseline, runHistory, runTargets, runDoctor, runStats } = require('../src/cli/commands');
const { helpText } = require('../src/cli/help');

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason?.message || String(reason));
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err?.message || String(err));
});

function pkgVersion() {
  try {
    const p = path.join(__dirname, '..', 'package.json');
    return JSON.parse(fs.readFileSync(p, 'utf8')).version;
  } catch {
    return '1.0.0';
  }
}

(async () => {
  try {
    const args = parseArgs(process.argv);

    if (args.help || args._[0] === 'help' || process.argv.includes('--help')) {
      const topic = ['scan', 'profile', 'baseline', 'history', 'targets', 'doctor', 'stats'].includes(args._[0]) ? args._[0] : 'root';
      console.log(helpText(topic));
      process.exit(EXIT.STABLE);
    }
    if (args.version || process.argv.includes('--version')) {
      console.log(pkgVersion());
      process.exit(EXIT.STABLE);
    }

    let config = loadConfig();

    if (args._[0] === 'config' && args._[1] === 'set' && args['data-dir']) {
      config.dataDir = args['data-dir'];
      saveConfig(config);
      console.log('Config updated.');
      process.exit(EXIT.STABLE);
    }

    config = await ensureDataDirInteractive(config);

    if (args._[0] === 'profile') {
      if (args.help || process.argv.includes('--help')) console.log(helpText('profile'));
      process.exit(runProfile({ config, args, saveConfig }));
    }
    if (args._[0] === 'baseline') {
      if (args.help || process.argv.includes('--help')) console.log(helpText('baseline'));
      process.exit(runBaseline({ config, args }));
    }
    if (args._[0] === 'history') {
      if (args.help || process.argv.includes('--help')) console.log(helpText('history'));
      process.exit(runHistory({ config, args }));
    }
    if (args._[0] === 'targets') {
      if (args.help || process.argv.includes('--help')) console.log(helpText('targets'));
      process.exit(runTargets({ config, args, saveConfig }));
    }
    if (args._[0] === 'doctor') process.exit(runDoctor({ config, args }));
    if (args._[0] === 'stats') process.exit(runStats({ config, args }));

    let normalized = args;
    if (!args._[0] && !args.target && !args.set) {
      const input = await promptInteractive(config.defaultProfile);
      normalized = { ...args, target: input.target, format: input.format || 'text', _: ['scan'] };
    }
    if (args._[0] === 'scan' || args.target || args.set || !args._[0]) {
      process.exit(await runScan({ config, args: normalized }));
    }

    process.exit(EXIT.MISUSE);
  } catch (e) {
    console.error(e.message || String(e));
    if ((e.message || '').includes('invalid') || (e.message || '').includes('unknown') || (e.message || '').includes('missing')) process.exit(EXIT.MISUSE);
    process.exit(EXIT.ENGINE_FAILURE);
  }
})();
