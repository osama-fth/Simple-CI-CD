const http = require('http');
const assert = require('assert');
const pool = require('../db');
const app = require('../app');

async function run() {
  const server = app.listen(0, () => {
    const { port } = server.address();
    const req = http.request(
      { hostname: '127.0.0.1', port, path: '/', method: 'GET' },
      (res) => {
        (async () => {
          try {
            assert.strictEqual(res.statusCode, 200, 'Status non 200');
            const r = await pool.query('SELECT COUNT(*)::int AS c FROM users');
            assert.ok(r.rows[0].c >= 0, 'Query users fallita');
            console.log(`TEST OK: / => 200, users count=${r.rows[0].c}`);
            server.close(() => process.exit(0));
          } catch (e) {
            console.error('TEST FALLITO:', e.message);
            server.close(() => process.exit(1));
          }
        })();
      },
    );
    req.on('error', (err) => {
      console.error('Errore richiesta:', err.message);
      server.close(() => process.exit(1));
    });
    req.end();
  });
}

run();
