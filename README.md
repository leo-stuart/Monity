# Monity – AI-Powered Personal Finance Tracker

> **Mission:** *Make budgeting delightfully fast, powerfully intelligent, and totally transparent.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![Monity Dashboard](docs/dashboard.gif)

---

## Table of Contents

1.  [Why Monity?](#why-monity)
2.  [Feature Highlights](#feature-highlights)
3.  [Current Architecture](#current-architecture)
4.  [Project Layout](#project-layout)
5.  [Getting Started](#getting-started)
6.  [API Reference](#api-reference)
7.  [Data Model](#data-model)
8.  [Security](#security)
9.  [Testing](#testing)
10. [Configuration](#configuration)
11. [Deployment](#deployment)
12. [Roadmap](#roadmap)
13. [License](#license)
14. [About](#about)

---

## Why Monity?

*   **🧠 Truly Smart**: Goes beyond basic ledgers with a custom-trained AI model that learns your spending habits to automate tedious data entry.
*   **Modern Web Stack**: A robust Node.js + Express API powers a snappy, responsive React/Tailwind UI.
*   **👥 Built for Collaboration**: The only finance tracker you'll find with real-time expense splitting for groups, perfect for trips with friends, roommates, and family.
*   **🌐 Internationalized**: A bilingual interface (English & Portuguese) makes it accessible to a global audience.
*   **Beautiful & Functional UI**: A mobile-first dashboard with interactive charts, data filters, and a gorgeous dark mode.

---

## Feature Highlights

| Category | Highlights |
| :--- | :--- |
| **🤖 AI & Automation** | **Smart Categorization** using a Naive Bayes classifier & NLP • **Continuous learning** from user feedback • **Scheduled daily model retraining** with `node-cron`. |
| **👥 Collaboration** | Real-time **expense splitting** in groups • User search & invitations • Shared expense tracking and settlement. |
| **📈 Analytics** | Monthly balance charts • Category spending breakdowns • Savings goal progress • Admin dashboard with platform-wide statistics. |
| **🔐 Security & Auth** | Secure **JWT authentication** via Supabase • **Role-Based Access Control** (`user`, `premium`, `admin`) • Password hashing. |
| **🌐 UX & Localization** | **English & Portuguese** support • **Responsive, mobile-first** design • Real-time UI updates via Supabase Subscriptions • Skeleton loaders for a smooth experience. |

---

## Current Architecture

Monity is a modern, decoupled web application with a clear separation between the frontend, backend API, and a powerful BaaS (Backend as a Service) layer.

```mermaid
flowchart TD
    subgraph "User Interface"
        A[React SPA / Vite]
    end

    subgraph "Backend API"
        B[Node.js / Express]
    end

    subgraph "AI Subsystem"
        C[Smart Categorization Engine]
        D[AI Scheduler <br/>(node-cron)] --> |triggers| C
    end

    subgraph "Platform (Supabase)"
        E[PostgreSQL Database]
        F[Authentication]
        G[Realtime Subscriptions]
    end

    A <-->|REST API| B
    A <-->|Live Updates| G
    B --> C
    B <-->|CRUD, RPC| E
    B <-->|JWT Validation| F
    B <-->|Broadcasts| G
```

**Layer Break-down**

| Layer | Tech | Responsibilities |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite + Tailwind CSS | Responsive dashboards • Interactive charts & widgets • Client-side routing. |
| **API** | Node.js + Express.js | Business logic • Serves REST endpoints • Integrates AI engine • Manages user roles. |
| **AI Engine**| `natural`, `compromise`, `ml-naivebayes` | NLP processing • ML model training & prediction • Manages feedback loop. |
| **Platform** | Supabase | PostgreSQL data storage • JWT user authentication • Real-time websocket messaging. |

---

## Project Layout

```
Monity/
├── backend/
│   ├── api.js                     # Express server entry point
│   ├── smart-categorization.js    # The AI/ML engine
│   ├── ai-scheduler.js            # node-cron background jobs
│   ├── expense-splitting.js       # Group expense logic
│   ├── package.json               # Backend NPM dependencies
│   └── __tests__/                 # Jest/Supertest API tests
├── frontend/
│   ├── src/
│   │   ├── components/            # UI components
│   │   ├── hooks/                 # Custom React hooks (e.g., useSmartCategorization)
│   │   ├── context/               # AuthContext for global state
│   │   ├── utils/                 # API client, i18n config
│   │   └── App.jsx                # Main router
│   └── package.json               # Frontend NPM dependencies
├── docs/                          # Screenshots, diagrams
├── migration_*.sql                # Supabase database migrations
└── README.md
```

---

## Getting Started

### Prerequisites

| Tool | Minimum Version | Notes |
| :--- | :--- | :--- |
| **Node.js** | 18 | Includes npm |
| **Supabase** | Cloud Account | Used for DB, Auth, and Realtime |

### Local Setup

1.  **Clone & Enter**
    ```bash
    git clone https://github.com/leo-stuart/Monity.git && cd Monity
    ```
2.  **Configure Supabase**
    *   Create a new project on [Supabase](https://supabase.com/).
    *   Navigate to the **SQL Editor**.
    *   Execute the content of `supabase_schema.sql`, followed by all `migration_*.sql` files to set up the database.
3.  **Install Backend Dependencies**
    ```bash
    cd backend && npm install
    ```
4.  **Install Frontend Dependencies**
    ```bash
    cd ../frontend && npm install
    ```
5.  **Set Environment Variables**
    *   In the `backend` directory, copy `.env.example` to `.env` (if available) or create it.
    *   In the `frontend` directory, create a `.env` file.
    *   Fill in the variables as described in the [Configuration](#configuration) section using the API keys from your Supabase project settings.

### Running the Stack

Open **two** separate terminals:

```bash
# Terminal 1 – REST API (Port 3001)
$ cd backend
$ npm start

# Terminal 2 – Vite Dev Server (Port 5173)
$ cd frontend
$ npm start
```

Visit **[http://localhost:5173](http://localhost:5173)** to use the application.

---

## API Reference

Authentication is handled via JWT Bearer tokens obtained from Supabase. The backend API provides over 50 endpoints.

### Selected Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/ai/suggest-category` | Returns AI-powered category suggestions for a transaction description. |
| `POST` | `/ai/feedback` | Submits user feedback to the AI model for continuous learning. |
| `POST` | `/groups` | Creates a new expense-splitting group. |
| `GET` | `/groups/:id`| Fetches details, members, and expenses for a specific group. |
| `POST` | `/shares/:id/settle` | Settles a debt within a group, creating the corresponding transactions. |

---

## Data Model

The data is stored in a relational PostgreSQL database managed by Supabase. Key tables include:

*   `profiles`: Stores user data, extending `auth.users`.
*   `transactions`, `categories`, `budgets`: Core financial tracking tables.
*   `groups`, `group_members`, `group_expenses`: Powers the expense-splitting feature.
*   `categorization_feedback`, `ml_training_data`: Store data for the AI feedback loop and model retraining.

---

## Security

*   **Authentication**: Secure JWT-based authentication handled by Supabase.
*   **Authorization**: Role-Based Access Control (RBAC) is implemented in the backend API to restrict access to sensitive endpoints (e.g., admin stats).
*   **Password Security**: User passwords are not stored in the application database; they are handled and hashed securely by Supabase Auth.

---

## Testing

The project includes a comprehensive test suite for both frontend and backend.

```bash
# Run backend tests
$ cd backend && npm test

# Run frontend tests
$ cd frontend && npm test
```

---

## Configuration

Create `.env` files in both the `backend` and `frontend` directories.

**`backend/.env`**
```env
# The URL of your Supabase project
SUPABASE_URL=https://<your-project-ref>.supabase.co

# The service_role key (secret) for admin-level API access
SUPABASE_KEY=<your-supabase-service-role-key>

# The anon key (public) for user-level API access
SUPABASE_ANON_KEY=<your-supabase-anon-key>

# The port for the backend server
PORT=3001
```

**`frontend/.env`**
```env
# The URL of your Supabase project
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co

# The anon key (public) for the Supabase client
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# The URL of your running backend API
VITE_API_URL=http://localhost:3001
```

---

## Deployment

The frontend and backend are deployed as separate services.

*   **Backend**: Can be deployed to any Node.js hosting provider like Render or Heroku. Remember to set the environment variables in your hosting provider's dashboard.
*   **Frontend**: As a static site, the `frontend/dist` folder (created by `npm run build`) can be deployed to services like Vercel or Netlify.

---

## Roadmap

| Quarter | Milestone |
| :--- | :--- |
| **Q3-2025** | **Plaid Integration**: Connect directly to bank accounts to import transactions automatically. |
| **Q4-2025** | **Mobile PWA**: Enhance the application to be fully installable as a Progressive Web App. |
| **Q1-2026** | **Advanced AI Insights**: Implement financial forecasting and anomaly detection features. |
| **Q2-2026** | **Dockerization**: Provide a `docker-compose.yml` for easy, one-command local setup. |

---

## License

Distributed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## About

Monity is an educational side-project by [Leo Stuart](https://github.com/leo-stuart). Contributions and PRs are welcome!
