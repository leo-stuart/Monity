import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import { isAuthenticated } from './utils/api'
import { useEffect } from 'react'

// Protected route component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  // Check authentication on initial load
  useEffect(() => {
    if (!isAuthPage && !isAuthenticated()) {
      // Redirect to login if not authenticated and not on an auth page
      window.location.href = '/login';
    }
  }, [isAuthPage]);

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
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            } />
            <Route path="/add-expense" element={
              <ProtectedRoute>
                <AddExpense />
              </ProtectedRoute>
            } />
            <Route path="/add-income" element={
              <ProtectedRoute>
                <AddIncome />
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute>
                <AddCategory />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
