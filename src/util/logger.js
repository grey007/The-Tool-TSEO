const levels = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };

function currentLevel() {
  const raw = String(process.env.IRTE_LOG_LEVEL || 'error').toLowerCase();
  return levels[raw] ?? levels.error;
}

function createLogger() {
  const active = currentLevel();
  const log = (levelName, prefix, args) => {
    if (levels[levelName] <= active) console.error(prefix, ...args);
  };
  return {
    error: (...args) => log('error', '[ERROR]', args),
    warn: (...args) => log('warn', '[WARN]', args),
    info: (...args) => log('info', '[INFO]', args),
    debug: (...args) => log('debug', '[DEBUG]', args),
  };
}

module.exports = { createLogger };
