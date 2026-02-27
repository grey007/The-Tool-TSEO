function renderExecutiveText(rollup) {
  const secondary = rollup.secondaryRisks.length ? rollup.secondaryRisks.map((r) => `- ${r}`).join('\n') : '- None';
  return `INFRASTRUCTURE RISK SNAPSHOT\n\nCritical: ${rollup.critical}\nWarning: ${rollup.warning}\nStable: ${rollup.stable}\nUnknown: ${rollup.unknown}\n\nMost Immediate Risk:\n${rollup.mostImmediateRisk}\n\nSecondary Risks:\n${secondary}\n\nInfrastructure Stability Index: ${rollup.stabilityIndex}/100\n`;
}

module.exports = { renderExecutiveText };
