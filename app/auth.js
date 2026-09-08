'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const userDAO = require('./models/dao/userDAO');
const logger = require('./utils/logger');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username, password, done) => {
      try {
        const cleanUser = String(username || '').trim();
        const user = await userDAO.findByUsername(cleanUser);

        if (!user) {
          logger.auth(`Tentativo di accesso fallito: utente non censito [${cleanUser}]`);
          return done(null, false, { message: 'Identificativo o password non validi' });
        }

        const match = await bcrypt.compare(password || '', user.password_hash);
        if (!match) {
          logger.auth(`Tentativo di accesso fallito: password errata per [${cleanUser}]`);
          return done(null, false, { message: 'Identificativo o password non validi' });
        }

        if (!userDAO.isOperator(user)) {
          logger.auth(`Accesso respinto: utente [${cleanUser}] non ha il ruolo di operatore (${user.ruolo})`);
          return done(null, false, { message: 'Accesso consentito solo agli operatori autorizzati' });
        }

        logger.auth(`Accesso riuscito operatore: ${user.nome} (@${user.username}) [Ruolo: ${user.ruolo}]`);
        return done(null, {
          id_utente: user.id_utente,
          username: user.username,
          nome: user.nome,
          ruolo: user.ruolo,
        });
      } catch (err) {
        logger.error(`Errore durante autenticazione per [${username}]: ${err.message}`);
        return done(err);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id_utente);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userDAO.findById(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
});

function ensureOperator(req, res, next) {
  if (req.isAuthenticated() && req.user && userDAO.isOperator(req.user)) {
    return next();
  }
  if (req.isAuthenticated()) {
    logger.auth(`Richiesta non autorizzata su [${req.originalUrl}] da @${req.user?.username}`);
    return res.status(403).send('Accesso riservato agli operatori accreditati');
  }
  return res.redirect('/login');
}

module.exports = {
  passport,
  ensureOperator,
};
