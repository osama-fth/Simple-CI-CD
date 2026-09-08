'use strict';

const pool = require('../../db');

class LibraryDAO {
  // ==========================================
  // DASHBOARD & STATISTICHE
  // ==========================================
  async getDashboardStats() {
    const [libriRes, copieRes, copieDispRes, prestitiAttiviRes, ritardiRes, tesseratiRes, recentiRes] =
      await Promise.all([
        pool.query('SELECT COUNT(*)::int AS count FROM libri'),
        pool.query('SELECT COUNT(*)::int AS count FROM copie'),
        pool.query("SELECT COUNT(*)::int AS count FROM copie WHERE stato = 'Disponibile'"),
        pool.query("SELECT COUNT(*)::int AS count FROM prestiti WHERE stato = 'Attivo'"),
        pool.query(
          "SELECT COUNT(*)::int AS count FROM prestiti WHERE stato = 'Attivo' AND data_restituzione_prevista < CURRENT_DATE",
        ),
        pool.query('SELECT COUNT(*)::int AS count FROM tesserati'),
        pool.query(`
          SELECT p.id_prestito, p.data_prestito, p.stato, t.nome, t.cognome, l.titolo, p.codice_inventario
          FROM prestiti p
          JOIN tesserati t ON p.codice_fiscale = t.codice_fiscale
          JOIN copie c ON p.codice_inventario = c.codice_inventario
          JOIN libri l ON c.isbn = l.isbn
          ORDER BY p.data_prestito DESC, p.id_prestito DESC
          LIMIT 6
        `),
      ]);

    return {
      totaleTitoli: libriRes.rows[0].count,
      totaleCopie: copieRes.rows[0].count,
      copieDisponibili: copieDispRes.rows[0].count,
      prestitiAttivi: prestitiAttiviRes.rows[0].count,
      prestitiInRitardo: ritardiRes.rows[0].count,
      totaleTesserati: tesseratiRes.rows[0].count,
      ultimeAttivita: recentiRes.rows,
    };
  }

  // ==========================================
  // ANAGRAFICHE DI SUPPORTO (LOOKUP)
  // ==========================================
  async getLookupData() {
    const [generiRes, categorieRes, editoriRes] = await Promise.all([
      pool.query('SELECT nome_genere FROM generi ORDER BY nome_genere ASC'),
      pool.query('SELECT categoria_eta FROM categorie_eta ORDER BY categoria_eta ASC'),
      pool.query('SELECT nome_editore FROM editori ORDER BY nome_editore ASC'),
    ]);
    return {
      generi: generiRes.rows.map(r => r.nome_genere),
      categorieEta: categorieRes.rows.map(r => r.categoria_eta),
      editori: editoriRes.rows.map(r => r.nome_editore),
    };
  }

  // ==========================================
  // CATALOGO LIBRI E COPIE (CRUD)
  // ==========================================
  async getLibri(query = null) {
    let sql = `
      SELECT 
        l.isbn, 
        l.titolo, 
        l.anno_pubblicazione, 
        l.numero_pagine, 
        l.descrizione,
        l.nome_genere, 
        l.categoria_eta, 
        l.nome_editore,
        COUNT(c.codice_inventario)::int AS copie_totali,
        COUNT(CASE WHEN c.stato = 'Disponibile' THEN 1 END)::int AS copie_disponibili
      FROM libri l
      LEFT JOIN copie c ON l.isbn = c.isbn
    `;
    const params = [];

    if (query && query.trim()) {
      sql += `
        WHERE l.titolo ILIKE $1 
           OR l.isbn ILIKE $1 
           OR l.nome_editore ILIKE $1 
           OR l.nome_genere ILIKE $1
      `;
      params.push(`%${query.trim()}%`);
    }

    sql += ' GROUP BY l.isbn, l.titolo, l.anno_pubblicazione, l.numero_pagine, l.descrizione, l.nome_genere, l.categoria_eta, l.nome_editore ORDER BY l.titolo ASC';

    const { rows } = await pool.query(sql, params);
    return rows;
  }

  async getLibriDisponibili() {
    const { rows } = await pool.query(
      'SELECT codice_inventario, isbn, titolo, nome_genere, categoria_eta, nome_editore FROM libri_disponibili ORDER BY titolo ASC',
    );
    return rows;
  }

