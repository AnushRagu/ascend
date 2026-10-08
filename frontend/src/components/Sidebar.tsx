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
  Scale,
} from "lucide-react";
import ScenarioBar from "@/components/ScenarioBar";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  pendingCount?: number;
  anomalyCount?: number;
  onRefresh?: () => void;
  killSwitchActive?: boolean;
  onKillSwitchChange?: (active: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  pendingCount = 0,
  anomalyCount = 0,
  onRefresh = () => {},
  killSwitchActive = false,
  onKillSwitchChange = () => {},
}: SidebarProps) {
  return (
    <aside className="w-64 sm:w-72 flex-shrink-0 flex flex-col justify-between p-4 sm:p-5 select-none transition-all border-r border-purple-500/15 dark:border-white/[0.08] bg-white/70 dark:bg-[#060609]/95 backdrop-blur-xl overflow-y-auto">
      <div className="space-y-5">
        {/* Brand Header: Just ASCEND linking to Landing */}
        <a
          href="/landing"
          title="View Ascend Landing Page"
          className="px-2 pt-1 flex items-center space-x-3 group cursor-pointer hover:opacity-90 transition"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-violet-400 flex items-center justify-center shadow-lg shadow-purple-500/30 border border-white/20 flex-shrink-0 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-sm tracking-tighter">▲</span>
          </div>
          <div>
            <div className="font-bold text-base tracking-[0.25em] text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
              <span>ASCEND</span>
              <span className="text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">↗</span>
            </div>
          </div>
        </a>

        {/* Navigation Menu */}
        <nav className="space-y-1.5 text-xs font-semibold">
          {/* 1. Dashboard */}
          <button
            onClick={() => setActiveTab("command_center")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "command_center"
                ? "nav-liquid-btn active font-bold text-slate-900 dark:text-white bg-slate-200/50 dark:bg-white/[0.08]"
                : "text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center space-x-3">
              <LayoutGrid className="w-4 h-4 text-purple-600 dark:text-white/80" />
              <span>Dashboard</span>
            </div>
          </button>

          {/* 1.5. War Room (Multi-Agent Deliberation Chamber) */}
          <button
            onClick={() => setActiveTab("war_room")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "war_room"
                ? "nav-liquid-btn active font-bold text-slate-900 dark:text-white bg-slate-200/50 dark:bg-white/[0.08]"
                : "text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Scale className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <span>War Room</span>
            </div>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Council</span>
            </span>
          </button>

          {/* 2. Decisions / Approval Inbox */}
          <button
            onClick={() => setActiveTab("decision_inbox")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "decision_inbox"
                ? "nav-liquid-btn active font-bold text-slate-900 dark:text-white bg-slate-200/50 dark:bg-white/[0.08]"
                : "text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Zap className="w-4 h-4 text-purple-600 dark:text-white/80" />
              <span>Decisions</span>
            </div>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-sm">
                {pendingCount}
              </span>
            )}
          </button>

          {/* 3. Inventory */}
          <button
            onClick={() => setActiveTab("inventory")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "inventory"
                ? "nav-liquid-btn active font-bold text-slate-900 dark:text-white bg-slate-200/50 dark:bg-white/[0.08]"
                : "text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Package className="w-4 h-4 text-purple-600 dark:text-white/80" />
              <span>Inventory</span>
            </div>
          </button>

          {/* 4. Anomalies */}
          <button
            onClick={() => setActiveTab("anomaly_explorer")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "anomaly_explorer"
                ? "nav-liquid-btn active font-bold text-slate-900 dark:text-white bg-slate-200/50 dark:bg-white/[0.08]"
                : "text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-white/80" />
              <span>Anomalies</span>
            </div>
            {anomalyCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40">
                {anomalyCount}
              </span>
            )}
          </button>

          {/* 5. CRM / Outcomes */}
          <button
            onClick={() => setActiveTab("outcome_tracker")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "outcome_tracker"
                ? "nav-liquid-btn active font-bold text-slate-900 dark:text-white bg-slate-200/50 dark:bg-white/[0.08]"
                : "text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center space-x-3">
              <History className="w-4 h-4 text-purple-600 dark:text-white/80" />
              <span>CRM & Outcomes</span>
            </div>
          </button>

          {/* 6. Guardrails */}
          <button
            onClick={() => setActiveTab("policy_settings")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === "policy_settings"
                ? "nav-liquid-btn active font-bold text-slate-900 dark:text-white bg-slate-200/50 dark:bg-white/[0.08]"
                : "text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-4 h-4 text-purple-600 dark:text-white/80" />
              <span>Guardrails</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </button>
        </nav>

        {/* D2C Telemetry Scenario Simulator & Autonomy Engine in Sidebar below Guardrails */}
        <div className="pt-2">
          <ScenarioBar
            onRefresh={onRefresh}
            killSwitchActive={killSwitchActive}
            onKillSwitchChange={onKillSwitchChange}
          />
        </div>
      </div>

      {/* Bottom Theme Toggle */}
      <div className="pt-4 px-1">
        <div className="liquid-pill-track w-full flex items-center justify-between p-1 bg-slate-200/60 dark:bg-white/[0.05] rounded-xl border border-slate-300/40 dark:border-white/[0.08]">
          <button
            onClick={() => setIsDark(false)}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              !isDark
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light</span>
          </button>
          <button
            onClick={() => setIsDark(true)}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              isDark
                ? "bg-white/10 text-white shadow-sm font-bold border border-white/10"
                : "text-slate-500 hover:text-slate-900"
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
