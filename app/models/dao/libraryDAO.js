'use strict';

const pool = require('../../db');

class LibraryDAO {
  async getLibriDisponibili() {
    const { rows } = await pool.query(
      'SELECT codice_inventario, isbn, titolo, nome_genere, categoria_eta, nome_editore FROM libri_disponibili ORDER BY titolo ASC',
    );
    return rows;
  }

  async getPrestitiAttivi() {
    const { rows } = await pool.query(
      'SELECT id_prestito, codice_fiscale, nome, cognome, codice_inventario, titolo, data_prestito, data_restituzione_prevista FROM prestiti_attivi ORDER BY data_prestito DESC',
    );
    return rows;
  }

  async getPrestitiInRitardo() {
    const { rows } = await pool.query(
      'SELECT id_prestito, codice_fiscale, nome, cognome, codice_inventario, titolo, data_prestito, data_restituzione_prevista FROM prestiti_in_ritardo ORDER BY data_restituzione_prevista ASC',
    );
    return rows;
  }

  async creaPrestito({ codice_inventario, codice_fiscale, data_restituzione_prevista }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verifica che la copia non sia già in prestito attivo
      const check = await client.query(
        'SELECT 1 FROM prestiti WHERE codice_inventario = $1 AND stato = $2',
        [codice_inventario, 'Attivo'],
      );
      if (check.rowCount > 0) {
        const err = new Error('Copia già in prestito');
        err.code = 'COPY_NOT_AVAILABLE';
        throw err;
      }

      const ins = await client.query(
        `INSERT INTO prestiti (codice_inventario, codice_fiscale, data_restituzione_prevista)
         VALUES ($1, $2, $3)
         RETURNING id_prestito`,
        [codice_inventario, codice_fiscale, data_restituzione_prevista],
      );

      await client.query('COMMIT');
      return ins.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async registraRestituzione(id_prestito) {
    const { rows } = await pool.query(
      `UPDATE prestiti
       SET data_restituzione_effettiva = CURRENT_DATE, stato = 'Restituito'
       WHERE id_prestito = $1 AND stato = 'Attivo'
       RETURNING id_prestito`,
      [id_prestito],
    );
    return rows.length === 1;
  }
}

module.exports = new LibraryDAO();
