"use client";

import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { approveDecision, modifyDecision } from "@/lib/api";

interface DecisionExecutionBannerProps {
  topDecision?: any;
  onRefresh?: () => void;
}

export default function DecisionExecutionBanner({
  topDecision,
  onRefresh,
}: DecisionExecutionBannerProps) {
  const [loading, setLoading] = useState(false);
  const [executionState, setExecutionState] = useState<string | null>(null);

  // If a pending decision exists from the engine, display real dynamics
  const actionText = topDecision
    ? `${topDecision.action_type === "inventory_protect_pause" ? `Pause spend on ${topDecision.target_sku || "Hero SKU"} to prevent stockout damage` : `Shift $${Math.abs(topDecision.delta_budget_abs || 250)} daily spend: ${topDecision.campaign_name}`}`
    : "Autonomous Pipeline Ready — Run Cycle to Generate Strategy";

  const expectedProfit = topDecision?.expected_contribution_profit !== undefined && topDecision?.expected_contribution_profit !== null
    ? `${topDecision.expected_contribution_profit >= 0 ? "+" : "−"}$${Math.round(Math.abs(topDecision.expected_contribution_profit))}/day`
    : "Awaiting evaluation";

  // Derive What Changed from topDecision or default
  const deltaLabel = topDecision?.delta_budget_pct !== undefined && topDecision?.delta_budget_pct !== null
    ? `${topDecision.delta_budget_pct > 0 ? "↑" : "↓"} ${Math.abs(topDecision.delta_budget_pct)}%`
    : "No change recorded";

  const handleApprove = async () => {
    if (!topDecision?.id) {
      alert("No pending decision queued. Run an Autonomous Cycle first.");
      return;
    }
    setLoading(true);
    setExecutionState("APPROVED");
    try {
      setTimeout(() => setExecutionState("EXECUTING"), 400);
      await approveDecision(topDecision.id);
      setTimeout(() => setExecutionState("EXECUTED"), 900);
      setTimeout(() => {
        setExecutionState(null);
        if (onRefresh) onRefresh();
      }, 1600);
    } catch (e: any) {
      setExecutionState(null);
      alert(`Approval error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!topDecision?.id) {
      alert("No pending decision queued.");
      return;
    }
    const current = topDecision.new_budget || 0;
    const input = prompt(`Enter new daily budget for ${topDecision.campaign_name}:`, String(current));
    if (input === null) return;
    const newBudget = parseFloat(input);
    if (isNaN(newBudget) || newBudget < 0) {
      alert("Invalid budget entered.");
      return;
    }
    setLoading(true);
    try {
      await modifyDecision(topDecision.id, { new_budget: newBudget });
      alert("Decision modified successfully and guardrails re-evaluated!");
      if (onRefresh) onRefresh();
    } catch (e: any) {
      alert(`Modification error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="liquid-glass-card p-5 border border-purple-500/15">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Column 1: WHAT CHANGED (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-purple-500/05 dark:bg-[#07070a] rounded-xl p-4 border border-purple-500/15">
          <div className="text-[10px] font-black tracking-wider text-purple-400 uppercase mb-3">
            WHAT CHANGED
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-purple-200">
                {topDecision?.channel ? `${topDecision.channel.toUpperCase()} Allocation` : "Channel Velocity"}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold ${topDecision?.delta_budget_pct < 0 ? "bg-purple-950/40 text-purple-300 border border-purple-500/30" : "bg-purple-500/20 text-purple-200 border border-purple-500/40"}`}>
                {deltaLabel}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-purple-200">Confidence Score</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {topDecision?.confidence_score !== undefined && topDecision?.confidence_score !== null
                  ? `${Math.round(topDecision.confidence_score * 100)}%`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="hidden lg:flex lg:col-span-1 justify-center">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Column 2: WHY (ROOT CAUSE) (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-purple-500/05 dark:bg-[#07070a] rounded-xl p-4 border border-purple-500/15">
          <div className="text-[10px] font-black tracking-wider text-purple-400 uppercase mb-3">
            WHY (ROOT CAUSE)
          </div>
          <div className="space-y-2.5">
            <div className="text-xs text-slate-700 dark:text-purple-200/80 font-medium line-clamp-3 leading-relaxed">
              {topDecision?.rationale
                ? topDecision.rationale.split("[")[0]
                : "Continuous closed-loop telemetry analysis evaluating inventory safety, unit margins, and audience saturation."}
            </div>
          </div>
        </div>

        {/* Column 3: NEXT BEST ACTION (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-purple-500/10 dark:bg-purple-950/20 rounded-xl p-4 border border-purple-500/25 flex flex-col justify-between space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider text-purple-400 uppercase">
              NEXT BEST ACTION
            </span>
            <span className="text-xs font-bold text-purple-300">
              Expected Profit: {expectedProfit}
            </span>
          </div>

          {/* Action text */}
          <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
            {actionText}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              onClick={handleEdit}
              disabled={loading || !topDecision?.id}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-50 dark:hover:bg-white/15 transition disabled:opacity-50"
            >
              Edit
            </button>
            <button
              onClick={handleApprove}
              disabled={loading || executionState !== null || !topDecision?.id}
              className={`flex items-center space-x-1 px-5 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50 interactive-button ${
                executionState
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-pulse"
                  : "liquid-btn-primary"
              }`}
            >
              {executionState ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>{executionState}...</span>
                </>
              ) : (
                <span>{loading ? "Executing..." : "Approve & Execute"}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
