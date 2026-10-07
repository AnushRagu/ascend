"use client";

import React from "react";
import { Search, Bell, ChevronDown } from "lucide-react";

interface TopHeaderProps {
  userName?: string;
  dateStr?: string;
}

export default function TopHeader({
  userName = "Alex",
  dateStr = "Monday, March 01, 2026",
}: TopHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-2 px-1">
      {/* Welcome Title & Date */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
          Welcome Back, {userName}
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {dateStr}
        </p>
      </div>

      {/* Right Controls: Search, Notifications, Avatar */}
      <div className="flex items-center space-x-3.5">
        {/* Search Pill */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search here"
            className="w-48 sm:w-64 pl-4 pr-9 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/20 focus:border-[#635bff] transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Notification Bell */}
        <button className="relative w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white shadow-sm transition">
          <Bell className="w-4 h-4" />
          {/* Notification dot */}
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 border-2 border-white dark:border-slate-800" />
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-2 cursor-pointer pl-1">
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-sm overflow-hidden flex-shrink-0"
            style={{ width: "36px", height: "36px", minWidth: "36px", minHeight: "36px" }}
          >
            <div className="w-full h-full rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-700">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Alex Avatar"
                className="w-full h-full object-cover rounded-full"
                style={{ width: "32px", height: "32px", maxWidth: "32px", maxHeight: "32px" }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="font-bold text-[#635bff]">AL</span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </header>
  );
}
