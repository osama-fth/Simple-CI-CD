// Test semplice: verifica che GET / risponda 200 e che il DB sia accessibile
const http = require('http');
const assert = require('assert');
const pool = require('../db');
const app = require('../app');

async function run() {
  const server = app.listen(0, () => {
    const { port } = server.address();
    const options = { hostname: '127.0.0.1', port, path: '/', method: 'GET' };
    const req = http.request(options, (res) => {
      (async () => {
        try {
          assert.strictEqual(res.statusCode, 200, 'Status code non è 200');
          // Verifica connessione DB con una query banale (non fallisce anche se tabella vuota)
            const r = await pool.query('SELECT 1');
            assert.strictEqual(r.rowCount, 1, 'Connessione DB non valida');
          console.log('TEST OK: GET / => 200 e DB raggiungibile');
          server.close(() => process.exit(0));
        } catch (e) {
          console.error('TEST FALLITO:', e.message);
          server.close(() => process.exit(1));
        }
      })();
    });
    req.on('error', (err) => {
      console.error('Errore richiesta:', err.message);
      server.close(() => process.exit(1));
    });
    req.end();
  });
}

run();
