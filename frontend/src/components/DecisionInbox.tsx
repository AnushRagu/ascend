"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Shield,
  Zap,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Check,
  X,
  Clock,
  Lock,
  Edit2,
} from "lucide-react";
import { approveDecision, rejectDecision, rollbackDecision, modifyDecision } from "@/lib/api";

interface DecisionInboxProps {
  decisions: any[];
  onRefresh: () => void;
  killSwitchActive: boolean;
}

export default function DecisionInbox({ decisions, onRefresh, killSwitchActive }: DecisionInboxProps) {
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filteredDecisions = decisions.filter((d) => {
    if (selectedTier !== "ALL" && d.tier !== selectedTier) return false;
    if (selectedStatus !== "ALL" && d.status !== selectedStatus) return false;
    return true;
  });

  const handleApprove = async (id: string) => {
    setLoadingAction(id);
    setActionMessage(null);
    try {
      const res = await approveDecision(id);
      setActionMessage(`Approved and executed! New daily budget: $${res.new_daily_budget} (${res.campaign_status})`);
      onRefresh();
    } catch (e: any) {
      setActionMessage(`Approval failed: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEdit = async (d: any) => {
    const input = prompt(`Enter new daily budget for ${d.campaign_name}:`, String(d.new_budget));
    if (input === null) return;
    const newBudget = parseFloat(input);
    if (isNaN(newBudget) || newBudget < 0) {
      alert("Invalid budget entered.");
      return;
    }
    setLoadingAction(d.id);
    setActionMessage(null);
    try {
      const res = await modifyDecision(d.id, { new_budget: newBudget });
      setActionMessage(`Modified decision to $${res.new_budget}/day (Tier: ${res.tier}). Guardrails re-evaluated.`);
      onRefresh();
    } catch (e: any) {
      setActionMessage(`Modification failed: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter operator rejection reason:") || "Manual rejection by media buyer";
    setLoadingAction(id);
    setActionMessage(null);
    try {
      await rejectDecision(id, reason);
      setActionMessage(`Decision rejected.`);
      onRefresh();
    } catch (e: any) {
      setActionMessage(`Rejection failed: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRollback = async (id: string) => {
    if (!confirm("Are you sure you want to rollback this execution? This will revert ad account budget/status atomically.")) return;
    setLoadingAction(id);
    setActionMessage(null);
    try {
      const res = await rollbackDecision(id);
      setActionMessage(`Rollback successful! Restored campaign budget to $${res.restored_budget} (${res.restored_status}).`);
      onRefresh();
    } catch (e: any) {
      setActionMessage(`Rollback failed: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "tier_1_auto":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]">
            <Zap className="w-3 h-3 mr-1" /> TIER 1: AUTONOMOUS
          </span>
        );
      case "tier_2_approval":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f5f3ff] text-[#635bff] border border-[#e2dcff]">
            <Shield className="w-3 h-3 mr-1" /> TIER 2: 1-CLICK APPROVAL
          </span>
        );
      case "tier_3_escalate":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ffe4e6] text-[#e11d48] border border-[#fecdd3]">
            <Lock className="w-3 h-3 mr-1" /> TIER 3: MANDATORY ESCALATION
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "auto_executed":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">Auto-Executed</span>;
      case "executed":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">Approved & Executed</span>;
      case "pending_approval":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 animate-pulse">Needs Review</span>;
      case "rolled_back":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">Rolled Back</span>;
      case "rejected":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Kill switch banner if active */}
      {killSwitchActive && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center space-x-3 text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <div className="text-xs">
            <strong className="font-bold">GLOBAL EXECUTION KILL SWITCH IS ACTIVE:</strong> All automatic executions across Meta, Google, and Amazon APIs are currently suspended. All actions require manual review or hold.
          </div>
        </div>
      )}

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-[#f5f3ff] border border-[#e2dcff] text-xs text-[#635bff] flex items-center justify-between">
          <span className="font-medium">{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        {/* Tier Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Autonomy Tier:</span>
          {[
            { id: "ALL", label: "All Tiers" },
            { id: "tier_1_auto", label: "Tier 1: Auto" },
            { id: "tier_2_approval", label: "Tier 2: Approval" },
            { id: "tier_3_escalate", label: "Tier 3: Escalation" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTier(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                selectedTier === tab.id
                  ? "bg-[#635bff] text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Status:</span>
          {["ALL", "pending_approval", "auto_executed", "executed", "rolled_back"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-xs transition ${
                selectedStatus === st
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              {st === "ALL" ? "All" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Decision Cards List */}
      <div className="space-y-4">
        {filteredDecisions.length === 0 ? (
          <div className="netic-card p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">All decision queues are clear</h4>
            <p className="text-xs text-slate-400">
              No decisions match the current filter criteria. Run an autonomous cycle or inject a scenario to generate recommendations.
            </p>
          </div>
        ) : (
          filteredDecisions.map((d) => (
            <div
              key={d.id}
              className="netic-card p-6 space-y-4 hover:shadow-md transition-shadow"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  {getTierBadge(d.tier)}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {d.channel}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f5f3ff] text-[#635bff]">
                    {d.action_type.replace("_", " ")}
                  </span>
                  {getStatusBadge(d.status)}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{d.created_at ? new Date(d.created_at).toLocaleTimeString() : "Just now"}</span>
                </div>
              </div>

              {/* Campaign Title & Target SKU */}
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                  <span>{d.campaign_name}</span>
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Target Product: <span className="text-slate-700 dark:text-slate-300 font-medium">{d.target_sku}</span>
                </div>
              </div>

              {/* Action Shift Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-[11px] font-medium text-slate-400">Current Spend Allocation</div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono">
                    ${d.current_budget?.toLocaleString()}/day
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                  <div>
                    <div className="text-[11px] font-medium text-slate-400">Recommended Allocation</div>
                    <div className="text-lg font-bold text-[#635bff] font-mono">
                      ${d.new_budget?.toLocaleString()}/day
                      <span className={`text-xs ml-1.5 font-semibold ${d.delta_budget_pct > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        ({d.delta_budget_pct > 0 ? "+" : ""}{d.delta_budget_pct}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-medium text-slate-400">Projected Margin & ROAS Lift</div>
                  <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center mt-1">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                    +{Math.round((d.predicted_mer_lift || 0.12) * 100)}% MER / +{Math.round((d.predicted_roas_lift || 0.15) * 100)}% ROAS
                  </div>
                </div>
              </div>

              {/* Rationale & Diagnosis */}
              <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 leading-relaxed shadow-sm">
                <span className="font-bold text-[#635bff] uppercase tracking-wider text-[10px] block mb-1">
                  Root Cause Diagnosis & AI Rationale:
                </span>
                {d.rationale}
              </div>

              {/* Guardrails Evaluated Breakdown */}
              {d.guardrails_evaluated && d.guardrails_evaluated.length > 0 && (
                <div className="text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                    Policy Guardrails Evaluated:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {d.guardrails_evaluated.map((g: any, gIdx: number) => (
                      <div key={gIdx} className="flex items-center space-x-1.5 text-[11px]">
                        <span className={`w-2 h-2 rounded-full ${g.passed ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{g.name}:</span>
                        <span className="text-slate-500 dark:text-slate-400">{g.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence & Risk Bar + Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-6 text-xs">
                  <div>
                    <span className="text-slate-400 mr-1.5">Confidence:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {Math.round((d.confidence_score || 0.85) * 100)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 mr-1.5">Risk Score:</span>
                    <span className={`font-bold font-mono ${d.risk_score > 0.4 ? "text-amber-500" : "text-slate-600 dark:text-slate-300"}`}>
                      {Math.round((d.risk_score || 0.20) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Execution Controls */}
                <div className="flex items-center space-x-2">
                  {d.status === "pending_approval" && (
                    <>
                      <button
                        onClick={() => handleEdit(d)}
                        disabled={loadingAction === d.id}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition"
                      >
                        <Edit2 className="w-3 h-3 mr-0.5" />
                        <span>Modify</span>
                      </button>
                      <button
                        onClick={() => handleReject(d.id)}
                        disabled={loadingAction === d.id}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(d.id)}
                        disabled={loadingAction === d.id || killSwitchActive}
                        className="flex items-center space-x-1.5 px-5 py-1.5 rounded-full text-xs font-bold bg-[#635bff] hover:bg-[#5248e8] text-white transition shadow-md shadow-indigo-500/25 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{loadingAction === d.id ? "Executing..." : "Approve & Execute (1-Click)"}</span>
                      </button>
                    </>
                  )}

                  {d.can_rollback && (
                    <button
                      onClick={() => handleRollback(d.id)}
                      disabled={loadingAction === d.id}
                      className="flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{loadingAction === d.id ? "Reverting..." : "1-Click Rollback"}</span>
                    </button>
                  )}

                  {d.status === "rolled_back" && (
                    <span className="text-xs text-slate-400 italic">
                      Reverted: {d.rejection_reason || "State restored"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
