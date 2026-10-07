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
  Percent,
  Check,
  X,
  Clock,
  Lock,
} from "lucide-react";
import { approveDecision, rejectDecision, rollbackDecision } from "@/lib/api";

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
      setActionMessage(`Rollback successful! Restored campaign budget to $${res.restored_budget}.`);
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
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <Zap className="w-3 h-3 mr-1" /> TIER 1: AUTONOMOUS
          </span>
        );
      case "tier_2_approval":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <Shield className="w-3 h-3 mr-1" /> TIER 2: 1-CLICK APPROVAL
          </span>
        );
      case "tier_3_escalate":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <Lock className="w-3 h-3 mr-1" /> TIER 3: MANDATORY ESCALATION
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "auto_executed":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Auto-Executed</span>;
      case "executed":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">Approved & Executed</span>;
      case "pending_approval":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">Needs Review</span>;
      case "rolled_back":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/20 text-slate-400 border border-slate-600">Rolled Back</span>;
      case "rejected":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Kill switch banner if active */}
      {killSwitchActive && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/50 flex items-center space-x-3 text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div className="text-xs">
            <strong className="font-bold">GLOBAL EXECUTION KILL SWITCH IS ACTIVE:</strong> All automatic executions across Meta, Google, and Amazon APIs are currently suspended. All actions require manual review or hold.
          </div>
        </div>
      )}

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-3 rounded-lg bg-indigo-950/70 border border-indigo-700 text-xs text-indigo-200 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-indigo-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedTier === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
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
              className={`px-2.5 py-1 rounded text-xs transition ${
                selectedStatus === st
                  ? "bg-slate-700 text-white font-medium"
                  : "text-slate-400 hover:text-slate-300"
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
          <div className="glass-panel p-12 text-center rounded-xl border border-slate-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-300">All decision queues are clear</h4>
            <p className="text-xs text-slate-500">
              No decisions match the current filter criteria. Trigger an event from the top simulator bar or run an autonomous cycle.
            </p>
          </div>
        ) : (
          filteredDecisions.map((d) => (
            <div
              key={d.id}
              className="glass-panel glass-panel-hover p-6 rounded-xl border border-slate-800 space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  {getTierBadge(d.tier)}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                    {d.channel}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800/80 text-indigo-300">
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
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>{d.campaign_name}</span>
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Target Product: <span className="text-slate-200 font-medium">{d.target_sku}</span>
                </div>
              </div>

              {/* Action Shift Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                <div>
                  <div className="text-[11px] text-slate-400">Current Spend Allocation</div>
                  <div className="text-lg font-bold text-slate-300 font-mono">${d.current_budget.toLocaleString()}/day</div>
                </div>

                <div className="flex items-center space-x-2">
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-[11px] text-slate-400">Recommended Allocation</div>
                    <div className="text-lg font-bold text-indigo-400 font-mono">
                      ${d.new_budget.toLocaleString()}/day
                      <span className={`text-xs ml-1.5 font-semibold ${d.delta_budget_pct > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        ({d.delta_budget_pct > 0 ? "+" : ""}{d.delta_budget_pct}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400">Projected Margin & ROAS Lift</div>
                  <div className="text-sm font-semibold text-emerald-400 flex items-center mt-1">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                    +{Math.round(d.predicted_mer_lift * 100)}% MER / +{Math.round(d.predicted_roas_lift * 100)}% ROAS
                  </div>
                </div>
              </div>

              {/* Rationale & Diagnosis */}
              <div className="text-xs text-slate-300 bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/60 leading-relaxed">
                <span className="font-semibold text-indigo-300 uppercase tracking-wide text-[10px] block mb-1">
                  Root Cause Diagnosis & AI Rationale:
                </span>
                {d.rationale}
              </div>

              {/* Confidence & Risk Bar + Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/70">
                <div className="flex items-center space-x-6 text-xs">
                  {/* Confidence */}
                  <div>
                    <span className="text-slate-400 mr-1.5">Confidence:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {Math.round(d.confidence_score * 100)}%
                    </span>
                  </div>

                  {/* Risk */}
                  <div>
                    <span className="text-slate-400 mr-1.5">Risk Score:</span>
                    <span className={`font-bold font-mono ${d.risk_score > 0.4 ? "text-amber-400" : "text-slate-300"}`}>
                      {Math.round(d.risk_score * 100)}%
                    </span>
                  </div>
                </div>

                {/* Execution Controls */}
                <div className="flex items-center space-x-2">
                  {d.status === "pending_approval" && (
                    <>
                      <button
                        onClick={() => handleReject(d.id)}
                        disabled={loadingAction === d.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(d.id)}
                        disabled={loadingAction === d.id || killSwitchActive}
                        className="flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
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
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 transition"
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
