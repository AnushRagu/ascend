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
import Sidebar from "@/components/Sidebar";
import CommandCenter from "@/components/CommandCenter";
import DecisionInbox from "@/components/DecisionInbox";
import AnomalyExplorer from "@/components/AnomalyExplorer";
import OutcomeTracker from "@/components/OutcomeTracker";
import PolicySettings from "@/components/PolicySettings";
import InventoryManager from "@/components/InventoryManager";
import WarRoom from "@/components/WarRoom";

// Default fallback initial state for immediate instantaneous rendering
const defaultInitialKPIs = {
  blended_roas: 3.82,
  blended_mer: 2.83,
  total_ad_spend_daily: 3100.0,
  total_revenue_daily: 9165.2,
  net_contribution_margin: 34416.57,
  net_contribution_margin_pct: 41.4,
  channel_spend_breakdown: { meta: 1700.0, google: 800.0, amazon: 600.0 },
  inventory_critical_count: 1,
  active_campaign_count: 4,
};

export default function AscendApp() {
  const [activeTab, setActiveTab] = useState<
    "command_center" | "war_room" | "decision_inbox" | "inventory" | "anomaly_explorer" | "outcome_tracker" | "policy_settings"
  >("command_center");

  const [isDark, setIsDark] = useState<boolean>(true);
  const [kpis, setKpis] = useState<any>(defaultInitialKPIs);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any>(null);
  const [outcomes, setOutcomes] = useState<any[]>([]);
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
      console.warn("Telemetry refresh warning:", e);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Sync dark mode class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const pendingDecisionsCount = decisions.filter((d) => d.status === "pending_approval").length;
  const topPendingDecision = decisions.find((d) => d.status === "pending_approval") || decisions[0];

  return (
    <div
      className={`ascend-app min-h-screen p-2.5 sm:p-5 transition-colors duration-250 ${
        isDark ? "bg-[#050507]" : "bg-[#f4f3f9]"
      }`}
    >
      {/* Outer Shell with pure black and purple border depth */}
      <div className="netic-outer-shell max-w-[1600px] mx-auto min-h-[94vh] flex flex-col md:flex-row bg-white dark:bg-[#08080c] overflow-hidden border border-purple-500/15 dark:border-white/[0.08] shadow-2xl">
        {/* Left Sidebar with integrated Simulator below Guardrails */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDark={isDark}
          setIsDark={setIsDark}
          pendingCount={pendingDecisionsCount}
          anomalyCount={anomalies.length}
          onRefresh={loadData}
          killSwitchActive={killSwitchActive}
          onKillSwitchChange={(val) => setKillSwitchActive(val)}
        />

        {/* Right Main Dashboard Area */}
        <main className="flex-1 flex flex-col min-w-0 p-5 sm:p-7 space-y-6 overflow-y-auto">
          {/* Tab Views */}
          {activeTab === "command_center" && (
            <CommandCenter
              kpis={kpis}
              timeseries={timeseries}
              inventory={inventory}
              topDecision={topPendingDecision}
              anomalies={anomalies}
              decisions={decisions}
              onRefresh={loadData}
            />
          )}

          {activeTab === "war_room" && (
            <WarRoom onRefresh={loadData} />
          )}

          {activeTab === "decision_inbox" && (
            <DecisionInbox
              decisions={decisions}
              onRefresh={loadData}
              killSwitchActive={killSwitchActive}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryManager
              inventoryData={inventory}
              onRefresh={loadData}
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
        </main>
      </div>
    </div>
  );
}
