"use client";

import React, { useState } from "react";
import { triggerScenario, reseedSimulator, runDecisionCycle, toggleKillSwitch } from "@/lib/api";
import { Play, RotateCcw, AlertTriangle, ShieldAlert, Sparkles, Zap, ShieldCheck } from "lucide-react";

interface ScenarioBarProps {
  onRefresh: () => void;
  killSwitchActive: boolean;
  onKillSwitchChange: (active: boolean) => void;
}

export default function ScenarioBar({ onRefresh, killSwitchActive, onKillSwitchChange }: ScenarioBarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleScenario = async (id: string, name: string) => {
    setLoading(id);
    setMessage(null);
    try {
      const res = await triggerScenario(id);
      setMessage(`Triggered ${name}: ${res.impact}`);
      onRefresh();
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleRunCycle = async () => {
    setLoading("CYCLE");
    setMessage(null);
    try {
      const res = await runDecisionCycle();
      setMessage(
        `Cycle Complete: ${res.anomalies_detected} anomalies analyzed. ${res.tier1_auto_executed} auto-executed, ${res.tier2_tier3_pending_approval} routed to approval inbox.`
      );
      onRefresh();
    } catch (e: any) {
      setMessage(`Cycle Error: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleReseed = async () => {
    setLoading("SEED");
    setMessage(null);
    try {
      await reseedSimulator();
      setMessage("Simulator state reset to baseline.");
      onRefresh();
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleToggleKillSwitch = async () => {
    try {
      const nextState = !killSwitchActive;
      await toggleKillSwitch(nextState);
      onKillSwitchChange(nextState);
      setMessage(`Global Kill Switch is now ${nextState ? "ENGAGED (All mutations halted)" : "DISENGAGED (Normal autonomy active)"}`);
      onRefresh();
    } catch (e: any) {
      setMessage(`Kill switch error: ${e.message}`);
    }
  };

  return (
    <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-semibold tracking-wide uppercase text-slate-300">
            D2C Multi-Channel Scenarios & Execution Controls
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Global Kill Switch */}
          <button
            onClick={handleToggleKillSwitch}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              killSwitchActive
                ? "bg-rose-500/20 text-rose-300 border border-rose-500 hover:bg-rose-500/30 animate-pulse"
                : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600"
            }`}
          >
            {killSwitchActive ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
            <span>{killSwitchActive ? "GLOBAL KILL SWITCH: ON" : "KILL SWITCH: OFF"}</span>
          </button>

          {/* Trigger Decision Engine */}
          <button
            onClick={handleRunCycle}
            disabled={loading !== null}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30"
          >
            <Zap className="w-4 h-4" />
            <span>{loading === "CYCLE" ? "Reasoning..." : "Run Autonomous Cycle"}</span>
          </button>

          {/* Reset Baseline */}
          <button
            onClick={handleReseed}
            disabled={loading !== null}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Scenario Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
        <span className="text-xs text-slate-400 mr-1 font-medium">Inject Event:</span>

        <button
          onClick={() => handleScenario("STOCKOUT", "Hero SKU Stockout Threat")}
          disabled={loading !== null}
          className="px-2.5 py-1 text-xs rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center space-x-1"
        >
          <AlertTriangle className="w-3 h-3" />
          <span>1. Hero SKU Stockout Danger</span>
        </button>

        <button
          onClick={() => handleScenario("FATIGUE", "Creative Fatigue & CPM Spike")}
          disabled={loading !== null}
          className="px-2.5 py-1 text-xs rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
        >
          2. Meta Creative Burnout
        </button>

        <button
          onClick={() => handleScenario("ARBITRAGE", "Cross-Channel Arbitrage")}
          disabled={loading !== null}
          className="px-2.5 py-1 text-xs rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition"
        >
          3. Amazon/Google ROAS Surge
        </button>

        <button
          onClick={() => handleScenario("MARGIN_COMPRESSION", "Discount Margin Cannibalization")}
          disabled={loading !== null}
          className="px-2.5 py-1 text-xs rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition"
        >
          4. Margin Compression Alert
        </button>
      </div>

      {message && (
        <div className="text-xs px-3 py-2 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-200">
          {message}
        </div>
      )}
    </div>
  );
}
