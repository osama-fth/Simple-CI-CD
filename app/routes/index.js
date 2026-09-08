'use strict';

const express = require('express');
const router = express.Router();
const libraryDAO = require('../models/dao/libraryDAO');
const { passport } = require('../auth');
const { ensureOperator, ensureGuest } = require('../middleware/auth');
const logger = require('../utils/logger');

const CF_REGEX = /^[A-Z0-9]{16}$/i;
const ISBN_REGEX = /^[0-9]{10,13}$/;
const INVENTORY_CODE_REGEX = /^[A-Z0-9_-]{1,30}$/i;

function maskFiscalCode(cf) {
  if (!cf || typeof cf !== 'string' || cf.length < 8) {
    return '***';
  }
  return `${cf.slice(0, 3)}***${cf.slice(-4)}`;
}

// ==========================================
// AUTENTICAZIONE OPERATORI
// ==========================================

// Pagina di accesso operatori
router.get('/login', ensureGuest, (req, res) => {
  res.render('login', {
    title: 'Accesso Operatori · Gestionale Biblioteca',
    error: req.query.error || null,
    success: req.query.success || null,
  });
});

// Invio credenziali login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      logger.error(`Errore di sistema durante autenticazione: ${err.message || err.code || 'database non raggiungibile'}`);
      return res.redirect('/login?error=Servizio+temporaneamente+non+disponibile');
    }
    if (!user) {
      const msg = info?.message || 'Identificativo o password non validi';
      return res.redirect(`/login?error=${encodeURIComponent(msg)}`);
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      return res.redirect('/');
    });
  })(req, res, next);
});

// Chiusura sessione operatore
router.post('/logout', (req, res, next) => {
  const opUser = req.user?.username || 'sconosciuto';
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      logger.auth(`Disconnessione operatore completata: @${opUser}`);
      res.redirect('/login?success=Sessione+terminata+con+successo');
    });
  });
});

// Da questo punto in poi, tutte le rotte richiedono ruolo operatore
router.use(ensureOperator);

// Middleware per passare l'operatore corrente e i messaggi a tutti i template
router.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.query.error || null;
  res.locals.success = req.query.success || null;
  next();
});

// ==========================================
// DASHBOARD CENTRALE
// ==========================================
router.get('/', async (req, res, next) => {
  try {
    const stats = await libraryDAO.getDashboardStats();
    res.render('dashboard', {
      title: 'Panoramica Archivio · Biblioteca',
      activePage: 'dashboard',
      stats,
    });
  } catch (err) {
    logger.error(`Errore caricamento dashboard: ${err.message}`);
    next(err);
  }
});

// ==========================================
// SEZIONE 1: CATALOGO LIBRI E COPIE (CRUD)
// ==========================================
router.get('/libri', async (req, res, next) => {
  try {
    const query = req.query.q || '';
    const [libri, lookup] = await Promise.all([
      libraryDAO.getLibri(query),
      libraryDAO.getLookupData(),
    ]);

    res.render('libri', {
      title: 'Catalogo Libri · Biblioteca',
      activePage: 'libri',
      libri,
      lookup,
      searchQuery: query,
    });
  } catch (err) {
    logger.error(`Errore catalogo libri: ${err.message}`);
    next(err);
  }
});

// Inserimento nuovo libro
router.post('/libri', async (req, res, next) => {
  const { isbn, titolo, anno_pubblicazione, numero_pagine, descrizione, nome_genere, categoria_eta, nome_editore } = req.body || {};

  const cleanIsbn = String(isbn || '').trim().replace(/[-\s]/g, '');
  const cleanTitolo = String(titolo || '').trim();

  if (!ISBN_REGEX.test(cleanIsbn)) {
    return res.redirect('/libri?error=ISBN+non+valido+(attese+10+o+13+cifre)');
  }
  if (!cleanTitolo || !nome_genere || !categoria_eta) {
    return res.redirect('/libri?error=Titolo,+genere+e+fascia+età+sono+obbligatori');
  }

  try {
    await libraryDAO.creaLibro({
      isbn: cleanIsbn,
      titolo: cleanTitolo,
      anno_pubblicazione: anno_pubblicazione ? parseInt(anno_pubblicazione, 10) : null,
      numero_pagine: numero_pagine ? parseInt(numero_pagine, 10) : null,
      descrizione: descrizione ? String(descrizione).trim() : null,
      nome_genere,
      categoria_eta,
      nome_editore: nome_editore || null,
    });
    logger.info(`Nuovo titolo aggiunto a catalogo: [${cleanIsbn}] "${cleanTitolo}" da @${req.user.username}`);
    return res.redirect('/libri?success=Libro+inserito+con+successo');
  } catch (err) {
    logger.error(`Errore creazione libro [${cleanIsbn}]: ${err.message}`);
    if (err.code === '23505') {
      return res.redirect('/libri?error=Un+libro+con+questo+ISBN+è+già+presente+a+catalogo');
    }
    next(err);
  }
});

