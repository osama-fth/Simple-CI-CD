var express = require('express');
const pool = require('../db');
var router = express.Router();
let dayjs = require('dayjs')

/* GET home page. */
router.get('/', async function(req, res) {
  let users;
  try {
    const result = await pool.query('SELECT id, nome, cognome, email, data_di_nascita FROM users ORDER BY id ASC');
    users = (result.rows || []).map(u => ({
      ...u,
      data_di_nascita: u.data_di_nascita ? dayjs(u.data_di_nascita).format('DD/MM/YYYY') : ''
    }));
  } catch (err) {
    console.error(err);
  }
  finally{
    res.render('index', { title: 'Simple CI/CD', users });
  }
});

module.exports = router;
