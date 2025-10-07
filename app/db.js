const { MongoClient } = require('mongodb');

const {
  MONGO_HOST = 'db',
  MONGO_PORT = '27017',
  MONGO_DB = 'mydb',
  MONGO_USER,
  MONGO_PASSWORD,
} = process.env;

// Costruisce sempre dai parametri separati (.env)
const hasAuth = MONGO_USER && MONGO_PASSWORD;
const uri = hasAuth
  ? `mongodb://${encodeURIComponent(MONGO_USER)}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`
  : `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;

const client = new MongoClient(uri);
let _db;

async function getDb() {
  if (!_db) {
    await client.connect();
    _db = client.db(MONGO_DB);
  }
  return _db;
}

module.exports = { getDb };
