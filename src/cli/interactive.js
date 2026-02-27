const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { normalizeHost } = require('../util/normalize');

async function promptInteractive(defaultProfile = 'balanced') {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  let target = '';
  while (!normalizeHost(target)) {
    target = (await rl.question('Target domain: ')).trim();
    if (!normalizeHost(target)) console.log('Invalid domain. Please enter a hostname like example.com');
  }
  console.log(`Default profile: ${defaultProfile}`);
  const format = await rl.question('Output format (text/json) [text]: ');
  rl.close();
  return { target: target.trim(), format: (format.trim() || 'text') };
}

module.exports = { promptInteractive };
