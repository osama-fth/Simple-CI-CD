# 📚 Biblioteca · Gestionale — Simple CI/CD · Node.js + PostgreSQL

![Node](https://img.shields.io/badge/Node-22.x-6DA55F?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Compose-v2-2496ED?logo=docker&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-templates-8A2BE2)
![ESLint](https://img.shields.io/badge/Code%20Style-ESLint-4B32C3?logo=eslint&logoColor=white)
![Trivy](https://img.shields.io/badge/Security-Trivy-red)

Demo DevSecOps full‑stack: build Docker, test di integrazione, scansioni sicurezza e pipeline CI su GitHub Actions. L’app è un gestionale di biblioteca (Libri, Prestiti, Ritardi).

---

## 🧠 TL;DR
- Avvia con Docker Compose e visita http://localhost:3000 (o la porta in `APP_PORT`)
- La home mostra: Libri disponibili, Prestiti attivi, Prestiti in ritardo
- La CI esegue: lint (ESLint 9 Flat Config), build, scansioni Trivy e test di integrazione

```bash
cp .env.example .env
docker compose up --build
# http://localhost:3000
```

---

## ⚙️ Requisiti
- Docker Desktop + Docker Compose v2

Verifica:
```bash
docker --version
docker compose version
```

---

## ▶️ Avvio locale

1) Configura variabili
```bash
cp .env.example .env
# modifica .env se serve (host, credenziali, nome DB, APP_PORT)
```

2) Build & run
```bash
docker compose up -d --build
docker compose logs -f app
```

3) Usa l’app
- Web: http://localhost:3000 (oppure http://localhost:$APP_PORT)
- Dashboard: Libri disponibili, Prestiti attivi, Prestiti in ritardo
- Creazione prestito e restituzione dalla UI

4) Stop e clean
```bash
docker compose down
# reset completo (DB incluso):
docker compose down -v
```

---

## 🗄️ Schema e viste principali

Tabelle chiave: `libri`, `copie`, `tesserati`, `prestiti`, più anagrafiche (`generi`, `categorie_eta`, `editori`, `autori`, `libri_autori`).  
Viste usate dalla UI:
- `libri_disponibili`: copie prestabili con metadati libro
- `prestiti_attivi`: prestiti non ancora restituiti
- `prestiti_in_ritardo`: prestiti attivi con scadenza superata

Script SQL:
- [db-init/01-tables.sql](db-init/01-tables.sql)
- [db-init/02-views.sql](db-init/02-views.sql)
- [db-init/03-seed.sql](db-init/03-seed.sql)

Nota: gli script in `/docker-entrypoint-initdb.d` vengono eseguiti solo al primo bootstrap del volume dati. Per rieseguirli:
```bash
docker compose down -v
docker compose up --build
```

---

## 🧪 Test di integrazione

I test verificano:
- Raggiungibilità homepage (HTTP 200)
- Query su tabella `libri`
- Query sulla vista `prestiti_attivi`

Esecuzione:
```bash
docker compose exec -T app npm run test
```
File: [app/test/test.js](app/test/test.js)

---

## 🧹 Linting (ESLint 9 — Flat Config)

Configurazione: [app/eslint.config.cjs](app/eslint.config.cjs)

Comandi:
```bash
cd app
npm run lint
npm run lint:fix
```

---

## 🛡️ Sicurezza

Scansioni immagini con Trivy in CI:
- Immagine app: `library-management-system:latest`
- Immagine DB: `postgres:17-alpine`

Workflow: [.github/workflows/simple-ci-cd.yml](.github/workflows/simple-ci-cd.yml)  
La pipeline fallisce su vulnerabilità HIGH/CRITICAL come configurato.

---
