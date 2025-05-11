import React from "react";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between p-4 bg-[#23263a] border-b border-[#31344d] shadow-sm">
      <input
        type="text"
        placeholder="Search..."
        className="border border-[#31344d] bg-[#191E29] text-white rounded px-3 py-1 w-1/3 focus:ring-2 focus:ring-[#01C38D] focus:outline-none placeholder-gray-400"
      />
      <div className="w-9 h-9 bg-[#01C38D] rounded-full flex items-center justify-center shadow-md">
        <span role="img" aria-label="user" className="text-[#191E29] text-xl font-bold">👤</span>
      </div>
    </header>
  );
} 