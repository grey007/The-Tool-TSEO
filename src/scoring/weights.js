const severityPenalty = { critical: 35, warning: 2, stable: 0, unknown: 0.5 };

const checkWeights = {
  c01_tls_cert_expiry: 1.6,
  c05_tls_chain_validity: 1.5,
  c10_mixed_content_internal: 1.4,
  c17_dmarc_policy_drift: 1.5,
  c34_canonical_offdomain: 1.6,
  c36_internal_4xx_increase: 1.3,
  c40_response_time_avg_volatility: 1.4,
};

const driftMultiplier = 1.25;

module.exports = { severityPenalty, checkWeights, driftMultiplier };
