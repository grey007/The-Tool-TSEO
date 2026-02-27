const checks = [
  require('../checks/c01_tls_cert_expiry'),
  require('../checks/c02_tls_issuer_drift'),
  require('../checks/c03_tls_subject_san_drift'),
  require('../checks/c04_tls_key_type_size'),
  require('../checks/c05_tls_chain_validity'),
  require('../checks/c06_tls_protocol_advertised'),
  require('../checks/c07_tls_ocsp_stapling'),
  require('../checks/c08_https_redirect_enforcement'),
  require('../checks/c09_hsts_presence_sanity'),
  require('../checks/c10_mixed_content_internal'),
  require('../checks/c11_dns_a_aaaa_drift'),
  require('../checks/c12_dns_www_cname_drift'),
  require('../checks/c13_dns_ns_drift'),
  require('../checks/c14_dns_soa_serial'),
  require('../checks/c15_dnssec_ds_presence'),
  require('../checks/c16_dns_caa_presence_drift'),
  require('../checks/c17_dmarc_policy_drift'),
  require('../checks/c18_dmarc_alignment_drift'),
  require('../checks/c19_spf_lookup_risk'),
  require('../checks/c20_mx_record_drift'),
  require('../checks/c21_sec_headers_core'),
  require('../checks/c22_referrer_policy'),
  require('../checks/c23_permissions_policy'),
  require('../checks/c24_csp_presence_unsafe_inline'),
  require('../checks/c25_cookie_flags'),
  require('../checks/c26_server_banner_info'),
  require('../checks/c27_cache_control_anomaly'),
  require('../checks/c28_compression_support'),
  require('../checks/c29_redirect_chain_length'),
  require('../checks/c30_status_code_stability'),
  require('../checks/c31_robots_txt_presence'),
  require('../checks/c32_sitemap_presence'),
  require('../checks/c33_canonical_presence'),
  require('../checks/c34_canonical_offdomain'),
  require('../checks/c35_internal_4xx_count'),
  require('../checks/c36_internal_4xx_increase'),
  require('../checks/c37_homepage_title_missing'),
  require('../checks/c38_structured_data_presence'),
  require('../checks/c39_homepage_size_anomaly'),
  require('../checks/c40_response_time_avg_volatility'),
].sort((a, b) => a.id.localeCompare(b.id));

function loadChecks(enabledChecks = null) {
  if (!enabledChecks || enabledChecks.length === 0) return checks;
  const set = new Set(enabledChecks);
  return checks.filter((c) => set.has(c.id));
}

module.exports = { loadChecks };
