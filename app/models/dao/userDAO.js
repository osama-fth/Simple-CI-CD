'use strict';

const pool = require('../../db');
const dayjs = require('dayjs');

class UserDAO {

  async getAllUsers() {
    const sql = `
      SELECT *
      FROM users
      ORDER BY id ASC
    `;
    const { rows } = await pool.query(sql);
    return rows.map(u => ({
      ...u,
      data_di_nascita: u.data_di_nascita
        ? dayjs(u.data_di_nascita).format('DD/MM/YYYY')
        : '',
    }));
  }

  async createUser({ nome, cognome, email, sesso, data_di_nascita }) {
    const sql = `
          INSERT INTO users (nome, cognome, email, sesso, data_di_nascita)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, nome, cognome, email, sesso, data_di_nascita
        `;

    await pool.query(sql, [nome, cognome, email, sesso, data_di_nascita]);
    return;
  }

  async deleteUser(id) {
    const sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const { rows } = await pool.query(sql, [id]);
    return rows.length === 1;
  }
}

module.exports = new UserDAO();
