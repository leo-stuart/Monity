import { Routes, Route } from 'react-router-dom'
import './App.css'
import AddExpense from './components/AddExpense'
import AddIncome from './components/AddIncome'
import TotalExpenses from './components/TotalExpenses'
import NavBar from './components/NavBar'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'

function App() {
  return (
    <div className="min-h-screen w-full bg-gray-800 p-4">
      <NavBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/add-income" element={<AddIncome />} />
      </Routes>
    </div>
  )
}

export default App
