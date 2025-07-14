import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import AddExpense from './components/AddExpense'
import AddIncome from './components/AddIncome'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Sidebar from './components/Sidebar'
import Login from './components/Login'
import Signup from './components/Signup'
import AddCategory from './components/AddCategory'
import Settings from './components/Settings'
import { useAuth } from './context/AuthContext'
import Spinner from './components/Spinner'
import { useEffect } from 'react'

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [useLocation().pathname]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><MainLayout><Transactions /></MainLayout></ProtectedRoute>} />
      <Route path="/add-expense" element={<ProtectedRoute><MainLayout><AddExpense /></MainLayout></ProtectedRoute>} />
      <Route path="/add-income" element={<ProtectedRoute><MainLayout><AddIncome /></MainLayout></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><MainLayout><AddCategory /></MainLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main layout for protected pages
const MainLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-[#191E29]">
    <div className="flex flex-1">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#01C38D] text-[#191E29] p-2 z-50 rounded">
        Skip to main content
      </a>
      <Sidebar />
      <main id="main-content" className="flex-1 p-4 md:p-6 pt-4 md:pt-2 ml-0 md:ml-64 overflow-y-auto transition-all duration-300" aria-live="polite">
        {children}
      </main>
    </div>
  </div>
);

export default App;
