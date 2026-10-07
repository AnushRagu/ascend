"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  fetchKPIs,
  fetchTimeseries,
  fetchInventory,
  fetchDecisions,
  fetchAnomalies,
  fetchPolicies,
  fetchOutcomes,
} from "@/lib/api";
import ScenarioBar from "@/components/ScenarioBar";
import CommandCenter from "@/components/CommandCenter";
import DecisionInbox from "@/components/DecisionInbox";
import AnomalyExplorer from "@/components/AnomalyExplorer";
import OutcomeTracker from "@/components/OutcomeTracker";
import PolicySettings from "@/components/PolicySettings";
import {
  LayoutDashboard,
  Inbox,
  AlertTriangle,
  History,
  Shield,
  Activity,
  Cpu,
  RefreshCw,
} from "lucide-react";

export default function AscendApp() {
  const [activeTab, setActiveTab] = useState<
    "command_center" | "decision_inbox" | "anomaly_explorer" | "outcome_tracker" | "policy_settings"
  >("command_center");

  const [kpis, setKpis] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any>(null);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [killSwitchActive, setKillSwitchActive] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [kRes, tRes, invRes, decRes, anomRes, polRes, outRes] = await Promise.all([
        fetchKPIs().catch(() => null),
        fetchTimeseries().catch(() => []),
        fetchInventory().catch(() => []),
        fetchDecisions().catch(() => []),
        fetchAnomalies().catch(() => []),
        fetchPolicies().catch(() => null),
        fetchOutcomes().catch(() => []),
      ]);

      if (kRes) setKpis(kRes);
      if (tRes) setTimeseries(tRes);
      if (invRes) setInventory(invRes);
      if (decRes) setDecisions(decRes);
      if (anomRes) setAnomalies(anomRes);
      if (polRes) {
        setPolicies(polRes);
        setKillSwitchActive(polRes.global_kill_switch_active);
      }
      if (outRes) setOutcomes(outRes);
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, [loadData]);

  const pendingDecisionsCount = decisions.filter((d) => d.status === "pending_approval").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-3.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-wider text-white">ASCEND</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AUTOPILOT V1
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Autonomous Cross-Channel Intelligence & Decision Engine
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("command_center")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "command_center"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Command Center</span>
            </button>

            <button
              onClick={() => setActiveTab("decision_inbox")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition relative ${
                activeTab === "decision_inbox"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Decision Inbox</span>
              {pendingDecisionsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {pendingDecisionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("anomaly_explorer")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "anomaly_explorer"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Anomalies ({anomalies.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("outcome_tracker")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "outcome_tracker"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Outcome Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab("policy_settings")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "policy_settings"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Policy Guardrails</span>
            </button>
          </nav>

          {/* Engine Status & Refresh */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Engine Online</span>
            </div>

            <button
              onClick={loadData}
              title="Refresh Telemetry"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Top Simulation & Execution Bar */}
        <ScenarioBar
          onRefresh={loadData}
          killSwitchActive={killSwitchActive}
          onKillSwitchChange={(val) => setKillSwitchActive(val)}
        />

        {/* Tab Content */}
        {loading && !kpis ? (
          <div className="glass-panel p-20 text-center rounded-xl border border-slate-800">
            <Activity className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Connecting to ASCEND Intelligence Engine...</p>
          </div>
        ) : (
          <>
            {activeTab === "command_center" && (
              <CommandCenter kpis={kpis} timeseries={timeseries} inventory={inventory} />
            )}

            {activeTab === "decision_inbox" && (
              <DecisionInbox
                decisions={decisions}
                onRefresh={loadData}
                killSwitchActive={killSwitchActive}
              />
            )}

            {activeTab === "anomaly_explorer" && (
              <AnomalyExplorer anomalies={anomalies} />
            )}

            {activeTab === "outcome_tracker" && (
              <OutcomeTracker outcomes={outcomes} />
            )}

            {activeTab === "policy_settings" && (
              <PolicySettings policies={policies} onRefresh={loadData} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400">
        ASCEND — AI-Native Autonomous Advertising Intelligence & Decision Engine · Connected Channels: Meta Ads Graph API, Google Ads API, Amazon Ads API, Shopify Admin API
      </footer>
    </div>
  );
}
