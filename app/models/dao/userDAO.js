'use strict';

const pool = require('../../db');

class UserDAO {
  async findByUsername(username) {
    const { rows } = await pool.query(
      'SELECT id_utente, username, password_hash, nome, ruolo FROM utenti WHERE LOWER(username) = LOWER($1)',
      [username],
    );
    return rows[0] || null;
  }

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id_utente, username, nome, ruolo FROM utenti WHERE id_utente = $1',
      [id],
    );
    return rows[0] || null;
  }

  isOperator(user) {
    return Boolean(user && (user.ruolo === 'Operatore' || user.ruolo === 'Admin'));
  }
}

module.exports = new UserDAO();
