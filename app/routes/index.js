'use strict';

const express = require('express');
const router = express.Router();
const libraryDAO = require('../models/dao/libraryDAO');

// GET dashboard biblioteca
router.get('/', async (req, res) => {
  try {
    const [libri, prestitiAttivi, prestitiInRitardo] = await Promise.all([
      libraryDAO.getLibriDisponibili(),
      libraryDAO.getPrestitiAttivi(),
      libraryDAO.getPrestitiInRitardo(),
    ]);

    res.render('index', {
      title: 'Biblioteca · Gestionale',
      libri,
      prestitiAttivi,
      prestitiInRitardo,
    });
  } catch (err) {
    console.error('[Dashboard] errore:', err);
    res.status(500).send('Errore interno');
  }
});

// CREA nuovo prestito
router.post('/prestiti', async (req, res) => {
  const { codice_inventario, codice_fiscale, data_restituzione_prevista } = req.body || {};
  if (!codice_inventario || !codice_fiscale || !data_restituzione_prevista) {
    return res.redirect('/');
  }
  try {
    await libraryDAO.creaPrestito({ codice_inventario, codice_fiscale, data_restituzione_prevista });
    return res.redirect('/');
  } catch (err) {
    console.error('[creaPrestito] errore:', err.message);
    return res.redirect('/');
  }
});

// REGISTRA restituzione prestito
router.post('/prestiti/:id/restituisci', async (req, res) => {
  try {
    await libraryDAO.registraRestituzione(Number(req.params.id));
    return res.redirect('/');
  } catch (err) {
    console.error('[restituisciPrestito] errore:', err);
    return res.redirect('/');
  }
});

module.exports = router;
