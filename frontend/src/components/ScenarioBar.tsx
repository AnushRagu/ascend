"use client";

import React, { useState } from "react";
import {
  triggerScenario,
  reseedSimulator,
  runDecisionCycle,
  toggleKillSwitch,
  fastForwardSimulator
} from "@/lib/api";
import {
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Zap,
  ShieldCheck,
  FastForward,
  CheckCircle2
} from "lucide-react";

interface ScenarioBarProps {
  onRefresh: () => void;
  killSwitchActive: boolean;
  onKillSwitchChange: (active: boolean) => void;
}

export default function ScenarioBar({ onRefresh, killSwitchActive, onKillSwitchChange }: ScenarioBarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cycleLog, setCycleLog] = useState<any[] | null>(null);

  const handleScenario = async (id: string, name: string) => {
    setLoading(id);
    setMessage(null);
    setCycleLog(null);
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
      setCycleLog(res.stages_log || []);
      setMessage(
        `Cycle Complete (${res.cycle_id}): ${res.anomalies_detected} anomalies analyzed. ${res.tier1_auto_executed} auto-executed, ${res.tier2_tier3_pending_approval} routed to approval inbox (${res.tier3_escalated || 0} escalated).`
      );
      onRefresh();
    } catch (e: any) {
      setMessage(`Cycle Error: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleFastForward = async (hours: number) => {
    setLoading(`FF_${hours}`);
    setMessage(null);
    try {
      const res = await fastForwardSimulator(hours);
      setMessage(res.message || `Fast-forwarded telemetry by ${hours} hours. Evaluated ${res.evaluations_run} closed-loop outcomes.`);
      onRefresh();
    } catch (e: any) {
      setMessage(`Fast-forward error: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleReseed = async () => {
    setLoading("SEED");
    setMessage(null);
    setCycleLog(null);
    try {
      await reseedSimulator();
      setMessage("Simulator state reset to deterministic baseline.");
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
    <div className="netic-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-[#f5f3ff] text-[#635bff] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
            D2C Telemetry Scenario Simulator & Autonomy Engine
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Fast-forward simulator button */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-1 text-xs">
            <FastForward className="w-3.5 h-3.5 text-slate-500" />
            <button
              onClick={() => handleFastForward(24)}
              disabled={loading !== null}
              className="text-slate-600 dark:text-slate-300 font-semibold hover:text-[#635bff] px-1"
            >
              +24h
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => handleFastForward(72)}
              disabled={loading !== null}
              className="text-slate-600 dark:text-slate-300 font-semibold hover:text-[#635bff] px-1"
            >
              +72h
            </button>
          </div>

          {/* Global Kill Switch */}
          <button
            onClick={handleToggleKillSwitch}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
              killSwitchActive
                ? "bg-[#ffe4e6] text-[#e11d48] border border-[#fecdd3] animate-pulse"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            {killSwitchActive ? <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
            <span>{killSwitchActive ? "KILL SWITCH: ON" : "KILL SWITCH: OFF"}</span>
          </button>

          {/* Trigger Decision Engine */}
          <button
            onClick={handleRunCycle}
            disabled={loading !== null}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#635bff] hover:bg-[#5248e8] text-white transition shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{loading === "CYCLE" ? "Executing..." : "Run Autonomous Cycle"}</span>
          </button>

          {/* Reset Baseline */}
          <button
            onClick={handleReseed}
            disabled={loading !== null}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Scenario Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <span className="text-slate-400 mr-1 font-medium text-[11px]">Inject Event:</span>

        <button
          onClick={() => handleScenario("STOCKOUT", "Hero SKU Stockout Threat")}
          disabled={loading !== null}
          className="px-3 py-1 rounded-full bg-[#ffedd5] hover:bg-[#fed7aa] text-[#c2410c] font-semibold transition flex items-center space-x-1"
        >
          <AlertTriangle className="w-3 h-3" />
          <span>1. Stockout Danger</span>
        </button>

        <button
          onClick={() => handleScenario("FATIGUE", "Creative Fatigue & CPM Spike")}
          disabled={loading !== null}
          className="px-3 py-1 rounded-full bg-[#ffe4e6] hover:bg-[#fecdd3] text-[#be123c] font-semibold transition"
        >
          2. Meta Fatigue
        </button>

        <button
          onClick={() => handleScenario("ARBITRAGE", "Cross-Channel Arbitrage")}
          disabled={loading !== null}
          className="px-3 py-1 rounded-full bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#15803d] font-semibold transition"
        >
          3. ROAS Arbitrage
        </button>

        <button
          onClick={() => handleScenario("MARGIN_COMPRESSION", "Discount Margin Cannibalization")}
          disabled={loading !== null}
          className="px-3 py-1 rounded-full bg-[#f3e8ff] hover:bg-[#e9d5ff] text-[#7e22ce] font-semibold transition"
        >
          4. Margin Compression
        </button>
      </div>

      {/* Cycle Stage Progress Badges */}
      {cycleLog && cycleLog.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Autonomous Pipeline Lifecycle Execution:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cycleLog.map((s: any, idx: number) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-1" />
                {s.stage}: {s.detail}
              </span>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div className="text-xs px-3.5 py-2 rounded-xl bg-[#f5f3ff] border border-[#e2dcff] text-[#635bff] flex items-center justify-between">
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
