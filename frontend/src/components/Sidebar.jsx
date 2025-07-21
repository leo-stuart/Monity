import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isPremium } from "../utils/premium";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GiPayMoney, GiTakeMyMoney } from "react-icons/gi";
import { FaMoneyBillWave, FaCog, FaChartLine, FaUsers } from "react-icons/fa";

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout, isAdmin, subscriptionTier } = useAuth();
  const premiumUser = subscriptionTier === 'premium';
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <aside className={`fixed top-0 left-0 h-full bg-[#1e2230] text-white w-64 p-4 z-40 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="text-2xl font-bold text-[#01C38D]">Monity</span>
            </Link>

            <nav className="flex flex-col gap-1.5 mb-4">
              <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('sidebar.main_navigation')}</span>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded transition-colors ${isActive
                    ? 'bg-[#01C38D] text-[#191E29] font-semibold'
                    : 'text-white hover:bg-[#31344d]'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>{t('sidebar.dashboard')}</span>
              </NavLink>
              <NavLink
                to="/transactions"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded transition-colors ${isActive
                    ? 'bg-[#01C38D] text-[#191E29] font-semibold'
                    : 'text-white hover:bg-[#31344d]'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>{t('sidebar.transactions')}</span>
              </NavLink>
              <NavLink
                to="/groups"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded transition-colors ${isActive
                    ? 'bg-[#01C38D] text-[#191E29] font-semibold'
                    : 'text-white hover:bg-[#31344d]'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h2a6 6 0 016 6v1H3a2 2 0 01-2-2V5a2 2 0 012-2h6.5L12 2.697V5a2 2 0 01-2 2H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-1a2 2 0 01-2-2h-6.5L12 18.303V16a2 2 0 012-2h2a2 2 0 012 2v1a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-6.5L12 4.354z" />
                </svg>
                <span>{t('sidebar.groups')}</span>
              </NavLink>
              <NavLink
                to="/categories"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded transition-colors ${isActive
                    ? 'bg-[#01C38D] text-[#191E29] font-semibold'
                    : 'text-white hover:bg-[#31344d]'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>{t('sidebar.categories')}</span>
              </NavLink>
              <NavLink
                to="/budgets"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded transition-colors ${isActive
                    ? 'bg-[#01C38D] text-[#191E29] font-semibold'
                    : 'text-white hover:bg-[#31344d]'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5h2m-2 2h2m-2 2h2" />
                </svg>
                <span>{t('sidebar.budgets')}</span>
              </NavLink>

              <NavLink
                to="/savings-goals"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded transition-colors ${isActive
                    ? 'bg-[#01C38D] text-[#191E29] font-semibold'
                    : 'text-white hover:bg-[#31344d]'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
                </svg>
                <span>Savings Goals</span>
              </NavLink>

              {!premiumUser && (
                <NavLink
                  to="/subscription"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded transition-colors ${isActive
                      ? 'bg-yellow-400 text-black font-semibold'
                      : 'text-yellow-400 hover:bg-yellow-500 hover:text-black'
                    }`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L13 12l2.293 2.293a1 1 0 01-1.414 1.414L12 13.414l-2.293 2.293a1 1 0 01-1.414-1.414L10.586 12 8.293 9.707a1 1 0 011.414-1.414L12 10.586l2.293-2.293a1 1 0 011.414 0z" />
                  </svg>
                  <span>{t('sidebar.go_premium')}</span>
                </NavLink>
              )}
              {premiumUser && (
                <NavLink
                  to="/premium"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded transition-colors ${isActive
                      ? 'bg-yellow-400 text-black font-semibold'
                      : 'text-yellow-400 hover:bg-yellow-500 hover:text-black'
                    }`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L13 12l2.293 2.293a1 1 0 01-1.414 1.414L12 13.414l-2.293 2.293a1 1 0 01-1.414-1.414L10.586 12 8.293 9.707a1 1 0 011.414-1.414L12 10.586l2.293-2.293a1 1 0 011.414 0z" />
                  </svg>
                  <span>{t('sidebar.premium')}</span>
                </NavLink>
              )}
            </nav>

            {isAdmin && (
              <nav className="flex flex-col gap-1.5 mb-4">
                <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('sidebar.admin')}</span>
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded transition-colors ${isActive
                      ? 'bg-[#01C38D] text-[#191E29] font-semibold'
                      : 'text-white hover:bg-[#31344d]'
                    }`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{t('sidebar.admin_dashboard')}</span>
                </NavLink>
              </nav>
            )}

            <nav className="flex flex-col gap-1.5">
              <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('sidebar.account')}</span>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded transition-colors ${isActive
                    ? 'bg-[#01C38D] text-[#191E29] font-semibold'
                    : 'text-white hover:bg-[#31344d]'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{t('sidebar.settings')}</span>
              </NavLink>
              <NavLink
                to="/subscription"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded transition-colors ${isActive
                    ? 'bg-[#01C38D] text-[#191E29] font-semibold'
                    : 'text-white hover:bg-[#31344d]'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>{t('sidebar.subscription')}</span>
              </NavLink>
            </nav>
          </div>

          <div className="relative mt-auto" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 w-full p-2 rounded hover:bg-[#31344d] transition-colors group"
            >
              <div className="w-9 h-9 bg-[#01C38D] rounded-full flex items-center justify-center shadow-md group-hover:bg-[#01A071] transition-colors">
                <span className="text-[#191E29] text-xl font-bold">
                  {user?.user_metadata?.name ? user.user_metadata.name.charAt(0).toUpperCase() : '👤'}
                </span>
              </div>
              <span className="text-white font-medium">
                {user?.user_metadata?.name || t('sidebar.user')}
              </span>
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-full bg-[#23263a] border border-[#31344d] rounded-md shadow-lg z-10">
                <div className="p-3 border-b border-[#31344d]">
                  <p className="text-white font-medium">{user?.user_metadata?.name || t('sidebar.user')}</p>
                  <p className="text-gray-400 text-sm truncate">{user?.email || 'user@example.com'}</p>
                </div>
                <ul>
                  <li>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-white hover:bg-[#31344d] transition-colors"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      {t('sidebar.settings')}
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-400 hover:bg-[#31344d] transition-colors"
                    >
                      {t('sidebar.logout')}
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
} 