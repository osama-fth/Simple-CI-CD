'use strict';

const { getDb } = require('../../db');
const dayjs = require('dayjs');
const { ObjectId } = require('mongodb');

class UserDAO {
  async getAllUsers() {
    const db = await getDb();
    const docs = await db.collection('users').find({}).sort({ _id: 1 }).toArray();
    return docs.map(u => ({
      id: u._id.toString(),
      nome: u.nome,
      cognome: u.cognome,
      email: u.email,
      sesso: u.sesso,
      data_di_nascita: u.data_di_nascita ? dayjs(u.data_di_nascita).format('DD/MM/YYYY') : '',
    }));
  }

  async createUser({ nome, cognome, email, sesso, data_di_nascita }) {
    const db = await getDb();
    const doc = {
      nome,
      cognome,
      email,
      sesso,
      data_di_nascita: data_di_nascita ? new Date(data_di_nascita) : null,
    };
    await db.collection('users').insertOne(doc);
    return;
  }

  async deleteUser(id) {
    const db = await getDb();
    const res = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
    return res.deletedCount === 1;
  }
}

module.exports = new UserDAO();
