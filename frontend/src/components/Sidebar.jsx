import { NavLink, Link, useNavigate } from "react-router-dom";
import { getUser, logout } from "../utils/api";
import { useState, useRef, useEffect } from "react";

export default function Sidebar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = getUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
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

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile menu toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-20 bg-[#01C38D] text-[#191E29] p-2 rounded-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <aside 
        className={`bg-gradient-to-b from-[#191E29] via-[#23263a] to-[#31344d] h-screen md:w-64 flex flex-col p-6 shadow-lg fixed top-0 left-0 z-10 overflow-y-auto transition-all duration-300 ${isMobileMenuOpen ? 'w-64' : 'w-0 md:w-64'}`}
      >
        <div className="flex flex-col gap-2 justify-between h-full">
          <div>
            <div className="mb-6 flex items-center gap-2 mt-4">
              <span className="text-3xl font-extrabold text-[#01C38D] tracking-tight">Monity</span>
            </div>

            <div className="mb-2">
              <span className="text-xs uppercase text-gray-500 font-semibold tracking-wider ml-3">Main Navigation</span>
            </div>
            <nav className="flex flex-col gap-1.5 mb-6">
              <NavLink 
                to="/" 
                end 
                className={({isActive}) => 
                  `flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                    isActive 
                      ? 'bg-[#01C38D] text-[#191E29] font-semibold' 
                      : 'text-white hover:bg-[#31344d]'
                  }`
                }
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </NavLink>
              <NavLink 
                to="/transactions" 
                className={({isActive}) => 
                  `flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                    isActive 
                      ? 'bg-[#01C38D] text-[#191E29] font-semibold' 
                      : 'text-white hover:bg-[#31344d]'
                  }`
                }
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Transactions</span>
              </NavLink>
              <NavLink 
                to="/categories" 
                className={({isActive}) => 
                  `flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                    isActive 
                      ? 'bg-[#01C38D] text-[#191E29] font-semibold' 
                      : 'text-white hover:bg-[#31344d]'
                  }`
                }
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Categories</span>
              </NavLink>
            </nav>

            <div className="mb-2">
              <span className="text-xs uppercase text-gray-500 font-semibold tracking-wider ml-3">Account</span>
            </div>
            <nav className="flex flex-col gap-1.5">
              <NavLink 
                to="/settings" 
                className={({isActive}) => 
                  `flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                    isActive 
                      ? 'bg-[#01C38D] text-[#191E29] font-semibold' 
                      : 'text-white hover:bg-[#31344d]'
                  }`
                }
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
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
                  {user?.nome ? user.nome.charAt(0).toUpperCase() : '👤'}
                </span>
              </div>
              <span className="text-white font-medium">
                {user?.nome || 'User'}
              </span>
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-full bg-[#23263a] border border-[#31344d] rounded-md shadow-lg z-10">
                <div className="p-3 border-b border-[#31344d]">
                  <p className="text-white font-medium">{user?.nome || 'User'}</p>
                  <p className="text-gray-400 text-sm truncate">{user?.email || 'user@example.com'}</p>
                </div>
                <ul>
                  <li>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-white hover:bg-[#31344d] transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-400 hover:bg-[#31344d] transition-colors"
                    >
                      Logout
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
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
} 