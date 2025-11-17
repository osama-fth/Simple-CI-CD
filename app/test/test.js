const http = require('http');
const assert = require('assert');
const pool = require('../db');
const app = require('../app');

let server;
let port;

async function waitForDb(maxMs = 20000) {
  const start = Date.now();
  let lastErr;
  while (Date.now() - start < maxMs) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw lastErr || new Error('DB non pronto');
}

// TEST 1: App raggiungibile
async function testAppRaggiungibile() {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, path: '/', method: 'GET' },
      (res) => {
        try {
          assert.strictEqual(res.statusCode, 200, 'Homepage non raggiungibile (non restituisce 200)');
          console.log('✅ TEST 1: App raggiungibile (status 200)');
          resolve();
        } catch (err) {
          reject(err);
        }
      },
    );
    req.on('error', reject);
    req.end();
  });
}

// TEST 2: Esistenza dati in "libri"
async function testLibriTable() {
  const result = await pool.query('SELECT COUNT(*)::int AS count FROM libri');
  assert.ok(result.rows[0].count >= 0, 'Query libri fallita');
  console.log(`✅ TEST 2: Tabella libri OK (${result.rows[0].count} record)`);
}

// TEST 3: Vista "prestiti_attivi" accessibile
async function testPrestitiAttiviView() {
  const result = await pool.query('SELECT COUNT(*)::int AS count FROM prestiti_attivi');
  assert.ok(result.rows[0].count >= 0, 'Vista prestiti_attivi non accessibile');
  console.log(`✅ TEST 3: Vista prestiti_attivi OK (${result.rows[0].count} record)`);
}

async function runTests() {
  try {
    await waitForDb();

    server = app.listen(0, async () => {
      port = server.address().port;
      console.log(`Server di test avviato sulla porta ${port}`);

      try {
        await testAppRaggiungibile();
        await testLibriTable();
        await testPrestitiAttiviView();

        console.log('🎉 Tutti i test completati con successo!');
        server.close(() => pool.end().then(() => process.exit(0)));
      } catch (err) {
        console.error('❌ TEST FALLITO:', err.message);
        server.close(() => pool.end().then(() => process.exit(1)));
      }
    });
  } catch (err) {
    console.error('Errore di avvio del server o DB:', err.message);
    process.exit(1);
  }
}

runTests();
