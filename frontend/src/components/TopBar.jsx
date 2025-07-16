import { useAuth } from "../context/AuthContext";

export default function TopBar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { user } = useAuth();

  return (
    <header className="md:hidden sticky top-0 bg-[#191E29] p-4 z-30 flex items-center justify-between shadow-md">
      {/* Mobile menu toggle */}
      <button 
        className="text-white"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <span className="text-white font-medium text-sm hidden sm:block">
          {user?.user_metadata?.name || 'User'}
        </span>
        <div className="w-8 h-8 bg-[#01C38D] rounded-full flex items-center justify-center shadow-md">
          <span className="text-[#191E29] text-lg font-bold">
            {user?.user_metadata?.name ? user.user_metadata.name.charAt(0).toUpperCase() : '👤'}
          </span>
        </div>
      </div>
    </header>
  );
} 