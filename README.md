# Simple CI/CD 🚀

<p align="center">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Engine-2496ED?logo=docker&logoColor=white">
  <img alt="Docker Compose" src="https://img.shields.io/badge/Compose-v2-2496ED?logo=docker&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-7.x-47A248?logo=mongodb&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/Node-20.x-339933?logo=node.js&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white">
  <img alt="ESLint" src="https://img.shields.io/badge/Code%20Style-ESLint-4B32C3?logo=eslint&logoColor=white">
  <img alt="Trivy" src="https://img.shields.io/badge/Security-Trivy-1904DA?logo=aqua&logoColor=white">
</p>


Introduzione graduale a pratiche DevSecOps: containerizzazione, automazione CI, test, qualità e sicurezza su una applicazione Node.js + MongoDB.

## 🧱 Architettura

Componenti:
- 🖥️ App Node.js / Express (vista EJS) – codice in [app/](app)
- 🗄️ Database MongoDB – init + seed in [db-init/init.js](db-init/init.js)
- 🐳 Orchestrazione locale: [docker-compose.yml](docker-compose.yml)
- ⚙️ Pipeline GitHub Actions: [.github/workflows/simple-ci-cd.yml](.github/workflows/simple-ci-cd.yml)

## 🧰 Requisiti

- Docker + Docker Compose (v2)

Verifica:
```bash
docker --version
```

## ▶️ Avvio rapido

```bash
cp .env.example .env
docker compose build --no-cache
docker compose up
# apri: http://localhost:3000
```

Arresto:
```bash
docker compose down
```

Reset totale (drop volumi/dati):
```bash
docker compose down -v
```

Log:
```bash
docker compose logs -f
docker compose logs -f app
docker compose logs -f db
```

Esecuzione test dentro il container:
```bash
docker compose exec app npm run test
```

## 🔧 Variabili ambiente

Definite in [.env.example](.env.example) e lette da [app/db.js](app/db.js).

| Nome           | Descrizione              | Default/Esempio |
|----------------|--------------------------|-----------------|
| PORT           | Porta app                | 3000            |
| MONGO_HOST     | Host MongoDB             | db              |
| MONGO_PORT     | Porta MongoDB            | 27017           |
| MONGO_DB       | Nome database            | mydb            |
| MONGO_USER     | Utente (auth)            | root            |
| MONGO_PASSWORD | Password (auth)          | root            |

## 📜 Script NPM (in [app/package.json](app/package.json))

```bash
npm install      # dipendenze
npm run dev      # avvio con nodemon (hot reload)
npm start        # avvio normale
npm run test     # test integrazione: HTTP + query su MongoDB
npm run lint     # lint
npm run lint:fix # lint con fix
```

## 🧪 Test di integrazione

[app/test/app.test.js](app/test/app.test.js):
- Avvia l’app su porta effimera
- GET / → atteso 200
- Conta documenti in collection users (MongoDB)

Il DB viene inizializzato con [db-init/init.js](db-init/init.js).

## 🛠️ Pipeline CI (sintesi)

Workflow: [.github/workflows/simple-ci-cd.yml](.github/workflows/simple-ci-cd.yml)
- 🧹 Lint + 🔒 npm audit
- 🐳 Build/Up stack con Docker Compose
- 🛡️ Scansione immagini con Trivy (app, mongo:7)
- ⏱️ Attesa readiness DB/app
- 🧪 Esecuzione test nel container app
- 🧼 Cleanup finale

## 📁 Struttura

- App: [app/](app)
- Vista: [app/views/index.ejs](app/views/index.ejs)
- Router: [app/routes/index.js](app/routes/index.js)
- DAO: [app/models/dao/userDAO.js](app/models/dao/userDAO.js)
- DB init: [db-init/init.js](db-init/init.js)
- Config Mongo: [db-init/mongod.conf](db-init/mongod.conf)
- Dockerfile app: [app/Dockerfile](app/Dockerfile)
- CI pipeline: [.github/workflows/simple-ci-cd.yml](.github/workflows/simple-ci-cd.yml)
