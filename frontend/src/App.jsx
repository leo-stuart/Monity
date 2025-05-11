import { Routes, Route } from 'react-router-dom'
import './App.css'
import AddExpense from './components/AddExpense'
import AddIncome from './components/AddIncome'
import TotalExpenses from './components/TotalExpenses'
import NavBar from './components/NavBar'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'

function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/add-expense" element={<AddExpense />} />
            <Route path="/add-income" element={<AddIncome />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
