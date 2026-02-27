const tls = require('node:tls');

function collectTls(host, timeoutMs = 6000) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerCertificate(true) || {};
      resolve({
        authorized: socket.authorized,
        authorizationError: socket.authorizationError || null,
        protocol: socket.getProtocol(),
        alpnProtocol: socket.alpnProtocol || null,
        cert: {
          subject: cert.subject || {},
          issuer: cert.issuer || {},
          subjectaltname: cert.subjectaltname || '',
          valid_from: cert.valid_from,
          valid_to: cert.valid_to,
          bits: cert.bits || null,
          pubkeyAlgorithm: cert.asymmetricKeyType || null,
          fingerprint256: cert.fingerprint256 || null,
        },
      });
      socket.end();
    });
    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      resolve({ error: 'timeout' });
    });
    socket.on('error', (e) => resolve({ error: e.message }));
  });
}

module.exports = { collectTls };
