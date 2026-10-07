"use client";

import React from "react";
import {
  LayoutGrid,
  Package,
  Zap,
  AlertTriangle,
  History,
  Shield,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  pendingCount?: number;
  anomalyCount?: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  pendingCount = 0,
  anomalyCount = 0,
}: SidebarProps) {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col justify-between p-5 border-r border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-l-[32px] select-none">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="px-2 pt-2">
          <span className="font-black text-xl tracking-[0.2em] text-slate-900 dark:text-white uppercase">
            ASCEND
          </span>
        </div>

        {/* Cleaned Navigation Menu with Requested Items Removed and Inventory Added */}
        <nav className="space-y-1 text-sm font-medium">
          {/* 1. Dashboard */}
          <button
            onClick={() => setActiveTab("command_center")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "command_center"
                ? "bg-[#f5f3ff] text-[#635bff] font-semibold dark:bg-[#1e1b4b] dark:text-[#a5b4fc]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <LayoutGrid className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </button>

          {/* 2. Decisions / Approval Inbox */}
          <button
            onClick={() => setActiveTab("decision_inbox")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "decision_inbox"
                ? "bg-[#f5f3ff] text-[#635bff] font-semibold dark:bg-[#1e1b4b] dark:text-[#a5b4fc]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Zap className="w-4 h-4" />
              <span>Decisions</span>
            </div>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#635bff] text-white">
                {pendingCount}
              </span>
            )}
          </button>

          {/* 3. Inventory (Added in place of e-commerce, customers, companies, etc.) */}
          <button
            onClick={() => setActiveTab("inventory")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "inventory"
                ? "bg-[#f5f3ff] text-[#635bff] font-semibold dark:bg-[#1e1b4b] dark:text-[#a5b4fc]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Package className="w-4 h-4" />
              <span>Inventory</span>
            </div>
          </button>

          {/* 4. Anomalies */}
          <button
            onClick={() => setActiveTab("anomaly_explorer")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "anomaly_explorer"
                ? "bg-[#f5f3ff] text-[#635bff] font-semibold dark:bg-[#1e1b4b] dark:text-[#a5b4fc]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-4 h-4" />
              <span>Anomalies</span>
            </div>
            {anomalyCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {anomalyCount}
              </span>
            )}
          </button>

          {/* 5. CRM / Outcomes */}
          <button
            onClick={() => setActiveTab("outcome_tracker")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "outcome_tracker"
                ? "bg-[#f5f3ff] text-[#635bff] font-semibold dark:bg-[#1e1b4b] dark:text-[#a5b4fc]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <History className="w-4 h-4" />
              <span>CRM & Outcomes</span>
            </div>
          </button>

          {/* 6. Guardrails */}
          <button
            onClick={() => setActiveTab("policy_settings")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "policy_settings"
                ? "bg-[#f5f3ff] text-[#635bff] font-semibold dark:bg-[#1e1b4b] dark:text-[#a5b4fc]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-4 h-4" />
              <span>Guardrails</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </nav>
      </div>

      {/* Bottom Theme Toggle */}
      <div className="pt-6 px-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className={!isDark ? "text-slate-800 font-bold" : "text-slate-400"}>Light</span>
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-12 h-6 bg-slate-900 rounded-full p-0.5 flex items-center transition cursor-pointer relative"
          >
            <div
              className={`w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 shadow-sm transition-transform duration-300 ${
                isDark ? "translate-x-6 bg-indigo-400 text-white" : "translate-x-0"
              }`}
            >
              {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3 text-slate-900" />}
            </div>
          </button>
          <span className={isDark ? "text-white font-bold" : "text-slate-400"}>Dark</span>
        </div>
      </div>
    </aside>
  );
}
