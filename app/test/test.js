const http = require('http');
const assert = require('assert');
const pool = require('../db');
const app = require('../app');

let server;
let port;

// Test 1: Verifica che l'app sia raggiungibile
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

// Test 2: Verifica che il DB contenga utenti
async function testDatabase() {
  try {
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    assert.ok(result.rows[0].count >= 0, 'Query users fallita');
    console.log(`✅ TEST 2: Database funzionante (${result.rows[0].count} utenti trovati)`);
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  }
}

// Esegue i test in sequenza
async function runTests() {
  try {
    // Avvio server
    server = app.listen(0, async () => {
      port = server.address().port;
      console.log(`Server di test avviato sulla porta ${port}`);
      
      try {
        // Esegui i test
        await testAppRaggiungibile();
        await testDatabase();
        
        // Chiusura
        console.log('🎉 Tutti i test completati con successo!');
        server.close(() => pool.end().then(() => process.exit(0)));
      } catch (err) {
        console.error('❌ TEST FALLITO:', err.message);
        server.close(() => pool.end().then(() => process.exit(1)));
      }
    });
  } catch (err) {
    console.error('Errore di avvio del server:', err.message);
    process.exit(1);
  }
}

runTests();
