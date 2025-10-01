# simple-ci-cd

Un progetto di esempio che mostra una semplice architettura applicativa containerizzata composta da:

- Applicazione **Node.js / Express** (generata con express-generator)
- Database **PostgreSQL** in un container separato
- Orchestrazione locale tramite **Docker Compose**

L'obiettivo del repository è servire come base per introdurre gradualmente pipeline **CI/CD**, analisi della qualità e sicurezza.

---

## 1. Requisiti

Assicurati di avere installato:

- [Docker](https://www.docker.com/) (Engine / Desktop)

Verifica l'installazione:

```bash
docker --version
```

---

## 2. Avvio dei container

Esegui dalla root del progetto (`docker-compose.yml` presente):

Costruzione e avvio (foreground):
```bash
docker compose up --build
```

Arresto e rimozione dei container (mantiene i volumi):
```bash
docker compose down
```

Arresto e rimozione anche dei volumi (reset database):
```bash
docker compose down -v
```

---

## 3. Log dei container

Tutti i log:
```bash
docker compose logs -f
```

Solo applicazione Node.js:
```bash
docker compose logs -f app
```

Solo database Postgres:
```bash
docker compose logs -f db
```

---

## 4. Accesso all'applicazione

Una volta che i container sono attivi, apri il browser su:

```
http://localhost:3000
```

La pagina mostrerà la tabella utenti (se popolata). Il database è esposto sulla porta `5432` (utente: `postgres`, password: `postgres`, db: `mydb`).

Connessione manuale dal container app (esempio psql):
```bash
docker compose exec db psql -U postgres -d mydb
```

---

## 5. Prossimi sviluppi

Nelle prossime iterazioni verranno aggiunti:

- Pipeline **CI/CD** (es. Jenkins) con build, test e deploy
- Analisi qualità e code coverage con **SonarQube**
- Scansione di vulnerabilità immagini e dipendenze con **Trivy**
- Test automatici (unit test e integrazione) per l'app Express
- Miglior gestione configurazioni (variabili ambiente, .env, secrets)
- Linting e formattazione automatica (ESLint / Prettier)

---


