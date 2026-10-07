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
  const [approved, setApproved] = useState(false);

  // If a pending decision exists from the engine, display real dynamics
  const actionText = topDecision
    ? `${topDecision.action_type === "inventory_protect_pause" ? `Pause spend on ${topDecision.target_sku || "Hero SKU"} to prevent stockout damage` : `Shift $${Math.abs(topDecision.delta_budget_abs || 250)} daily spend: ${topDecision.campaign_name}`}`
    : "Autonomous Pipeline Ready — Run Cycle to Generate Strategy";

  const expectedProfit = topDecision
    ? `+$${Math.round(topDecision.expected_contribution_profit || 875)}/day`
    : "+$875/day";

  // Derive What Changed from topDecision or default
  const deltaLabel = topDecision?.delta_budget_pct
    ? `${topDecision.delta_budget_pct > 0 ? "↑" : "↓"} ${Math.abs(topDecision.delta_budget_pct)}%`
    : "↓ 18%";

  const handleApprove = async () => {
    if (!topDecision?.id) {
      alert("No pending decision queued. Run an Autonomous Cycle first.");
      return;
    }
    setLoading(true);
    try {
      await approveDecision(topDecision.id);
      setApproved(true);
      if (onRefresh) onRefresh();
      setTimeout(() => setApproved(false), 3000);
    } catch (e: any) {
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
    <div className="netic-card p-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Column 1: WHAT CHANGED (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3">
            WHAT CHANGED
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {topDecision?.channel ? `${topDecision.channel.toUpperCase()} Allocation` : "Channel Velocity"}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${topDecision?.delta_budget_pct < 0 ? "bg-[#ffe4e6] text-[#e11d48]" : "bg-[#dcfce7] text-[#16a34a]"}`}>
                {deltaLabel}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Confidence Score</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#eff6ff] text-[#2563eb]">
                {Math.round((topDecision?.confidence_score || 0.95) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="hidden lg:flex lg:col-span-1 justify-center">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Column 2: WHY (ROOT CAUSE) (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3">
            WHY (ROOT CAUSE)
          </div>
          <div className="space-y-2.5">
            <div className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-3 leading-relaxed">
              {topDecision?.rationale
                ? topDecision.rationale.split("[")[0]
                : "Continuous closed-loop telemetry analysis evaluating inventory safety, unit margins, and audience saturation."}
            </div>
          </div>
        </div>

        {/* Column 3: NEXT BEST ACTION (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-[#f8f7ff] dark:bg-[#1e1b4b]/30 rounded-xl p-4 border border-[#e5e0ff] dark:border-[#3730a3]/60 flex flex-col justify-between space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#635bff] uppercase">
              NEXT BEST ACTION
            </span>
            <span className="text-xs font-bold text-[#10b981]">
              Expected Profit: {expectedProfit}
            </span>
          </div>

          {/* Action text */}
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
            {actionText}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              onClick={handleEdit}
              disabled={loading || !topDecision?.id}
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
            >
              Edit
            </button>
            <button
              onClick={handleApprove}
              disabled={loading || approved || !topDecision?.id}
              className="flex items-center space-x-1 px-5 py-1.5 rounded-full text-xs font-semibold bg-[#635bff] hover:bg-[#5248e8] text-white shadow-md shadow-indigo-500/25 transition disabled:opacity-50"
            >
              {approved ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>Approved!</span>
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
