import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="bg-gradient-to-b from-[#191E29] via-[#23263a] to-[#31344d] min-h-screen w-64 flex flex-col p-6 shadow-lg">
      <div className="mb-10 flex items-center gap-2">
        <span className="text-3xl font-extrabold text-[#01C38D] tracking-tight">Monity</span>
      </div>
      <nav className="flex flex-col gap-2">
        <NavLink to="/" end className={({isActive}) => isActive ? "bg-[#01C38D] text-[#191E29] rounded px-3 py-2 font-semibold transition-colors" : "text-white px-3 py-2 rounded hover:bg-[#23263a] transition-colors"}>
          Dashboard
        </NavLink>
        <NavLink to="/transactions" className={({isActive}) => isActive ? "bg-[#01C38D] text-[#191E29] rounded px-3 py-2 font-semibold transition-colors" : "text-white px-3 py-2 rounded hover:bg-[#23263a] transition-colors"}>
          Transactions
        </NavLink>
        <NavLink to="/categories" className={({isActive}) => isActive ? "bg-[#01C38D] text-[#191E29] rounded px-3 py-2 font-semibold transition-colors" : "text-white px-3 py-2 rounded hover:bg-[#23263a] transition-colors"}>
          Categories
        </NavLink>
        <NavLink to="/settings" className={({isActive}) => isActive ? "bg-[#01C38D] text-[#191E29] rounded px-3 py-2 font-semibold transition-colors" : "text-white px-3 py-2 rounded hover:bg-[#23263a] transition-colors"}>
          Settings
        </NavLink>
      </nav>
    </aside>
  );
} 