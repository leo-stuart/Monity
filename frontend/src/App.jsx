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
import AdminDashboard from './components/AdminDashboard'
import { useAuth } from './context/AuthContext'
import Spinner from './components/Spinner'
import { useEffect, useState } from 'react'

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

// Admin route component
const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [useLocation().pathname]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><Dashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><Transactions /></MainLayout></ProtectedRoute>} />
      <Route path="/add-expense" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><AddExpense /></MainLayout></ProtectedRoute>} />
      <Route path="/add-income" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><AddIncome /></MainLayout></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><AddCategory /></MainLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><Settings /></MainLayout></ProtectedRoute>} />

      {/* Admin route */}
      <Route path="/admin" element={<AdminRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><AdminDashboard /></MainLayout></AdminRoute>} />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main layout for protected pages
const MainLayout = ({ children, isMobileMenuOpen, setIsMobileMenuOpen }) => (
  <div className="flex flex-col min-h-screen bg-[#191E29]">
    <div className="flex flex-1">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#01C38D] text-[#191E29] p-2 z-50 rounded">
        Skip to main content
      </a>
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <main id="main-content" className={`flex-1 p-4 md:p-6 pt-4 md:pt-2 md:ml-64 overflow-y-auto transition-all duration-300 ${isMobileMenuOpen ? 'ml-64' : 'ml-0'}`} aria-live="polite">
        {children}
      </main>
    </div>
  </div>
);

export default App;
