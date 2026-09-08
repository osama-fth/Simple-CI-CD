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

// TEST 2: Verifica Protezione Rotte e Reindirizzamento a /login
async function testRouteProtection() {
  const resRoot = await request({
    hostname: '127.0.0.1',
    port,
    path: '/',
    method: 'GET',
  });
  assert.strictEqual(resRoot.statusCode, 302, 'Rotte protette devono reindirizzare con 302 a /login');
  assert.strictEqual(resRoot.headers.location, '/login', 'Reindirizzamento errato per utente non autenticato');

  const resPrestiti = await request({
    hostname: '127.0.0.1',
    port,
    path: '/prestiti',
    method: 'GET',
  });
  assert.strictEqual(resPrestiti.statusCode, 302);
  assert.strictEqual(resPrestiti.headers.location, '/login');

  const resLibri = await request({
    hostname: '127.0.0.1',
    port,
    path: '/libri',
    method: 'GET',
  });
  assert.strictEqual(resLibri.statusCode, 302);
  assert.strictEqual(resLibri.headers.location, '/login');

  console.log('✅ TEST SICUREZZA 2: Protezione Accesso Operatori (Reindirizzamento 302 a /login) OK');
}

// TEST 3: Accessibilità Pagina di Login Operatori
async function testLoginPage() {
  const resLogin = await request({
    hostname: '127.0.0.1',
    port,
    path: '/login',
    method: 'GET',
  });
  assert.strictEqual(resLogin.statusCode, 200, 'Pagina /login deve rispondere 200');
  assert.ok(resLogin.body.includes('Gestionale Biblioteca'), 'Pagina di login non contiene il titolo applicativo');
  assert.ok(resLogin.body.includes('Accesso Operatori'), 'Pagina di login non specifica il target operatori');

  console.log('✅ TEST SICUREZZA 3: Raggiungibilità Pagina Login Operatori (Status 200) OK');
}

// TEST 4: Rifiuto Credenziali Errate su /login
async function testFailedLogin() {
  const postData = 'username=utenteInesistente&password=passwordErrata';
  const resLoginFail = await request(
    {
      hostname: '127.0.0.1',
      port,
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    },
    postData,
  );

  assert.strictEqual(resLoginFail.statusCode, 302, 'Login fallito deve reindirizzare a /login con errore');
  assert.ok(
    resLoginFail.headers.location.startsWith('/login?error='),
    'Login fallito non contiene il parametro di errore nella query',
  );

  console.log('✅ TEST SICUREZZA 4: Rifiuto Credenziali Errate su /login con tracciamento OK');
}

async function runSecurityTests() {
  server = app.listen(0, '127.0.0.1', async () => {
    port = server.address().port;
    try {
      await testSecurityHeaders();
      await testRouteProtection();
      await testLoginPage();
      await testFailedLogin();
      console.log('🎉 Tutti i test di sicurezza e autenticazione completati con successo!');
      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ TEST DI SICUREZZA FALLITO:', err.message);
      server.close(() => process.exit(1));
    }
  });
}

runSecurityTests();
