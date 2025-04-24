import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import ListExpenses from './components/ExpenseList'
import AddExpense from './components/AddExpense'
import AddIncome from './components/AddIncome'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <nav>
        <ul>
          <li><Link to="/">Home / List Expenses</Link></li>
          <li><Link to="/add-expense">Add Expense</Link></li>
          <li><Link to="/add-income">Add Income</Link></li>
        </ul>
      </nav>
      <h1>Monity Tracker</h1>
      <Routes>
        <Route path="/" element={<ListExpenses />} />
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/add-income" element={<AddIncome />} />
      </Routes>
    </>
  )
}

export default App