  async getLibroByIsbn(isbn) {
    const { rows } = await pool.query('SELECT * FROM libri WHERE isbn = $1', [isbn]);
    return rows[0] || null;
  }

  async creaLibro({ isbn, titolo, anno_pubblicazione, numero_pagine, descrizione, nome_genere, categoria_eta, nome_editore }) {
    const { rows } = await pool.query(
      `INSERT INTO libri (isbn, titolo, anno_pubblicazione, numero_pagine, descrizione, nome_genere, categoria_eta, nome_editore)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [isbn, titolo, anno_pubblicazione || null, numero_pagine || null, descrizione || null, nome_genere, categoria_eta, nome_editore || null],
    );
    return rows[0];
  }

  async aggiornaLibro(isbn, { titolo, anno_pubblicazione, numero_pagine, descrizione, nome_genere, categoria_eta, nome_editore }) {
    const { rows } = await pool.query(
      `UPDATE libri
       SET titolo = $1, anno_pubblicazione = $2, numero_pagine = $3, descrizione = $4, nome_genere = $5, categoria_eta = $6, nome_editore = $7
       WHERE isbn = $8
       RETURNING *`,
      [titolo, anno_pubblicazione || null, numero_pagine || null, descrizione || null, nome_genere, categoria_eta, nome_editore || null, isbn],
    );
    return rows[0] || null;
  }

  async eliminaLibro(isbn) {
    // Verifica se esistono copie con prestiti attivi collegati
    const check = await pool.query(
      `SELECT 1 
       FROM prestiti p
       JOIN copie c ON p.codice_inventario = c.codice_inventario
       WHERE c.isbn = $1 AND p.stato = 'Attivo'`,
      [isbn],
    );
    if (check.rowCount > 0) {
      const err = new Error('Impossibile eliminare il libro: esistono copie associate a prestiti attivi');
      err.code = 'ACTIVE_LOANS_EXIST';
      throw err;
    }
    const { rowCount } = await pool.query('DELETE FROM libri WHERE isbn = $1', [isbn]);
    return rowCount === 1;
  }

  async getCopieByIsbn(isbn) {
    const { rows } = await pool.query(
      'SELECT codice_inventario, isbn, stato FROM copie WHERE isbn = $1 ORDER BY codice_inventario ASC',
      [isbn],
    );
    return rows;
  }

  async creaCopia({ codice_inventario, isbn, stato = 'Disponibile' }) {
    const { rows } = await pool.query(
      'INSERT INTO copie (codice_inventario, isbn, stato) VALUES ($1, $2, $3) RETURNING *',
      [codice_inventario, isbn, stato],
    );
    return rows[0];
  }

  async eliminaCopia(codice_inventario) {
    const check = await pool.query(
      "SELECT 1 FROM prestiti WHERE codice_inventario = $1 AND stato = 'Attivo'",
      [codice_inventario],
    );
    if (check.rowCount > 0) {
      const err = new Error('Impossibile eliminare: la copia fisica è attualmente in prestito attivo');
      err.code = 'COPY_IN_USE';
      throw err;
    }
    const { rowCount } = await pool.query('DELETE FROM copie WHERE codice_inventario = $1', [codice_inventario]);
    return rowCount === 1;
  }

  // ==========================================
  // PRESTITI (CRUD)
  // ==========================================
  async getPrestiti(filter = 'tutti', query = null) {
    let sql = `
      SELECT 
        p.id_prestito,
        p.codice_inventario,
        p.codice_fiscale,
        p.data_prestito,
        p.data_restituzione_prevista,
        p.data_restituzione_effettiva,
        p.stato,
        t.nome,
        t.cognome,
        l.titolo,
        l.isbn,
        CASE WHEN p.stato = 'Attivo' AND p.data_restituzione_prevista < CURRENT_DATE THEN true ELSE false END AS in_ritardo
      FROM prestiti p
      JOIN tesserati t ON p.codice_fiscale = t.codice_fiscale
      JOIN copie c ON p.codice_inventario = c.codice_inventario
      JOIN libri l ON c.isbn = l.isbn
      WHERE 1=1
    `;
    const params = [];

    if (filter === 'attivi') {
      sql += " AND p.stato = 'Attivo'";
    } else if (filter === 'ritardi') {
      sql += " AND p.stato = 'Attivo' AND p.data_restituzione_prevista < CURRENT_DATE";
    } else if (filter === 'storico') {
      sql += " AND p.stato = 'Restituito'";
    }

    if (query && query.trim()) {
      params.push(`%${query.trim()}%`);
      sql += ` AND (
        t.nome ILIKE $${params.length} 
        OR t.cognome ILIKE $${params.length} 
        OR p.codice_fiscale ILIKE $${params.length} 
        OR p.codice_inventario ILIKE $${params.length} 
        OR l.titolo ILIKE $${params.length}
      )`;
    }

    sql += ' ORDER BY p.data_prestito DESC, p.id_prestito DESC';

    const { rows } = await pool.query(sql, params);
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

      const memberCheck = await client.query(
        'SELECT 1 FROM tesserati WHERE codice_fiscale = $1',
        [codice_fiscale],
      );
      if (memberCheck.rowCount === 0) {
        const err = new Error('Codice fiscale non registrato tra i tesserati');
        err.code = 'MEMBER_NOT_FOUND';
        throw err;
      }

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

  async eliminaPrestito(id_prestito) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const cur = await client.query('SELECT codice_inventario, stato FROM prestiti WHERE id_prestito = $1', [id_prestito]);
      if (cur.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }
      const prestito = cur.rows[0];
      await client.query('DELETE FROM prestiti WHERE id_prestito = $1', [id_prestito]);

      // Se era attivo, ripristina la copia su 'Disponibile'
      if (prestito.stato === 'Attivo') {
        await client.query(
          "UPDATE copie SET stato = 'Disponibile' WHERE codice_inventario = $1",
          [prestito.codice_inventario],
        );
      }
      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // ==========================================
  // TESSERATI (CRUD)
  // ==========================================
  async getTesserati(query = null) {
    let sql = `
      SELECT 
        t.codice_fiscale,
        t.nome,
        t.cognome,
        t.data_nascita,
        t.email,
        t.indirizzo,
        t.data_iscrizione,
        COUNT(CASE WHEN p.stato = 'Attivo' THEN 1 END)::int AS prestiti_in_corso
      FROM tesserati t
      LEFT JOIN prestiti p ON t.codice_fiscale = p.codice_fiscale
    `;
    const params = [];

    if (query && query.trim()) {
      sql += `
        WHERE t.nome ILIKE $1 
           OR t.cognome ILIKE $1 
           OR t.codice_fiscale ILIKE $1 
           OR t.email ILIKE $1
      `;
      params.push(`%${query.trim()}%`);
    }

    sql += ' GROUP BY t.codice_fiscale, t.nome, t.cognome, t.data_nascita, t.email, t.indirizzo, t.data_iscrizione ORDER BY t.cognome ASC, t.nome ASC';

    const { rows } = await pool.query(sql, params);
    return rows;
  }

  async getTesseratoByCF(codice_fiscale) {
    const { rows } = await pool.query('SELECT * FROM tesserati WHERE codice_fiscale = $1', [codice_fiscale]);
    return rows[0] || null;
  }

  async creaTesserato({ codice_fiscale, nome, cognome, data_nascita, email, indirizzo }) {
    const { rows } = await pool.query(
      `INSERT INTO tesserati (codice_fiscale, nome, cognome, data_nascita, email, indirizzo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [codice_fiscale, nome, cognome, data_nascita, email, indirizzo || null],
    );
    return rows[0];
  }

  async aggiornaTesserato(codice_fiscale, { email, indirizzo }) {
    const { rows } = await pool.query(
      `UPDATE tesserati 
       SET email = $1, indirizzo = $2
       WHERE codice_fiscale = $3
       RETURNING *`,
      [email, indirizzo || null, codice_fiscale],
    );
    return rows[0] || null;
  }

  async eliminaTesserato(codice_fiscale) {
    const check = await pool.query(
      "SELECT 1 FROM prestiti WHERE codice_fiscale = $1 AND stato = 'Attivo'",
      [codice_fiscale],
    );
    if (check.rowCount > 0) {
      const err = new Error('Impossibile eliminare: il tesserato ha prestiti in corso non ancora restituiti');
      err.code = 'ACTIVE_LOANS_EXIST';
      throw err;
    }
    const { rowCount } = await pool.query('DELETE FROM tesserati WHERE codice_fiscale = $1', [codice_fiscale]);
    return rowCount === 1;
  }
}

module.exports = new LibraryDAO();
