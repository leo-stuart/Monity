# Monity Backend

This is the Node.js backend for the Monity expense tracking application. It replaces the original C implementation with a pure JavaScript solution that works with JSON Server for data persistence.

## Features

- User authentication with JWT
- User-specific transactions
- Support for expenses, incomes, and savings transactions
- Category management
- Monthly balance calculation
- Data persistence via JSON Server

## Setup

1. Make sure JSON Server is running on port 3001:
   ```
   json-server --watch db.json --port 3001
   ```

2. Install backend dependencies:
   ```
   npm install
   ```

3. Start the backend server:
   ```
   npm start
   ```

The server will run on http://localhost:3000 and communicate with JSON Server on port 3001.

## Data Migration

On the first run, the backend will automatically import existing transactions from the original C implementation (expenses.txt and incomes.txt files) if they exist. These will be assigned to the admin user by default.

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /signup` - User registration
- `POST /change-password` - Change user password

### Categories
- `GET /categories` - Get all categories
- `POST /categories` - Create a new category
- `DELETE /categories/:id` - Delete a category

### Transaction Types
- `GET /transaction-types` - Get all transaction types

### Transactions
- `POST /add-expense` - Add a new expense
- `POST /add-income` - Add a new income
- `POST /add-savings` - Add a new savings transaction
- `GET /transactions` - Get all transactions for the authenticated user
- `GET /transactions/month/:month` - Get transactions for a specific month
- `GET /transactions/category/:category` - Get transactions for a specific category
- `DELETE /transactions/:id` - Delete a transaction

### Analysis
- `GET /balance/:month` - Get monthly balance
- `GET /months` - Get all months with transactions

## Database Structure

The data is stored in JSON Server's `db.json` file with the following structure:

- `categories`: List of available categories
- `usuarios`: Registered users
- `transactionTypes`: Types of transactions (Expense, Income, Savings)
- `transactions`: User transactions

Each transaction is associated with a specific user via their user ID. 