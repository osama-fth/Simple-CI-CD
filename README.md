# Simple CI/CD

Introduzione graduale a pratiche DevSecOps: containerizzazione, automazione CI, test, qualità e sicurezza su una applicazione Node.js + PostgreSQL.

## 1. Architettura

Componenti:
- App Node.js / Express (vista EJS) – codice in [app/](app)
- Database PostgreSQL – init + seed in [db-init/init.sql](db-init/init.sql)
- Orchestrazione locale: [docker-compose.yml](docker-compose.yml)
- Pipeline GitHub Actions (runner self-hosted): [.github/workflows/simple-ci-cd.yml](.github/workflows/simple-ci-cd.yml)

## 2. Requisiti

- Docker + Docker Compose (v2)
- GitHub Actions runner self-hosted sulla macchina che esegue la pipeline, con accesso al demone Docker

Verifica:
```bash
docker --version
docker compose version
```

Note runner self-hosted (breve):
- macOS: installa Docker Desktop e registra il runner (Settings → Actions → Runners → New self-hosted runner).
- Il runner deve poter eseguire `docker` e `docker compose` senza sudo.
- La porta 3000 deve essere libera per l’app durante il deploy locale.

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

## 7. Pipeline CI (runner self-hosted)

Workflow: [.github/workflows/simple-ci-cd.yml](.github/workflows/simple-ci-cd.yml)

Trigger:
- push e pull_request su main

Runner:
- Tutti i job girano su un GitHub Actions runner self-hosted con Docker e Docker Compose v2.

Concurrency:
- gruppo: ci-${{ github.ref }} (cancella run in corso sullo stesso ref)

Struttura (3 job):

1) lint-and-audit
- Checkout repository
- Setup Node (actions/setup-node)
- npm ci
- npm audit --audit-level=high (fallisce su vulnerabilità >= HIGH)
- npm run lint

2) build-and-scan-and-test (needs: lint-and-audit)
- Checkout
- Copia .env.example → .env
- docker compose up -d --build (build immagini + avvio stack)
- Trivy scan immagine app (severità HIGH,CRITICAL – solo report, non blocca)
- Trivy scan postgres:latest (severità HIGH,CRITICAL – solo report, non blocca)
- Attesa readiness DB (pg_isready, max 30 tentativi)
- Attesa readiness app (HTTP 200 su /, max 30 tentativi)
- Test: docker compose exec app npm run test
- Cleanup: docker compose down -v

3) deploy (locale su runner self-hosted)
- Copia .env.example → .env
- docker compose up -d --build (avvio/aggiornamento stack locale)
- Stampa URL: http://localhost:${PORT}
- Pulisce immagini dangling (docker image prune -f)

Attenzione:
- Il deploy avvia i container sul runner self-hosted e li lascia in esecuzione.
- Verifica porta 3000 libera e volume persistente db-data per Postgres.
