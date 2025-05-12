# Monity - Personal Finance Management Application

Monity is a modern web application for managing personal finances, tracking expenses and incomes, and visualizing financial data through interactive charts.

## Features

- 💰 Track expenses and incomes
- 📊 Interactive dashboard with charts and statistics
- 📱 Responsive design for all devices
- 🔐 Secure authentication system
- 📈 Category-based expense tracking
- 💳 Multiple payment methods support
- 📅 Date-based filtering and sorting
- 🔍 Advanced search and filtering capabilities

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Chart.js for data visualization
- React Router for navigation

```bash
git clone https://github.com/leo-stuart/Monity.git

cd monity
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Start the development servers:

In one terminal (backend):
```bash
cd backend
node api.js
```

In another terminal (JSON Server):
```bash
cd backend
json-server --watch db.json --port 3001
```

In a third terminal (frontend):
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- JSON Server: http://localhost:3001

## Project Structure

```
monity/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── assets/        # Static assets
│   │   ├── App.jsx        # Main application component
│   │   └── main.jsx       # Application entry point
│   └── package.json
├── backend/
│   ├── api.js             # Express server
│   ├── db.json            # JSON Server database
│   └── package.json
└── README.md
```

## API Documentation

### Authentication Endpoints

#### POST /login
Authenticate a user and get a JWT token.

Request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "token": "jwt_token_here"
}
```

#### POST /signup
Register a new user.

Request body:
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

### Expense Endpoints

#### GET /list-expenses
Get all expenses.

Response:
```json
{
  "success": true,
  "data": [
    {
      "description": "Groceries",
      "amount": "50.00",
      "category": "Food",
      "date": "01/01/2024"
    }
  ]
}
```

#### POST /add-expense
Add a new expense.

Request body:
```json
{
  "description": "Groceries",
  "amount": "50.00",
  "category": "Food",
  "date": "01/01/2024"
}
```

### Income Endpoints

#### GET /list-incomes
Get all incomes.

#### POST /add-income
Add a new income.

### Category Endpoints

#### GET /categories
Get all categories.

#### POST /categories
Add a new category.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@monity.com or open an issue in the GitHub repository.
