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
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between p-5 select-none transition-all border-r border-purple-500/15 dark:border-purple-500/20 bg-white/70 dark:bg-[#060609]/95 backdrop-blur-xl">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="px-2 pt-1 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-violet-400 flex items-center justify-center shadow-lg shadow-purple-500/30 border border-white/20">
            <span className="text-white font-black text-sm tracking-tighter">▲</span>
          </div>
          <div>
            <div className="font-black text-base tracking-[0.22em] text-slate-900 dark:text-purple-100 uppercase flex items-center space-x-1.5">
              <span>ASCEND</span>
            </div>
            <div className="text-[10px] font-medium text-slate-400 dark:text-purple-300/60 tracking-wider uppercase flex items-center space-x-1">
              <span className="live-glow-dot mr-0.5 bg-purple-400 shadow-purple-500" />
              <span>Intelligence OS</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5 text-xs font-semibold">
          {/* 1. Dashboard */}
          <button
            onClick={() => setActiveTab("command_center")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "command_center"
                ? "nav-liquid-btn active font-bold"
                : "text-slate-600 dark:text-purple-300/70 hover:text-slate-900 dark:hover:text-white hover:bg-purple-500/05 dark:hover:bg-purple-500/10"
            }`}
          >
            <div className="flex items-center space-x-3">
              <LayoutGrid className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Dashboard</span>
            </div>
          </button>

          {/* 2. Decisions / Approval Inbox */}
          <button
            onClick={() => setActiveTab("decision_inbox")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "decision_inbox"
                ? "nav-liquid-btn active font-bold"
                : "text-slate-600 dark:text-purple-300/70 hover:text-slate-900 dark:hover:text-white hover:bg-purple-500/05 dark:hover:bg-purple-500/10"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Zap className="w-4 h-4 text-purple-500 dark:text-purple-300" />
              <span>Decisions</span>
            </div>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-sm shadow-purple-600/40">
                {pendingCount}
              </span>
            )}
          </button>

          {/* 3. Inventory */}
          <button
            onClick={() => setActiveTab("inventory")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "inventory"
                ? "nav-liquid-btn active font-bold"
                : "text-slate-600 dark:text-purple-300/70 hover:text-slate-900 dark:hover:text-white hover:bg-purple-500/05 dark:hover:bg-purple-500/10"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Package className="w-4 h-4 text-purple-400 dark:text-purple-300" />
              <span>Inventory</span>
            </div>
          </button>

          {/* 4. Anomalies */}
          <button
            onClick={() => setActiveTab("anomaly_explorer")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "anomaly_explorer"
                ? "nav-liquid-btn active font-bold"
                : "text-slate-600 dark:text-purple-300/70 hover:text-slate-900 dark:hover:text-white hover:bg-purple-500/05 dark:hover:bg-purple-500/10"
            }`}
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-4 h-4 text-purple-400 dark:text-purple-300" />
              <span>Anomalies</span>
            </div>
            {anomalyCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {anomalyCount}
              </span>
            )}
          </button>

          {/* 5. CRM / Outcomes */}
          <button
            onClick={() => setActiveTab("outcome_tracker")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "outcome_tracker"
                ? "nav-liquid-btn active font-bold"
                : "text-slate-600 dark:text-purple-300/70 hover:text-slate-900 dark:hover:text-white hover:bg-purple-500/05 dark:hover:bg-purple-500/10"
            }`}
          >
            <div className="flex items-center space-x-3">
              <History className="w-4 h-4 text-purple-400 dark:text-purple-300" />
              <span>CRM & Outcomes</span>
            </div>
          </button>

          {/* 6. Guardrails */}
          <button
            onClick={() => setActiveTab("policy_settings")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "policy_settings"
                ? "nav-liquid-btn active font-bold"
                : "text-slate-600 dark:text-purple-300/70 hover:text-slate-900 dark:hover:text-white hover:bg-purple-500/05 dark:hover:bg-purple-500/10"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-4 h-4 text-purple-400 dark:text-purple-300" />
              <span>Guardrails</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-purple-300/50" />
          </button>
        </nav>
      </div>

      {/* Bottom Theme Toggle */}
      <div className="pt-6 px-1">
        <div className="liquid-pill-track w-full flex items-center justify-between p-1">
          <button
            onClick={() => setIsDark(false)}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              !isDark
                ? "bg-white text-purple-900 shadow-sm font-bold"
                : "text-purple-300/60 hover:text-purple-200"
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-purple-500" />
            <span>Light</span>
          </button>
          <button
            onClick={() => setIsDark(true)}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              isDark
                ? "bg-purple-500/20 text-purple-200 shadow-sm font-bold border border-purple-500/30"
                : "text-purple-400/60 hover:text-purple-700"
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-purple-300" />
            <span>Dark</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
