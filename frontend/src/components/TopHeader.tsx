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
    <header className="flex flex-wrap items-center justify-between gap-4 py-1 px-1">
      {/* Breadcrumbs & Welcome Title */}
      <div>
        <div className="flex items-center space-x-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-purple-300/60 uppercase mb-1">
          <span>Overview</span>
          <span className="text-purple-400/30">/</span>
          <span className="text-purple-600 dark:text-purple-400 font-bold">Autonomy Center</span>
          <span className="text-purple-400/20">·</span>
          <span className="inline-flex items-center space-x-1.5 text-purple-400 font-mono text-[10px]">
            <span className="live-glow-dot bg-purple-400 shadow-purple-500" />
            <span>Telemetry Online</span>
          </span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-purple-50">
          Welcome Back, {userName}
        </h1>
        <p className="text-xs text-slate-400 dark:text-purple-300/50 font-medium mt-0.5">
          {dateStr}
        </p>
      </div>

      {/* Right Controls: Search, Notifications, Avatar */}
      <div className="flex items-center space-x-3">
        {/* Search Pill */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search campaigns, SKUs, decisions..."
            className="w-56 sm:w-72 pl-4 pr-9 py-2 rounded-xl bg-purple-500/05 dark:bg-purple-950/20 border border-purple-500/15 dark:border-purple-500/20 text-xs text-slate-800 dark:text-purple-100 placeholder-purple-300/40 backdrop-blur-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition font-medium"
          />
          <Search className="w-3.5 h-3.5 text-purple-400/60 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Notification Bell */}
        <button className="relative w-9 h-9 rounded-xl bg-purple-500/05 dark:bg-purple-950/20 border border-purple-500/15 dark:border-purple-500/20 flex items-center justify-center text-slate-600 dark:text-purple-300 hover:text-slate-900 dark:hover:text-white shadow-sm transition backdrop-blur-md">
          <Bell className="w-4 h-4" />
          {/* Notification dot */}
          <span className="w-2 h-2 rounded-full bg-purple-500 absolute top-2 right-2 border-2 border-white dark:border-[#08080c]" />
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-2.5 cursor-pointer pl-1 py-1 pr-2 rounded-xl hover:bg-purple-500/08 transition">
          <div
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-800 via-purple-600 to-violet-400 p-0.5 shadow-md shadow-purple-500/20 overflow-hidden flex-shrink-0"
            style={{ width: "36px", height: "36px", minWidth: "36px", minHeight: "36px" }}
          >
            <div className="w-full h-full rounded-[10px] bg-slate-200 dark:bg-[#0b0b10] overflow-hidden flex items-center justify-center text-xs font-bold text-slate-700">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Alex Avatar"
                className="w-full h-full object-cover rounded-[10px]"
                style={{ width: "32px", height: "32px", maxWidth: "32px", maxHeight: "32px" }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="font-bold text-purple-400">AL</span>
            </div>
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-purple-100 leading-tight">Alex Vance</div>
            <div className="text-[10px] text-purple-400/60 font-medium leading-tight">Admin & Growth</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-purple-400/60" />
        </div>
      </div>
    </header>
  );
}
