import { NavLink, Link, useNavigate } from "react-router-dom";
import { getUser, logout } from "../utils/api";
import { useState, useRef, useEffect } from "react";

export default function Sidebar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  return (
    <aside className="bg-gradient-to-b from-[#191E29] via-[#23263a] to-[#31344d] h-screen w-64 flex flex-col p-6 shadow-lg fixed left-0 top-0 z-0 overflow-y-auto">
      <div className="flex flex-col gap-2 justify-between h-full">
        <div className="mb-10 flex items-center gap-2 mt-4 ">
          <span className="text-3xl font-extrabold text-[#01C38D] tracking-tight">Monity</span>
        </div>
        <nav className="flex flex-col gap-2">
          <NavLink to="/" end className={({ isActive }) => isActive ? "bg-[#01C38D] text-[#191E29] rounded px-3 py-2 font-semibold transition-colors" : "text-white px-3 py-2 rounded hover:bg-[#23263a] transition-colors"}>
            Dashboard
          </NavLink>
          <NavLink to="/transactions" className={({ isActive }) => isActive ? "bg-[#01C38D] text-[#191E29] rounded px-3 py-2 font-semibold transition-colors" : "text-white px-3 py-2 rounded hover:bg-[#23263a] transition-colors"}>
            Transactions
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => isActive ? "bg-[#01C38D] text-[#191E29] rounded px-3 py-2 font-semibold transition-colors" : "text-white px-3 py-2 rounded hover:bg-[#23263a] transition-colors"}>
            Categories
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? "bg-[#01C38D] text-[#191E29] rounded px-3 py-2 font-semibold transition-colors" : "text-white px-3 py-2 rounded hover:bg-[#23263a] transition-colors"}>
            Settings
          </NavLink>
        </nav>
        <div className="relative mt-auto" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-[#31344d] transition-colors"
          >
            <div className="w-9 h-9 bg-[#01C38D] rounded-full flex items-center justify-center shadow-md">
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
                    className="block w-full text-center px-4 py-2 text-red-400 hover:bg-[#31344d] transition-colors"
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
  );
} 