// Modifica libro
router.post('/libri/:isbn/modifica', async (req, res, next) => {
  const isbn = req.params.isbn;
  const { titolo, anno_pubblicazione, numero_pagine, descrizione, nome_genere, categoria_eta, nome_editore } = req.body || {};
  const cleanTitolo = String(titolo || '').trim();

  if (!cleanTitolo) {
    return res.redirect('/libri?error=Il+titolo+non+può+essere+vuoto');
  }

  try {
    const updated = await libraryDAO.aggiornaLibro(isbn, {
      titolo: cleanTitolo,
      anno_pubblicazione: anno_pubblicazione ? parseInt(anno_pubblicazione, 10) : null,
      numero_pagine: numero_pagine ? parseInt(numero_pagine, 10) : null,
      descrizione: descrizione ? String(descrizione).trim() : null,
      nome_genere,
      categoria_eta,
      nome_editore: nome_editore || null,
    });
    if (!updated) {
      return res.redirect('/libri?error=Libro+non+trovato');
    }
    logger.info(`Libro aggiornato: [${isbn}] da @${req.user.username}`);
    return res.redirect('/libri?success=Scheda+libro+aggiornata');
  } catch (err) {
    logger.error(`Errore aggiornamento libro [${isbn}]: ${err.message}`);
    next(err);
  }
});

// Eliminazione libro
router.post('/libri/:isbn/elimina', async (req, res, next) => {
  const isbn = req.params.isbn;
  try {
    await libraryDAO.eliminaLibro(isbn);
    logger.info(`Libro rimosso dal catalogo: [${isbn}] da @${req.user.username}`);
    return res.redirect('/libri?success=Libro+e+relative+copie+rimossi');
  } catch (err) {
    logger.error(`Errore eliminazione libro [${isbn}]: ${err.message}`);
    if (err.code === 'ACTIVE_LOANS_EXIST') {
      return res.redirect('/libri?error=Impossibile+eliminare:+esistono+prestiti+attivi+associati');
    }
    next(err);
  }
});

// Aggiunta copia fisica
router.post('/libri/:isbn/copie', async (req, res, next) => {
  const isbn = req.params.isbn;
  const { codice_inventario, stato } = req.body || {};
  const cleanCode = String(codice_inventario || '').trim().toUpperCase();

  if (!INVENTORY_CODE_REGEX.test(cleanCode)) {
    return res.redirect('/libri?error=Codice+inventario+non+valido');
  }

  try {
    await libraryDAO.creaCopia({
      codice_inventario: cleanCode,
      isbn,
      stato: stato || 'Disponibile',
    });
    logger.info(`Nuova copia [${cleanCode}] registrata per ISBN [${isbn}] da @${req.user.username}`);
    return res.redirect('/libri?success=Nuova+copia+aggiunta');
  } catch (err) {
    logger.error(`Errore aggiunta copia [${cleanCode}]: ${err.message}`);
    if (err.code === '23505') {
      return res.redirect('/libri?error=Il+codice+inventario+è+già+assegnato+a+un\'altra+copia');
    }
    next(err);
  }
});

// Rimozione copia fisica
router.post('/copie/:codice/elimina', async (req, res, next) => {
  const codice = req.params.codice;
  try {
    await libraryDAO.eliminaCopia(codice);
    logger.info(`Copia fisica eliminata: [${codice}] da @${req.user.username}`);
    return res.redirect('/libri?success=Copia+rimossa+dall\'inventario');
  } catch (err) {
    logger.error(`Errore rimozione copia [${codice}]: ${err.message}`);
    if (err.code === 'COPY_IN_USE') {
      return res.redirect('/libri?error=Impossibile+eliminare:+la+copia+è+attualmente+in+prestito');
    }
    next(err);
  }
});

