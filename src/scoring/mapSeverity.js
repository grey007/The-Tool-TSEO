function mapSeverity(check) {
  return check?.severity || 'unknown';
}

module.exports = { mapSeverity };
