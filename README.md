# Monity 💸 – Personal Finance Manager

Monity is a full‑stack **C + Node.js + React** application that lets you record expenses & incomes, crunch the numbers with a blazingly‑fast C engine, and explore the results in a modern web dashboard.

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

## ✨ Key Features

| Category      | Highlights                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| **Tracking**  | Add, edit, delete expenses & incomes; CSV‑style plain‑text storage; category & date tags                  |
| **Analytics** | Monthly balance, category pie, income vs expense trends, “most expensive purchase” widget                 |
| **UX**        | JWT login / signup, mobile‑first layout, real‑time dashboard updates, skeleton loaders & spinners         |
| **Data**      | One‑click JSON export / import (via JSON Server)                                                          |
| **CLI**       | `monity add-expense`, `monity balance`, `monity monthly-history`, cleanup utilities – great for scripting |

Additional goodies:

* 📊 **Interactive Dashboard** – Insight‑rich charts (Category pie, Income vs Expense trends, Monthly history)
* 🔍 **Advanced Search & Filters** – Drill down by category, amount range, date, or free‑text
* 📱 **Responsive Design** – Looks great on phones, tablets, and 4K monitors alike
* 🔄 **Real‑time Updates** – Instant UI refresh after every CRUD action
* 🔒 **Security First** – BCrypt passwords, JWT tokens, robust input validation & CORS policy

---

## 🛠️ Tech Stack

### Frontend

* React 19
* Tailwind CSS (utility‑first styling)
* Chart.js 4 (data visualisation)
* React Router 7
* Axios for API calls

### Backend

* Node.js 18 + Express
* JSON Server (mock DB) – easy local persistence
* JWT for auth, bcrypt for hashing, cors/helmet for security headers

### Core Engine

* C11‑compliant ISO C, compiled with `gcc` or `clang`

---

## 🗂️ Repository Tour

```
Monity/
├── backend/
│   ├── main.c              # CLI entry – parses argv & routes commands
│   ├── expenses.c|h        # Add / list / total / delete expense logic
│   ├── incomes.c|h         # Ditto for incomes
│   ├── cleanup.c|h         # Optional: purge duplicates, trim ledgers
│   ├── shared.c|h          # Date parsing, validations, helpers
│   ├── expenses.txt        # Plain‑text expense ledger (⟨desc;amount;cat;dd/mm/yyyy⟩)
│   ├── incomes.txt         # Plain‑text income ledger
│   ├── api.js              # Express server, JWT auth, ⇄ C binary glue
│   ├── db.json             # Mock DB for JSON Server
│   ├── package.json        # Node dependencies
│   └── monity              # Compiled CLI (created after build)
└── frontend/
    ├── src/components/     # 20+ Tailwind React components
    │   ├── Dashboard.jsx
    │   ├── ExpenseChart.jsx
    │   ├── AddExpense.jsx
    │   ├── AddIncome.jsx
    │   ├── BalanceCard.jsx
    │   ├── …
    ├── App.jsx             # React router layout
    ├── index.html          # Vite entry
    ├── tailwind.config.js  # Theme tokens & plugins
    └── package.json        # React 19, Chart.js 4, React Router 7
```

---

## 🔧 Prerequisites

| Tool            | Version                    |
| --------------- | -------------------------- |
| **Node.js**     | ≥ 18 (tested on v18 & v20) |
| **npm / pnpm**  | bundled with Node          |
| **GCC / clang** | any C11‑capable compiler   |
| **JSON Server** | `npm i -g json-server`     |

---

## 🚀 Quick‑Start (Local Dev)

1. **Clone & enter repo**

   ```bash
   git clone https://github.com/leo-stuart/Monity.git
   cd Monity
   ```

2. **Build the C engine**

   ```bash
   cd backend
   gcc main.c expenses.c incomes.c cleanup.c shared.c -o monity -std=c11 -Wall -Wextra
   # optional: make install PREFIX=/usr/local
   ```

3. **Install & run backend**

   ```bash
   npm install          # installs express, bcrypt, jwt, cors…
   node api.js          # API runs on :3000 by default
   ```

4. **Start JSON Server (mock DB)**

   ```bash
   json-server --watch db.json --port 3001
   ```

5. **Launch the frontend**

   ```bash
   cd ../frontend
   npm install
   npm run dev          # Vite on :5173
   ```

   Open **[http://localhost:5173](http://localhost:5173)** and log in with `demo@monity.dev / demopass` (seeded in `db.json`).

> **TIP:** Copy `.env.example` to `.env` and override `JWT_SECRET`, port numbers, or file paths as needed.

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

*Base URL: `http://localhost:3000`*

| Method | Endpoint                                               | Body                                      | Description                  |
| ------ | ------------------------------------------------------ | ----------------------------------------- | ---------------------------- |
| `POST` | `/login`                                               | `{ email, password }`                     | Returns `{ token }`          |
| `POST` | `/add-expense`                                         | `{ description, amount, category, date }` | Adds expense via C engine    |
| `GET`  | `/list-expenses`                                       | –                                         | Array of expenses (from CLI) |
| `POST` | `/total-expenses`                                      | `{ monthReq }`                            | Float total for given month  |
| `…`    | plus all `/categories`, `/incomes`, etc. in **api.js** |                                           |                              |

All protected routes expect an `Authorization: Bearer <jwt>` header.

---

## 🔒 Security

* BCrypt‑hashed passwords (`10` salt rounds)
* JWT access tokens signed with `JWT_SECRET`
* Helmet‑style CORS policy
* Input validation on both API & CLI layers

---

## 🗓️ Roadmap

* [ ] Replace JSON Server with SQLite or PostgreSQL
* [ ] Docker Compose for one‑command spin‑up
* [ ] Unit tests (Vitest + Supertest + CMocka)
* [ ] i18n (English ↔ Português switch)
* [ ] Dark mode 🌙

---

## 🤝 Contributing

1. Fork ➜ `git switch -c feat/awesome`
2. **Commit in logical chunks** (`eslint` passes, tests green)
3. Push ➜ open PR → fill template
4. Be excellent to each other ✨

---

## 📝 License

Licensed under the **MIT License** (see [`LICENSE`](LICENSE)).

---

## 🙏 Acknowledgements

* **React & Vite** teams – blazing DX
* **Tailwind CSS** – style at the speed of thought
* **Chart.js** – gorgeous charts
* **JSON Server** – zero‑config REST mock
