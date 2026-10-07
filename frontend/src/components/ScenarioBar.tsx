"use client";

import React, { useState } from "react";
import {
  triggerScenario,
  reseedSimulator,
  runDecisionCycle,
  toggleKillSwitch,
  fastForwardSimulator,
} from "@/lib/api";
import {
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Zap,
  ShieldCheck,
  FastForward,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ScenarioBarProps {
  onRefresh: () => void;
  killSwitchActive: boolean;
  onKillSwitchChange: (active: boolean) => void;
}

export default function ScenarioBar({
  onRefresh,
  killSwitchActive,
  onKillSwitchChange,
}: ScenarioBarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cycleLog, setCycleLog] = useState<any[] | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const handleScenario = async (id: string, name: string) => {
    setLoading(id);
    setMessage(null);
    setCycleLog(null);
    try {
      const res = await triggerScenario(id);
      setMessage(`Triggered: ${res.impact}`);
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
        `Cycle Complete (${res.cycle_id}): ${res.anomalies_detected} anomalies. ${res.tier1_auto_executed} auto-executed, ${res.tier2_tier3_pending_approval} routed to inbox.`
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
      setMessage(res.message || `+${hours}h simulated. Evaluated ${res.evaluations_run} outcomes.`);
      onRefresh();
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
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
      setMessage("Simulator reset to baseline.");
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
      setMessage(
        nextState
          ? "KILL SWITCH: ENGAGED (Mutations halted)"
          : "KILL SWITCH: OFF (Normal autonomy)"
      );
      onRefresh();
    } catch (e: any) {
      setMessage(`Kill switch error: ${e.message}`);
    }
  };

  return (
    <div className="rounded-2xl p-3 border border-purple-500/15 dark:border-white/[0.08] bg-slate-900/5 dark:bg-white/[0.03] backdrop-blur-md space-y-3 select-none">
      {/* Header with expand toggle */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-white/10 dark:bg-white/10 flex items-center justify-center text-slate-800 dark:text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-slate-800 dark:text-white leading-tight">
              Simulator & Autonomy
            </div>
            <div className="text-[9px] text-slate-500 dark:text-white/40 leading-tight">
              Deterministic sandbox
            </div>
          </div>
        </div>
        <button
          type="button"
          className="text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white"
        >
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-1 border-t border-slate-200/50 dark:border-white/[0.06]">
          {/* Autonomous Cycle Main Button */}
          <button
            onClick={handleRunCycle}
            disabled={loading !== null}
            className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold liquid-btn-primary transition disabled:opacity-60 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{loading === "CYCLE" ? "Executing..." : "Run Autonomous Cycle"}</span>
          </button>

          {/* Time Warp & Reset Row */}
          <div className="flex items-center justify-between gap-1.5 text-xs">
            {/* +24h and +72h */}
            <div className="flex items-center space-x-1 flex-1">
              <button
                onClick={() => handleFastForward(24)}
                disabled={loading !== null}
                className="flex-1 py-1 px-1.5 rounded-lg text-[10px] font-medium bg-slate-200/60 dark:bg-white/[0.06] text-slate-700 dark:text-white/80 hover:bg-slate-300/60 dark:hover:bg-white/[0.12] transition border border-transparent dark:border-white/[0.05]"
              >
                {loading === "FF_24" ? "..." : "+24h"}
              </button>
              <button
                onClick={() => handleFastForward(72)}
                disabled={loading !== null}
                className="flex-1 py-1 px-1.5 rounded-lg text-[10px] font-medium bg-slate-200/60 dark:bg-white/[0.06] text-slate-700 dark:text-white/80 hover:bg-slate-300/60 dark:hover:bg-white/[0.12] transition border border-transparent dark:border-white/[0.05]"
              >
                {loading === "FF_72" ? "..." : "+72h"}
              </button>
            </div>

            {/* Reset */}
            <button
              onClick={handleReseed}
              disabled={loading !== null}
              title="Reset deterministic baseline"
              className="py-1 px-2 rounded-lg text-[10px] font-medium bg-slate-200/60 dark:bg-white/[0.06] text-slate-700 dark:text-white/80 hover:bg-slate-300/60 dark:hover:bg-white/[0.12] transition border border-transparent dark:border-white/[0.05] flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Kill Switch Button */}
          <button
            onClick={handleToggleKillSwitch}
            className={`w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold transition ${
              killSwitchActive
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse"
                : "bg-slate-200/60 dark:bg-white/[0.06] text-slate-700 dark:text-white/70 border border-slate-300/40 dark:border-white/[0.08] hover:bg-slate-300/60 dark:hover:bg-white/[0.12]"
            }`}
          >
            {killSwitchActive ? (
              <ShieldAlert className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            )}
            <span>{killSwitchActive ? "KILL SWITCH: ENGAGED" : "KILL SWITCH: OFF"}</span>
          </button>

          {/* Inject Events List */}
          <div className="space-y-1 pt-1 border-t border-slate-200/50 dark:border-white/[0.06]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1">
              Inject Stress Scenarios:
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <button
                onClick={() => handleScenario("STOCKOUT", "Hero SKU Stockout Threat")}
                disabled={loading !== null}
                className="py-1 px-1.5 rounded-lg text-left bg-slate-200/50 dark:bg-white/[0.04] text-slate-700 dark:text-white/80 hover:bg-slate-300/60 dark:hover:bg-white/[0.09] transition truncate border border-transparent dark:border-white/[0.04]"
              >
                1. Stockout
              </button>
              <button
                onClick={() => handleScenario("FATIGUE", "Creative Fatigue & CPM Spike")}
                disabled={loading !== null}
                className="py-1 px-1.5 rounded-lg text-left bg-slate-200/50 dark:bg-white/[0.04] text-slate-700 dark:text-white/80 hover:bg-slate-300/60 dark:hover:bg-white/[0.09] transition truncate border border-transparent dark:border-white/[0.04]"
              >
                2. Fatigue
              </button>
              <button
                onClick={() => handleScenario("ARBITRAGE", "Cross-Channel Arbitrage")}
                disabled={loading !== null}
                className="py-1 px-1.5 rounded-lg text-left bg-slate-200/50 dark:bg-white/[0.04] text-slate-700 dark:text-white/80 hover:bg-slate-300/60 dark:hover:bg-white/[0.09] transition truncate border border-transparent dark:border-white/[0.04]"
              >
                3. Arbitrage
              </button>
              <button
                onClick={() => handleScenario("MARGIN_COMPRESSION", "Discount Margin Cannibalization")}
                disabled={loading !== null}
                className="py-1 px-1.5 rounded-lg text-left bg-slate-200/50 dark:bg-white/[0.04] text-slate-700 dark:text-white/80 hover:bg-slate-300/60 dark:hover:bg-white/[0.09] transition truncate border border-transparent dark:border-white/[0.04]"
              >
                4. Margin
              </button>
            </div>
          </div>

          {/* Cycle log or message feedback */}
          {cycleLog && cycleLog.length > 0 && (
            <div className="space-y-1 pt-1.5 border-t border-slate-200/50 dark:border-white/[0.06]">
              <div className="text-[9px] font-bold text-slate-600 dark:text-white/60 uppercase">
                Executed Stages ({cycleLog.length})
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 text-[9px] font-mono">
                {cycleLog.map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-1 text-slate-700 dark:text-white/80"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white">{s.stage}:</span>
                    <span className="truncate opacity-75">{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {message && (
            <div className="text-[10px] p-2 rounded-lg bg-slate-200/70 dark:bg-white/[0.08] text-slate-800 dark:text-white/90 border border-slate-300/60 dark:border-white/[0.1] leading-relaxed">
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
