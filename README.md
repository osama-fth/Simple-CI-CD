# 🚀 Simple CI/CD · Node.js + PostgreSQL

![Node](https://img.shields.io/badge/Node-20.x-6DA55F?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Compose-v2-2496ED?logo=docker&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-templates-8A2BE2)
![ESLint](https://img.shields.io/badge/Code%20Style-ESLint-4B32C3?logo=eslint&logoColor=white)
![Trivy](https://img.shields.io/badge/Security-Trivy-red)

Demo DevSecOps “full stack container” pensata da uno studente autodidatta: build Docker, test di integrazione, scansioni sicurezza e pipeline CI su GitHub Actions.

---

## 🧠 TL;DR
- Avvia con Docker Compose, visita http://localhost:3000
- La home mostra utenti letti da PostgreSQL
- CI esegue lint, build, scansioni Trivy e test end-to-end

```bash
cp .env.example .env
docker compose up --build
# http://localhost:3000
```

---

## 🧩 Struttura del progetto
- Backend Express
  - Entrypoint app: [app/app.js](app/app.js)
  - Router: [app/routes/index.js](app/routes/index.js)
  - DAO utenti: [app/models/dao/userDAO.js](app/models/dao/userDAO.js)
  - DB pool (pg): [app/db.js](app/db.js)
  - Views EJS: [app/views/index.ejs](app/views/index.ejs)
  - Statici: [app/public/stylesheets/style.css](app/public/stylesheets/style.css)
  - Script avvio: [app/bin/www](app/bin/www)
  - Script npm: [app/package.json](app/package.json)
- Database
  - Init + seed: [db-init/init.sql](db-init/init.sql)
- Container
  - Compose: [docker-compose.yml](docker-compose.yml)
  - Override dev (sync hot-reload): [docker-compose.override.yml](docker-compose.override.yml)
  - Dockerfile app: [app/Dockerfile](app/Dockerfile)
- CI/CD
  - Workflow: [.github/workflows/simple-ci-cd.yml](.github/workflows/simple-ci-cd.yml)
- Test
  - Integrazione minimal: [app/test/test.js](app/test/test.js)

---

## ⚙️ Requisiti
- Docker Desktop + Docker Compose v2

Verifica rapido:
```bash
docker --version
docker compose version
```

---

## ▶️ Avvio locale
1) Configura variabili
```bash
cp .env.example .env
# modifica .env se serve (host, credenziali, nomi DB)
```

2) Build & run
```bash
docker compose up -d --build
docker compose logs -f app
```

3) Usa l’app
- Web: http://localhost:3000
- Aggiungi/Elimina utenti dalla UI
- Gli utenti sono in Postgres (volume persistente)

4) Stop e clean
```bash
docker compose down
# o reset completo (DB incluso):
docker compose down -v
```

---

## 🔐 Variabili d’ambiente
Gestite via `.env` (caricato da Compose):
- POSTGRES_HOST, POSTGRES_PORT
- POSTGRES_USER, POSTGRES_PASSWORD
- POSTGRES_DB

File di riferimento:
- Esempio: [.env.example](.env.example)

---

## 🧪 Test di integrazione
I test verificano:
- Raggiungibilità dell’app (HTTP 200 su /)
- Accesso al DB (conteggio utenti)

Comando:
```bash
docker compose exec app npm run test
```
Script: [app/test/test.js](app/test/test.js)

---

## 🛡️ Sicurezza
Scansioni immagini con Trivy (HIGH/CRITICAL → fail):
- Immagine app (derivata da [app/Dockerfile](app/Dockerfile))
- Immagine PostgreSQL

Config pipeline: [.github/workflows/simple-ci-cd.yml](.github/workflows/simple-ci-cd.yml)

---

## 🤖 Pipeline CI/CD (GitHub Actions)
Fasi principali:
1) Lint & Audit
   - Lint: `eslint` su [app/](app)
   - Audit npm: severità alta/critica → fail
2) Build, Scan & Test
   - `docker compose up -d --build`
   - Trivy su app e `postgres:15-alpine`
   - Test integrazione: `docker compose exec -T app npm run test`
3) Deploy (simulato)

File: [.github/workflows/simple-ci-cd.yml](.github/workflows/simple-ci-cd.yml)

---


