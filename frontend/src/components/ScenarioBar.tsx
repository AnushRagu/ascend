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
    <div className="liquid-glass-card p-4 space-y-3.5 border border-purple-500/15">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-inner">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-black tracking-wider uppercase text-slate-800 dark:text-purple-100">
              D2C Telemetry Scenario Simulator & Autonomy Engine
            </span>
            <div className="text-[10px] text-slate-400 dark:text-purple-300/50">Deterministic sandbox for stress testing autonomy policies</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Fast-forward simulator segmented pills */}
          <div className="liquid-pill-track flex items-center">
            <div className="flex items-center px-1.5 text-purple-400/60">
              <FastForward className="w-3.5 h-3.5" />
            </div>
            <button
              onClick={() => handleFastForward(24)}
              disabled={loading !== null}
              className="liquid-pill-btn hover:text-purple-300"
            >
              {loading === "FF_24" ? "..." : "+24h"}
            </button>
            <button
              onClick={() => handleFastForward(72)}
              disabled={loading !== null}
              className="liquid-pill-btn hover:text-purple-300"
            >
              {loading === "FF_72" ? "..." : "+72h"}
            </button>
          </div>

          {/* Global Kill Switch */}
          <button
            onClick={handleToggleKillSwitch}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition interactive-button ${
              killSwitchActive
                ? "bg-purple-950 text-purple-200 border border-purple-500/60 shadow-lg shadow-purple-500/30 animate-pulse"
                : "bg-purple-500/05 dark:bg-[#07070a] text-slate-600 dark:text-purple-300/80 border border-purple-500/15 hover:bg-purple-500/10"
            }`}
          >
            {killSwitchActive ? <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />}
            <span>{killSwitchActive ? "KILL SWITCH: ENGAGED" : "KILL SWITCH: OFF"}</span>
          </button>

          {/* Trigger Decision Engine */}
          <button
            onClick={handleRunCycle}
            disabled={loading !== null}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold liquid-btn-primary transition disabled:opacity-60 interactive-button"
          >
            <Zap className="w-3.5 h-3.5 text-purple-200" />
            <span>{loading === "CYCLE" ? "Executing cycle..." : "Run Autonomous Cycle"}</span>
          </button>

          {/* Reset Baseline */}
          <button
            onClick={handleReseed}
            disabled={loading !== null}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/05 dark:bg-[#07070a] border border-purple-500/15 hover:bg-purple-500/10 text-slate-600 dark:text-purple-300/80 transition interactive-button"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Scenario Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-purple-500/15 text-xs">
        <span className="text-purple-400/80 mr-1 font-semibold text-[11px] tracking-wider uppercase">Inject Event:</span>

        <button
          onClick={() => handleScenario("STOCKOUT", "Hero SKU Stockout Threat")}
          disabled={loading !== null}
          className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-bold transition flex items-center space-x-1 interactive-button"
        >
          <AlertTriangle className="w-3 h-3 text-purple-400" />
          <span>1. Stockout Danger</span>
        </button>

        <button
          onClick={() => handleScenario("FATIGUE", "Creative Fatigue & CPM Spike")}
          disabled={loading !== null}
          className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-bold transition interactive-button"
        >
          2. Meta Fatigue
        </button>

        <button
          onClick={() => handleScenario("ARBITRAGE", "Cross-Channel Arbitrage")}
          disabled={loading !== null}
          className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-bold transition interactive-button"
        >
          3. ROAS Arbitrage
        </button>

        <button
          onClick={() => handleScenario("MARGIN_COMPRESSION", "Discount Margin Cannibalization")}
          disabled={loading !== null}
          className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-bold transition interactive-button"
        >
          4. Margin Compression
        </button>
      </div>

      {/* Cycle Stage Progress Badges with Animated Pipeline Flow */}
      {cycleLog && cycleLog.length > 0 && (
        <div className="pt-2.5 border-t border-purple-500/15 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="live-glow-dot bg-purple-400" />
              <span>Autonomous Pipeline Lifecycle Execution ({cycleLog.length} stages)</span>
            </span>
            <span className="text-[10px] font-mono text-purple-300 font-bold">100% Deterministic</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cycleLog.map((s: any, idx: number) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium bg-purple-500/10 border border-purple-500/20 text-purple-200 transition-all duration-300 hover:border-purple-400"
              >
                <CheckCircle2 className="w-3 h-3 text-purple-400 mr-1.5 flex-shrink-0" />
                <span className="font-bold text-white mr-1">{s.stage}:</span>
                <span className="text-purple-300/70">{s.detail}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div className="text-xs px-3.5 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 flex items-center justify-between font-medium animate-fade-in">
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
