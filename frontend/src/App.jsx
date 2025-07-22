import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import AddExpense from './components/AddExpense'
import AddIncome from './components/AddIncome'
import EnhancedDashboard from './components/EnhancedDashboard'
import ImprovedTransactionList from './components/ImprovedTransactionList'
import Sidebar from './components/Sidebar'
import Login from './components/Login'
import Signup from './components/Signup'
import EnhancedCategories from './components/EnhancedCategories'
import EnhancedSettings from './components/EnhancedSettings'
import AdminDashboard from './components/AdminDashboard'
import EnhancedBudgets from './components/EnhancedBudgets'
import Subscription from './components/Subscription'
import PremiumPage from './components/PremiumPage'
import { useAuth } from './context/AuthContext'
import Spinner from './components/Spinner'
import { useEffect, useState } from 'react'
import UnifiedTopBar from './components/UnifiedTopBar'
import { NotificationProvider } from './components/NotificationSystem'
import { isPremium } from './utils/premium'
import SavingsGoals from './components/SavingsGoals';
import TotalExpenses from './components/TotalExpenses';
import DateRangeFilter from './components/DateRangeFilter';
import LanguageSwitcher from './components/LanguageSwitcher';
import Groups from './components/Groups';
import CreateGroup from './components/CreateGroup';
import GroupPage from './components/GroupPage';
import Savings from './components/Savings';


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

// Premium route component
const PremiumRoute = ({ children }) => {
  const { user, loading, subscriptionTier } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!user || subscriptionTier !== 'premium') {
    return <Navigate to="/subscription" replace />;
  }
  return children;
}

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
    <NotificationProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><EnhancedDashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><ImprovedTransactionList /></MainLayout></ProtectedRoute>} />
      <Route path="/add-expense" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><AddExpense /></MainLayout></ProtectedRoute>} />
      <Route path="/add-income" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><AddIncome /></MainLayout></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><EnhancedCategories /></MainLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><EnhancedSettings /></MainLayout></ProtectedRoute>} />
      <Route path="/budgets" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><EnhancedBudgets /></MainLayout></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><Subscription /></MainLayout></ProtectedRoute>} />
      <Route path="/savings-goals" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><SavingsGoals /></MainLayout></ProtectedRoute>} />
      <Route path="/savings" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><Savings /></MainLayout></ProtectedRoute>} />
      <Route path="/groups" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><Groups /></MainLayout></ProtectedRoute>} />
      <Route path="/groups/create" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><CreateGroup /></MainLayout></ProtectedRoute>} />
      <Route path="/groups/:id" element={<ProtectedRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><GroupPage /></MainLayout></ProtectedRoute>} />

      {/* Premium route */}
      <Route path="/premium" element={<PremiumRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><PremiumPage /></MainLayout></PremiumRoute>} />

      {/* Admin route */}
      <Route path="/admin" element={<AdminRoute><MainLayout isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}><AdminDashboard /></MainLayout></AdminRoute>} />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </NotificationProvider>
  );
}

// Main layout for protected pages
const MainLayout = ({ children, isMobileMenuOpen, setIsMobileMenuOpen }) => (
  <div className="flex flex-col min-h-screen bg-[#191E29]">
    <UnifiedTopBar 
      onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      isMobileMenuOpen={isMobileMenuOpen} 
    />
    <div className="flex flex-1">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#01C38D] text-[#191E29] p-2 z-50 rounded">
        Skip to main content
      </a>
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <main id="main-content" className={`flex-1 p-4 md:p-6 pt-4 md:pt-6 md:ml-64 overflow-y-auto transition-all duration-300 ${isMobileMenuOpen ? 'ml-64 md:ml-0' : 'ml-0'}`} aria-live="polite">
        {children}
      </main>
    </div>
  </div>
);

export default App;
