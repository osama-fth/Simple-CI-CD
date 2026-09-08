'use strict';

const http = require('http');
const assert = require('assert');
const app = require('../app');

let server;
let port;

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// TEST 1: Verifica Header di Sicurezza HTTP (Helmet e Anti-Fingerprinting)
async function testSecurityHeaders() {
  const res = await request({
    hostname: '127.0.0.1',
    port,
    path: '/favicon.ico',
    method: 'GET',
  });

  // Verifica rimozione header X-Powered-By
  assert.strictEqual(
    res.headers['x-powered-by'],
    undefined,
    'Vulnerabilità: X-Powered-By ancora esposto nei response headers',
  );

  // Verifica presenza Content-Security-Policy
  assert.ok(
    res.headers['content-security-policy'],
    'Mancanza header Content-Security-Policy',
  );
  assert.ok(
    res.headers['content-security-policy'].includes("default-src 'self'"),
    'CSP non include default-src self',
  );

  // Verifica X-Content-Type-Options
  assert.strictEqual(
    res.headers['x-content-type-options'],
    'nosniff',
    'Mancanza o valore errato di X-Content-Type-Options',
  );

  console.log('✅ TEST SICUREZZA 1: Security Headers HTTP (Helmet & no x-powered-by) OK');
}

// TEST 2: Validazione Input su /prestiti (Codice Fiscale e Date)
async function testInputValidationPrestiti() {
  // Test 2a: Campi mancanti
  const resMissing = await request(
    {
      hostname: '127.0.0.1',
      port,
      path: '/prestiti',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
    'codice_inventario=C1001',
  );
  assert.strictEqual(resMissing.statusCode, 302, 'Campi mancanti non reindirizzano');
  assert.ok(resMissing.headers.location.includes('error='), 'Nessun messaggio di errore per campi mancanti');

  // Test 2b: Codice fiscale non valido (lunghezza errata)
  const resBadCF = await request(
    {
      hostname: '127.0.0.1',
      port,
      path: '/prestiti',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
    'codice_inventario=C1001&codice_fiscale=CORTO&data_restituzione_prevista=2099-12-31',
  );
  assert.strictEqual(resBadCF.statusCode, 302);
  assert.ok(resBadCF.headers.location.includes('Codice+fiscale+non+valido'), 'CF non valido non intercettato');

  // Test 2c: Data nel passato
  const resPastDate = await request(
    {
      hostname: '127.0.0.1',
      port,
      path: '/prestiti',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
    'codice_inventario=C1001&codice_fiscale=RSSMRA85M01H501Z&data_restituzione_prevista=2020-01-01',
  );
  assert.strictEqual(resPastDate.statusCode, 302);
  assert.ok(resPastDate.headers.location.includes('futura'), 'Data nel passato non bloccata');

  console.log('✅ TEST SICUREZZA 2: Validazione Input /prestiti (CF, campi e date) OK');
}

// TEST 3: Validazione ID numerico su /prestiti/:id/restituisci
async function testRestituzioneIdValidation() {
  // Test 3a: ID non numerico
  const resNonNumeric = await request({
    hostname: '127.0.0.1',
    port,
    path: '/prestiti/invalid_id/restituisci',
    method: 'POST',
  });
  assert.strictEqual(resNonNumeric.statusCode, 400, 'ID non numerico non restituisce 400');

  // Test 3b: ID negativo
  const resNegative = await request({
    hostname: '127.0.0.1',
    port,
    path: '/prestiti/-5/restituisci',
    method: 'POST',
  });
  assert.strictEqual(resNegative.statusCode, 400, 'ID negativo non restituisce 400');

  console.log('✅ TEST SICUREZZA 3: Validazione ID numerico su restituzione OK');
}

async function runSecurityTests() {
  server = app.listen(0, '127.0.0.1', async () => {
    port = server.address().port;
    try {
      await testSecurityHeaders();
      await testInputValidationPrestiti();
      await testRestituzioneIdValidation();
      console.log('🎉 Tutti i test di sicurezza completati con successo!');
      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ TEST DI SICUREZZA FALLITO:', err.message);
      server.close(() => process.exit(1));
    }
  });
}

runSecurityTests();