// ==========================================
// SEZIONE 2: PRESTITI & RIENTRI (CRUD)
// ==========================================
router.get('/prestiti', async (req, res, next) => {
  try {
    const tab = req.query.tab || 'attivi';
    const query = req.query.q || '';
    const prestiti = await libraryDAO.getPrestiti(tab, query);

    const prestitiMasked = prestiti.map(p => ({
      ...p,
      codice_fiscale_mascherato: maskFiscalCode(p.codice_fiscale),
    }));

    res.render('prestiti', {
      title: 'Registro Prestiti · Biblioteca',
      activePage: 'prestiti',
      activeTab: tab,
      searchQuery: query,
      prestiti: prestitiMasked,
    });
  } catch (err) {
    logger.error(`Errore lista prestiti: ${err.message}`);
    next(err);
  }
});

// Registra prestito
router.post('/prestiti', async (req, res, next) => {
  const { codice_inventario, codice_fiscale, data_restituzione_prevista } = req.body || {};

  if (!codice_inventario || !codice_fiscale || !data_restituzione_prevista) {
    return res.redirect('/prestiti?error=Tutti+i+campi+del+prestito+sono+obbligatori');
  }

  const cleanInv = String(codice_inventario).trim().toUpperCase();
  const cleanCF = String(codice_fiscale).trim().toUpperCase();
  const dateStr = String(data_restituzione_prevista).trim();

  if (!INVENTORY_CODE_REGEX.test(cleanInv)) {
    return res.redirect('/prestiti?error=Formato+codice+inventario+non+valido');
  }
  if (!CF_REGEX.test(cleanCF)) {
    return res.redirect('/prestiti?error=Codice+fiscale+non+valido+(16+caratteri)');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.redirect('/prestiti?error=Formato+data+non+valido');
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (dateStr < todayStr) {
    return res.redirect('/prestiti?error=La+data+di+restituzione+deve+essere+futura');
  }

  try {
    const prestito = await libraryDAO.creaPrestito({
      codice_inventario: cleanInv,
      codice_fiscale: cleanCF,
      data_restituzione_prevista: dateStr,
    });
    logger.info(`Prestito registrato #${prestito.id_prestito}: Copia [${cleanInv}] a [${cleanCF}] da @${req.user.username}`);
    return res.redirect('/prestiti?success=Prestito+registrato+correttamente');
  } catch (err) {
    logger.warn(`Tentativo creazione prestito fallito: ${err.message}`);
    if (err.code === 'COPY_NOT_FOUND') {
      return res.redirect('/prestiti?error=Copia+inventario+non+censita');
    }
    if (err.code === 'COPY_NOT_AVAILABLE') {
      return res.redirect('/prestiti?error=Copia+non+disponibile+o+già+in+prestito');
    }
    if (err.code === 'MEMBER_NOT_FOUND') {
      return res.redirect('/prestiti?error=Tesserato+non+trovato+nell\'anagrafica');
    }
    next(err);
  }
});

// Registra restituzione prestito
router.post('/prestiti/:id/restituisci', async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).send('ID prestito non valido');
  }

  try {
    const ok = await libraryDAO.registraRestituzione(id);
    if (!ok) {
      return res.redirect('/prestiti?error=Prestito+non+trovato+o+già+restituito');
    }
    logger.info(`Restituzione registrata per prestito #${id} da @${req.user.username}`);
    return res.redirect('/prestiti?success=Restituzione+registrata+con+successo');
  } catch (err) {
    logger.error(`Errore restituzione prestito #${id}: ${err.message}`);
    next(err);
  }
});

// Eliminazione / cancellazione record prestito
router.post('/prestiti/:id/elimina', async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).send('ID prestito non valido');
  }

  try {
    const ok = await libraryDAO.eliminaPrestito(id);
    if (!ok) {
      return res.redirect('/prestiti?error=Prestito+non+trovato');
    }
    logger.info(`Record prestito #${id} cancellato da @${req.user.username}`);
    return res.redirect('/prestiti?success=Record+prestito+rimosso');
  } catch (err) {
    logger.error(`Errore cancellazione prestito #${id}: ${err.message}`);
    next(err);
  }
});

