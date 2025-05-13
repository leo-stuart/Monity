import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUser, logout } from "../utils/api";

export default function TopBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = getUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
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
    <header className="flex items-center justify-between p-4 bg-[#23263a] border-b border-[#31344d] shadow-sm">
      <input
        type="text"
        placeholder="Search..."
        className="border border-[#31344d] bg-[#191E29] text-white rounded px-3 py-1 w-1/3 focus:ring-2 focus:ring-[#01C38D] focus:outline-none placeholder-gray-400"
      />
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-9 h-9 bg-[#01C38D] rounded-full flex items-center justify-center shadow-md hover:bg-[#01A071] transition-colors"
        >
          <span className="text-[#191E29] text-xl font-bold">
            {user?.nome ? user.nome.charAt(0).toUpperCase() : '👤'}
          </span>
        </button>
        
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-[#23263a] border border-[#31344d] rounded-md shadow-lg z-10">
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
    </header>
  );
} 