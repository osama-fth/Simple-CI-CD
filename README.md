
# Simple CI/CD

Repository di esempio per introdurre gradualmente pratiche DevSecOps: containerizzazione, automazione CI, test, qualità e sicurezza su una piccola applicazione Node.js + PostgreSQL.

## 1. Architettura

Componenti:
- App Node.js / Express (vista EJS) – codice in [app/](app)
- Database PostgreSQL – inizializzazione in [db-init/init.sql](db-init/init.sql)
- Orchestrazione locale con Docker Compose ([docker-compose.yml](docker-compose.yml))
- Pipeline GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml))

## 2. Requisiti

- Docker / Docker Compose

Verifica:
```bash
docker --version
```

## 3. Avvio rapido

```bash
cp .env.example .env
docker compose up --build
# Apri: http://localhost:3000
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

## 4. Variabili ambiente

Definite in [.env.example](.env.example):

| Nome | Descrizione | Default |
|------|-------------|---------|
| PORT | Porta app web | 3000 |
| POSTGRES_HOST | Host DB (service name) | db |
| POSTGRES_PORT | Porta DB | 5432 |
| POSTGRES_USER | Utente DB | postgres |
| POSTGRES_PASSWORD | Password DB | postgres |
| POSTGRES_DB | Nome database | mydb |

Usate dal pool in [app/db.js](app/db.js).

## 5. Comandi NPM (dentro `app/`)

```bash
npm install        # install dipendenze
npm run dev        # avvio con nodemon (hot reload)
npm start          # avvio normale (usa ./bin/www)
npm test           # test integrazione (HTTP + query)
npm run lint       # lint
npm run lint:fix   # lint + fix
```

## 6. Pipeline CI (GitHub Actions)

Workflow: [.github/workflows/ci.yml](.github/workflows/ci.yml)
Fasi:
1. Checkout
2. Setup Node (cache npm)
3. Install dipendenze
4. Lint (auto-fix)
5. Provision DB Postgres come service
6. Inizializza schema (`psql -f ../db-init/init.sql`)
7. Esegue test (env override per usare `localhost`)

## 11. Sicurezza / Qualità (roadmap)

Idee (non ancora implementate):
- Aggiungere scanner Trivy (immagini + fs + repo)
- Aggiungere dependency audit (`npm audit --json`)
- Integrare SonarQube (quality gate + coverage)

## 12. Troubleshooting rapido

| Problema | Causa tipica | Soluzione |
|----------|--------------|-----------|
| Pagina vuota / error 500 | DB non pronto | `docker compose logs db` e attendi health |
| Test fallisce (conn refused) | Host/porta errati in CI | Verifica variabili env step test |
| Modifiche codice non riflettono | Manca bind volume | Usa `docker-compose.override.yml` o `npm run dev` fuori container |
| Dati spariti | Volume rimosso | Evita `docker compose down -v` se non serve |
