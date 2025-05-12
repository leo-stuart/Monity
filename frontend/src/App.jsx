import { Routes, Route, useLocation } from 'react-router-dom'
import './App.css'
import AddExpense from './components/AddExpense'
import AddIncome from './components/AddIncome'
import TotalExpenses from './components/TotalExpenses'
import NavBar from './components/NavBar'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Login from './components/Login'
import Signup from './components/Signup'
import AddCategory from './components/AddCategory'
import Settings from './components/Settings'

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    );
  }

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
            <Route path="/categories" element={<AddCategory />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
