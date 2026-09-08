'use strict';

const express = require('express');
const router = express.Router();
const libraryDAO = require('../models/dao/libraryDAO');

const CF_REGEX = /^[A-Z0-9]{16}$/i;
const INVENTORY_CODE_REGEX = /^[A-Z0-9_-]{1,30}$/i;

function maskFiscalCode(cf) {
  if (!cf || typeof cf !== 'string' || cf.length < 8) {
    return '***';
  }
  return `${cf.slice(0, 3)}***${cf.slice(-4)}`;
}

// GET dashboard biblioteca
router.get('/', async (req, res, next) => {
  try {
    const [libri, prestitiAttivi, prestitiInRitardo] = await Promise.all([
      libraryDAO.getLibriDisponibili(),
      libraryDAO.getPrestitiAttivi(),
      libraryDAO.getPrestitiInRitardo(),
    ]);

    // Maschera i Codici Fiscali per minimizzazione PII nella dashboard pubblica
    const prestitiAttiviMasked = prestitiAttivi.map(p => ({
      ...p,
      codice_fiscale_mascherato: maskFiscalCode(p.codice_fiscale),
    }));

    const prestitiInRitardoMasked = prestitiInRitardo.map(p => ({
      ...p,
      codice_fiscale_mascherato: maskFiscalCode(p.codice_fiscale),
    }));

    res.render('index', {
      title: 'Biblioteca · Gestionale',
      libri,
      prestitiAttivi: prestitiAttiviMasked,
      prestitiInRitardo: prestitiInRitardoMasked,
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error('[Dashboard] errore:', err.message);
    next(err);
  }
});

// CREA nuovo prestito
router.post('/prestiti', async (req, res, next) => {
  const { codice_inventario, codice_fiscale, data_restituzione_prevista } = req.body || {};

  // Validazione presenza campi
  if (!codice_inventario || !codice_fiscale || !data_restituzione_prevista) {
    return res.redirect('/?error=Campi+obbligatori+mancanti');
  }

  // Validazione sintattica codice inventario
  const cleanCodiceInventario = String(codice_inventario).trim().toUpperCase();
  if (!INVENTORY_CODE_REGEX.test(cleanCodiceInventario)) {
    return res.redirect('/?error=Formato+codice+inventario+non+valido');
  }

  // Validazione sintattica Codice Fiscale
  const cleanCF = String(codice_fiscale).trim().toUpperCase();
  if (!CF_REGEX.test(cleanCF)) {
    return res.redirect('/?error=Codice+fiscale+non+valido+(attesi+16+caratteri)');
  }

  // Validazione formato e coerenza data
  const dateStr = String(data_restituzione_prevista).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.redirect('/?error=Formato+data+non+valido');
  }

  const parsedDate = new Date(dateStr);
  if (isNaN(parsedDate.getTime())) {
    return res.redirect('/?error=Data+restituzione+non+valida');
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (dateStr < todayStr) {
    return res.redirect('/?error=La+data+di+restituzione+deve+essere+futura');
  }

  try {
    await libraryDAO.creaPrestito({
      codice_inventario: cleanCodiceInventario,
      codice_fiscale: cleanCF,
      data_restituzione_prevista: dateStr,
    });
    return res.redirect('/?success=Prestito+creato+con+successo');
  } catch (err) {
    console.error('[creaPrestito] errore:', err.message);
    if (err.code === 'COPY_NOT_FOUND') {
      return res.redirect('/?error=Copia+non+trovata');
    }
    if (err.code === 'COPY_NOT_AVAILABLE') {
      return res.redirect('/?error=Copia+non+disponibile+per+il+prestito');
    }
    if (err.code === 'MEMBER_NOT_FOUND') {
      return res.redirect('/?error=Tesserato+non+trovato');
    }
    next(err);
  }
});

// REGISTRA restituzione prestito
router.post('/prestiti/:id/restituisci', async (req, res, next) => {
  const rawId = req.params.id;
  if (!/^\d+$/.test(rawId)) {
    return res.status(400).send('Identificatore prestito non valido');
  }

  const id = parseInt(rawId, 10);
  if (id <= 0) {
    return res.status(400).send('Identificatore prestito non valido');
  }

  try {
    const ok = await libraryDAO.registraRestituzione(id);
    if (!ok) {
      return res.redirect('/?error=Prestito+non+trovato+o+gia+restituito');
    }
    return res.redirect('/?success=Restituzione+registrata+con+successo');
  } catch (err) {
    console.error('[restituisciPrestito] errore:', err.message);
    next(err);
  }
});

module.exports = router;

