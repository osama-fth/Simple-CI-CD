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

      // Verifica esistenza e stato della copia con lock esclusivo FOR UPDATE per prevenire race conditions
      const copiaCheck = await client.query(
        'SELECT stato FROM copie WHERE codice_inventario = $1 FOR UPDATE',
        [codice_inventario],
      );
      if (copiaCheck.rowCount === 0) {
        const err = new Error('Copia non trovata nel catalogo');
        err.code = 'COPY_NOT_FOUND';
        throw err;
      }
      if (copiaCheck.rows[0].stato !== 'Disponibile') {
        const err = new Error('Copia non disponibile per il prestito');
        err.code = 'COPY_NOT_AVAILABLE';
        throw err;
      }

      // Verifica che il tesserato esista a catalogo
      const memberCheck = await client.query(
        'SELECT 1 FROM tesserati WHERE codice_fiscale = $1',
        [codice_fiscale],
      );
      if (memberCheck.rowCount === 0) {
        const err = new Error('Codice fiscale non registrato tra i tesserati');
        err.code = 'MEMBER_NOT_FOUND';
        throw err;
      }

      // Verifica aggiuntiva prestiti attivi
      const check = await client.query(
        'SELECT 1 FROM prestiti WHERE codice_inventario = $1 AND stato = $2',
        [codice_inventario, 'Attivo'],
      );
      if (check.rowCount > 0) {
        const err = new Error('Copia già associata a un prestito attivo');
        err.code = 'COPY_NOT_AVAILABLE';
        throw err;
      }

      const ins = await client.query(
        `INSERT INTO prestiti (codice_inventario, codice_fiscale, data_restituzione_prevista)
         VALUES ($1, $2, $3)
         RETURNING id_prestito`,
        [codice_inventario, codice_fiscale, data_restituzione_prevista],
      );

      // Sincronizza lo stato della copia fisica
      await client.query(
        "UPDATE copie SET stato = 'Prestata' WHERE codice_inventario = $1",
        [codice_inventario],
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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE prestiti
         SET data_restituzione_effettiva = CURRENT_DATE, stato = 'Restituito'
         WHERE id_prestito = $1 AND stato = 'Attivo'
         RETURNING codice_inventario`,
        [id_prestito],
      );

      if (rows.length === 1) {
        await client.query(
          "UPDATE copie SET stato = 'Disponibile' WHERE codice_inventario = $1",
          [rows[0].codice_inventario],
        );
      }

      await client.query('COMMIT');
      return rows.length === 1;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

module.exports = new LibraryDAO();
