'use strict';

const express = require('express');
const router = express.Router();
const userDAO = require('../models/dao/userDAO');

// GET home page
router.get('/', async (req, res) => {
  let users = [];
  try {
    users = await userDAO.getAllUsers();
  } catch (err) {
    console.error('[Users] errore:', err);
  } finally {
    res.render('index', { title: 'Simple CI/CD', users });
  }
});

// CREA utente 
router.post('/users', async (req, res) => {
  const { nome, cognome, email, data_di_nascita } = req.body || {};
  if (!nome || !cognome || !email) {
    return res.redirect('/'); 
  }
  try {
    await userDAO.createUser({ nome, cognome, email, data_di_nascita });
    return res.redirect('/');
  } catch (err) {
    console.error('[createUser] errore:', err);
    return res.redirect('/');
  }
});

// ELIMINA utente
router.post('/users/:id/delete', async (req, res) => {
  try {
    await userDAO.deleteUser(Number(req.params.id));
    return res.redirect('/');
  } catch (err) {
    console.error('[deleteUser] errore:', err);
    return res.redirect('/');
  }
});

module.exports = router;
