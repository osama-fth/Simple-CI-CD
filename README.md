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

File: [.github/workflows/ci.yml](.github/workflows/ci.yml)

Trigger:
- push su main

Struttura a 2 job:

1. Job lint  
   - Checkout  
   - Setup Node 20 + cache npm (scoped a `app/package-lock.json`)  
   - `npm install`  
   - `npm run lint:fix`

2. Job test (needs: lint)  
   - Avvia servizio Postgres 15-alpine con healthcheck  
   - Re-installa dipendenze (i job non condividono workspace/cache runtime, solo cache npm)  
   - Installa client psql  
   - Esegue script schema `db-init/init.sql`  
   - Esegue `npm test` con variabili puntate a `localhost` (service esposto internamente)


