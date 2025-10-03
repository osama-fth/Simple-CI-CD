# Simple CI/CD

Repository di esempio per introdurre gradualmente pratiche DevSecOps: containerizzazione, automazione CI, test, qualità e sicurezza su una applicazione Node.js + PostgreSQL.

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
docker compose exec app npm test
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

Richiede che il DB sia inizializzato (gestito automaticamente da Compose tramite mount [db-init/](db-init)).

## 7. Pipeline CI

Workflow: [.github/workflows/simple-ci-cd.yml](.github/workflows/simple-ci-cd.yml)

Trigger:
- push e pull_request su main

Struttura (2 job):

1. lint-and-audit  
   - Checkout  
   - Setup Node 20
   - npm install  
   - npm audit --audit-level=high (fallisce su vulnerabilità >= high)  
   - npm run lint  

2. build-and-test (needs: lint-and-audit)  
   - Checkout  
   - Copia .env.example → .env  
   - docker compose up -d --build (build immagini + avvio servizi: Postgres + app in modalità dev)  
   - Wait DB: loop pg_isready (fino a 30 tentativi)  
   - Wait app: polling HTTP / (fino a 30 tentativi per ottenere 200)  
   - docker compose exec app npm run test (esegue test integrazione dentro il container)  
   - Logs (solo se fallimento)  
   - Cleanup: docker compose down -v  

## 8. Pulizia volumi

Per rimuovere dati persistenti:
```bash
docker compose down -v
```

## 9. Struttura principale

- App: [app/](app)
- Test: [app/test/app.test.js](app/test/app.test.js)
- DAO: [app/models/dao/userDAO.js](app/models/dao/userDAO.js)
- Vista: [app/views/index.ejs](app/views/index.ejs)
- DB init: [db-init/init.sql](db-init/init.sql)
- Dockerfile app: [app/Dockerfile](app/Dockerfile)
- Pipeline: [.github/workflows/simple-ci-cd.yml](.github/workflows/simple-ci-cd.yml)