// ==========================================
// SEZIONE 3: ANAGRAFICA TESSERATI (CRUD)
// ==========================================
router.get('/tesserati', async (req, res, next) => {
  try {
    const query = req.query.q || '';
    const tesserati = await libraryDAO.getTesserati(query);

    const tesseratiMasked = tesserati.map(t => ({
      ...t,
      codice_fiscale_mascherato: maskFiscalCode(t.codice_fiscale),
    }));

    res.render('tesserati', {
      title: 'Anagrafica Tesserati · Biblioteca',
      activePage: 'tesserati',
      searchQuery: query,
      tesserati: tesseratiMasked,
    });
  } catch (err) {
    logger.error(`Errore lista tesserati: ${err.message}`);
    next(err);
  }
});

// Iscrizione tesserato
router.post('/tesserati', async (req, res, next) => {
  const { codice_fiscale, nome, cognome, data_nascita, email, indirizzo } = req.body || {};

  const cleanCF = String(codice_fiscale || '').trim().toUpperCase();
  const cleanNome = String(nome || '').trim();
  const cleanCognome = String(cognome || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!CF_REGEX.test(cleanCF)) {
    return res.redirect('/tesserati?error=Codice+fiscale+non+valido+(16+caratteri)');
  }
  if (!cleanNome || !cleanCognome || !data_nascita || !cleanEmail) {
    return res.redirect('/tesserati?error=Nome,+cognome,+data+nascita+ed+email+sono+obbligatori');
  }

  try {
    await libraryDAO.creaTesserato({
      codice_fiscale: cleanCF,
      nome: cleanNome,
      cognome: cleanCognome,
      data_nascita,
      email: cleanEmail,
      indirizzo: indirizzo ? String(indirizzo).trim() : null,
    });
    logger.info(`Nuovo tesserato iscritto: [${cleanCF}] ${cleanNome} ${cleanCognome} da @${req.user.username}`);
    return res.redirect('/tesserati?success=Tesserato+registrato+correttamente');
  } catch (err) {
    logger.error(`Errore registrazione tesserato [${cleanCF}]: ${err.message}`);
    if (err.code === '23505') {
      return res.redirect('/tesserati?error=Codice+fiscale+o+email+già+presenti+nel+sistema');
    }
    next(err);
  }
});

// Modifica contatti tesserato
router.post('/tesserati/:cf/modifica', async (req, res, next) => {
  const cf = req.params.cf;
  const { email, indirizzo } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanEmail) {
    return res.redirect('/tesserati?error=L\'indirizzo+email+è+obbligatorio');
  }

  try {
    const updated = await libraryDAO.aggiornaTesserato(cf, {
      email: cleanEmail,
      indirizzo: indirizzo ? String(indirizzo).trim() : null,
    });
    if (!updated) {
      return res.redirect('/tesserati?error=Tesserato+non+trovato');
    }
    logger.info(`Contatti tesserato [${cf}] aggiornati da @${req.user.username}`);
    return res.redirect('/tesserati?success=Dati+tesserato+aggiornati');
  } catch (err) {
    logger.error(`Errore modifica tesserato [${cf}]: ${err.message}`);
    next(err);
  }
});

// Eliminazione tesserato
router.post('/tesserati/:cf/elimina', async (req, res, next) => {
  const cf = req.params.cf;
  try {
    await libraryDAO.eliminaTesserato(cf);
    logger.info(`Tesserato [${cf}] rimosso dall'anagrafica da @${req.user.username}`);
    return res.redirect('/tesserati?success=Tesserato+eliminato+dall\'anagrafica');
  } catch (err) {
    logger.error(`Errore eliminazione tesserato [${cf}]: ${err.message}`);
    if (err.code === 'ACTIVE_LOANS_EXIST') {
      return res.redirect('/tesserati?error=Impossibile+eliminare:+il+tesserato+ha+prestiti+in+corso');
    }
    next(err);
  }
});

module.exports = router;
