# Simple CI/CD

Introdurre graduale a pratiche DevSecOps: containerizzazione, automazione CI, test, qualità e sicurezza su una applicazione Node.js + PostgreSQL.

## 1. Architettura

Componenti:
- App Node.js / Express (vista EJS) – codice in [app/](app)
- Database PostgreSQL – init + seed in [db-init/init.sql](db-init/init.sql)
- Orchestrazione locale: [docker-compose.yml](docker-compose.yml)
- Pipeline GitHub Actions: [.github/workflows/simple-ci-cd.yml](.github/workflows/simple-ci-cd.yml)

## 2. Requisiti

Docker + Docker Compose (v2).

Verifica:
```bash
docker --version
```

## 3. Avvio locale

```bash
cp .env.example .env
docker compose up --build
# http://localhost:3000
```

Arresto:
```bash
docker compose down
```

Reset totale (drop volume):
```bash
docker compose down -v
```

Log:
```bash
docker compose logs -f
docker compose logs -f app
docker compose logs -f db
```

Esecuzione test dentro il container già avviato:
```bash
docker compose exec app npm run test
```

## 4. Variabili ambiente

Definite in [.env.example](.env.example) e caricate da [app/db.js](app/db.js).

| Nome | Descrizione | Default |
|------|-------------|---------|
| PORT | Porta app | 3000 |
| POSTGRES_HOST | Host DB (service) | db |
| POSTGRES_PORT | Porta DB | 5432 |
| POSTGRES_USER | Utente | postgres |
| POSTGRES_PASSWORD | Password | postgres |
| POSTGRES_DB | Database | mydb |

## 5. Script NPM (in [app/package.json](app/package.json))

```bash
npm install      # dipendenze
npm run dev      # avvio con nodemon (hot reload)
npm start        # avvio normale
npm run test     # test integrazione: HTTP + query DB
npm run lint     # lint
npm run lint:fix # lint con fix
```

## 6. Test di integrazione

Il test ([app/test/app.test.js](app/test/app.test.js)):
- Avvia l’app su porta effimera (server.listen(0))
- Richiede GET /
- Verifica HTTP 200 e COUNT utenti su tabella users tramite pool Postgres.

Il DB viene inizializzato automaticamente tramite i file in [db-init/](db-init) montati nel servizio PostgreSQL di Compose.

## 7. Pipeline CI

Workflow: [.github/workflows/simple-ci-cd.yml](.github/workflows/simple-ci-cd.yml)

Trigger:
- push e pull_request su main

Concurrency:
- gruppo: ci-${{ github.ref }} (cancella run in corso sullo stesso ref)

Struttura (3 job):

1) lint-and-audit
- Checkout repository
- Setup Node 20 (cache npm su app/package-lock.json)
- npm install
- npm audit --audit-level=high (fallisce su vulnerabilità >= HIGH)
- npm run lint

2) build-and-scan-and-test (needs: lint-and-audit)
- Checkout
- Copia .env.example → .env
- docker compose up -d --build (build immagini + avvio stack)
- Trivy scan immagine app (severità HIGH,CRITICAL → fail)
- Trivy scan postgres:15-alpine (severità HIGH,CRITICAL → fail)
- Attesa readiness DB (pg_isready, max 30 tentativi)
- Attesa readiness app (HTTP 200 su /, max 30 tentativi)
- Esecuzione test: docker compose exec app npm run test
- Logs on failure
- Cleanup: docker compose down -v

3) deploy (simulato)
- Echo descrittivo: “Simulazione deploy: può avvenire su VPS o su un PaaS.”

Note:
- Le scansioni Trivy sono posizionate dopo la build e prima dei test per fallire presto in caso di vulnerabilità gravi.
- Il test gira all’interno del container app già avviato, condividendo le stesse variabili ambiente dell’esecuzione.
