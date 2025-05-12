# Monity 💸 – Personal Finance Manager

[![Build](https://img.shields.io/github/actions/workflow/status/leo-stuart/Monity/ci.yml?label=build)](https://github.com/leo-stuart/Monity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Open Issues](https://img.shields.io/github/issues/leo-stuart/Monity)](https://github.com/leo-stuart/Monity/issues)
[![Last Commit](https://img.shields.io/github/last-commit/leo-stuart/Monity)](https://github.com/leo-stuart/Monity/commits/main)

> **Mission:** *Make budgeting delightfully fast, totally transparent, and hacker‑friendly.*

![Monity Dashboard](docs/assets/dashboard-light.png)

<details open>
<summary>📑 Table of Contents</summary>

* [Key Features](#-key-features)
* [Architecture](#-architecture-at-a-glance)
* [Quick‑Start](#-quick-start-local-dev)
* [CLI Cheatsheet](#-cli-cheatsheet-monity)
* [REST API](#-rest-api-selected-routes)
* [Security](#-security)
* [Roadmap](#-roadmap)
* [Contributing](#-contributing)
* [License](#-license)
* [About Monity](docs/about.md)

</details>

---

## ✨ Key Features

| Category      | Highlights                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| **Tracking**  | Add, edit, delete expenses & incomes; CSV‑style plain‑text storage; category & date tags                  |
| **Analytics** | Monthly balance, category pie, income vs expense trends, “most expensive purchase” widget                 |
| **UX**        | JWT login / signup, mobile‑first layout, real‑time dashboard updates, skeleton loaders & spinners         |
| **Data**      | One‑click JSON export / import (via JSON Server)                                                          |
| **CLI**       | `monity add-expense`, `monity balance`, `monity monthly-history`, cleanup utilities – great for scripting |

---

## 🏗️ Architecture at a Glance

| Layer           | Tech                               | Purpose                                                                                                                                 |
| --------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Core Engine** | ISO‑C (CLI)                        | High‑performance parsing, validation, math (totals, balances, history). Persists to plain‑text ledgers (`expenses.txt`, `incomes.txt`). |
| **API**         | Node.js + Express                  | Wraps the C binary with REST endpoints and JWT auth; proxies CRUD calls to a local JSON Server for persistence.                         |
| **Frontend**    | React 19 + Tailwind CSS + Chart.js | Responsive SPA with dashboards, charts, search & filters.                                                                               |

```
                    ┌──────────────┐
   CLI  ➜  JSON     │  Text files  │
arguments           └──────────────┘
       ▲                   ▲
       │       spawn()     │
       │                   │
┌──────┴──────┐   HTTP   ┌─┴────────────┐
│   monity    │◀────────│  Node / API  │
│  (C binary) │────────▶│  server      │
└─────────────┘          └─┬────────────┘
                           │ REST
                           ▼
                    React / Tailwind SPA
```

---

## 🚀 Quick‑Start (Local Dev)

1. **Clone the repo & enter**

   ```bash
   git clone https://github.com/leo-stuart/Monity.git
   cd Monity
   ```

2. **Build the C engine & install backend deps**

   ```bash
   cd backend
   gcc main.c expenses.c incomes.c cleanup.c shared.c -o monity -std=c11 -Wall -Wextra
   npm install          # installs express, bcrypt, jwt, cors…
   ```

3. **Run the services (three terminals)**

   ```bash
   # Terminal 1 – REST API (port 3000)
   node api.js

   # Terminal 2 – JSON Server mock DB (port 3001)
   json-server --watch db.json --port 3001

   # Terminal 3 – Frontend (Vite on 5173)
   cd ../frontend && npm install && npm run dev
   ```

   Open **[http://localhost:5173](http://localhost:5173)** and log in with `demo@monity.dev / demopass` (seeded in `db.json`).

> **TIP:** Copy `.env.example` to `.env` to customise ports, JWT secret, or file paths.

---

## 🖥️ CLI Cheatsheet (`./monity`)

```bash
# Add a €34.90 grocery expense (01 May 2025)
./monity add-expense "Groceries" 34.90 Food 01/05/2025

# List last 20 incomes
./monity list-incomes

# Show running balance
./monity balance

# Monthly history for April 2025
./monity monthly-history 04/2025

# Delete expense by line number
./monity delete-expense 42

# Remove duplicate lines in ledgers
./monity cleanup
```

---

## 🌐 REST API (selected routes)

A complete OpenAPI spec lives in **`docs/api.yaml`** (import into Postman or Swagger UI). Below is a taste:

| Method | Endpoint          | Body                                      | Description                  |
| ------ | ----------------- | ----------------------------------------- | ---------------------------- |
| `POST` | `/login`          | `{ email, password }`                     | returns `{ token }`          |
| `POST` | `/add-expense`    | `{ description, amount, category, date }` | Adds expense via C engine    |
| `GET`  | `/list-expenses`  | –                                         | Array of expenses (from CLI) |
| `POST` | `/total-expenses` | `{ monthReq }`                            | Float total for given month  |

*All protected routes require `Authorization: Bearer <jwt>`. See the full docs for `/categories`, `/incomes`, etc.*

---

## 🔒 Security

* BCrypt‑hashed passwords (`10` salt rounds)
* JWT access tokens signed with `JWT_SECRET`
* Helmet‑style CORS policy
* Input validation on both API & CLI layers

---

## 🗓️ Roadmap

| Quarter     | Milestone                                                               |
| ----------- | ----------------------------------------------------------------------- |
| **Q3‑2025** | SQLite / PostgreSQL backend option                                      |
| **Q4‑2025** | Docker Compose – one‑click spin‑up                                      |
| **Q1‑2026** | Mobile PWA & native macOS status menu                                   |
| **Q2‑2026** | Plugin ecosystem (currency conversion, bank integrations, custom calcs) |

*Project tracking lives in **GitHub Projects > Roadmap**.*

---

## 🤝 Contributing

1. Fork ➜ `git switch -c feat/awesome`
2. **Commit in logical chunks** (`eslint` passes, tests green)
3. Push ➜ open PR → fill template
4. Be excellent to each other ✨

**Code of Conduct:** We pledge to foster an open, welcoming environment. Be kind, be constructive, and help each other grow.

---

## 📝 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

## 📚 About Monity

Curious about the philosophy, principles, and origin story? Check out **[About Monity](docs/about.md)**.
