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
  const [executingStep, setExecutingStep] = useState<Record<string, string>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filteredDecisions = decisions.filter((d) => {
    if (selectedTier !== "ALL" && d.tier !== selectedTier) return false;
    if (selectedStatus !== "ALL" && d.status !== selectedStatus) return false;
    return true;
  });

  const handleApprove = async (id: string) => {
    setLoadingAction(id);
    setActionMessage(null);
    setExecutingStep((prev) => ({ ...prev, [id]: "APPROVED" }));
    try {
      // Micro-transition feedback: APPROVED -> EXECUTING -> EXECUTED
      setTimeout(() => {
        setExecutingStep((prev) => ({ ...prev, [id]: "EXECUTING" }));
      }, 400);

      const res = await approveDecision(id);

      setTimeout(() => {
        setExecutingStep((prev) => ({ ...prev, [id]: "EXECUTED" }));
      }, 900);

      setTimeout(() => {
        setActionMessage(`Approved and executed! New daily budget: $${res.new_daily_budget} (${res.campaign_status})`);
        setExecutingStep((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        onRefresh();
      }, 1500);
    } catch (e: any) {
      setExecutingStep((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
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
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-200 border border-purple-500/30">
            <Zap className="w-3 h-3 mr-1 text-purple-300" /> TIER 1: AUTONOMOUS
          </span>
        );
      case "tier_2_approval":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-100 border border-purple-500/40">
            <Shield className="w-3 h-3 mr-1 text-purple-300" /> TIER 2: 1-CLICK APPROVAL
          </span>
        );
      case "tier_3_escalate":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-950/60 text-purple-300 border border-purple-500/30">
            <Lock className="w-3 h-3 mr-1 text-purple-400" /> TIER 3: MANDATORY ESCALATION
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "auto_executed":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-200 border border-purple-500/30">Auto-Executed</span>;
      case "executed":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-100 border border-purple-500/35">Approved & Executed</span>;
      case "pending_approval":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/25 text-purple-200 border border-purple-500/50 animate-pulse">Needs Review</span>;
      case "rolled_back":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/30 text-purple-300/60 border border-purple-500/20">Rolled Back</span>;
      case "rejected":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/40 text-purple-300 border border-purple-500/30">Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Kill switch banner if active */}
      {killSwitchActive && (
        <div className="p-4 rounded-2xl bg-purple-950/50 border border-purple-500/40 flex items-center space-x-3 text-purple-200">
          <AlertTriangle className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div className="text-xs">
            <strong className="font-bold">GLOBAL EXECUTION KILL SWITCH IS ACTIVE:</strong> All automatic executions across Meta, Google, and Amazon APIs are currently suspended. All actions require manual review or hold.
          </div>
        </div>
      )}

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs text-purple-200 flex items-center justify-between">
          <span className="font-medium">{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-purple-400 hover:text-purple-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        {/* Tier Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Autonomy Tier:</span>
          <div className="liquid-pill-track">
            {[
              { id: "ALL", label: "All Tiers" },
              { id: "tier_1_auto", label: "Tier 1: Auto" },
              { id: "tier_2_approval", label: "Tier 2: Approval" },
              { id: "tier_3_escalate", label: "Tier 3: Escalation" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTier(tab.id)}
                className={`liquid-pill-btn ${
                  selectedTier === tab.id ? "active" : ""
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Status:</span>
          <div className="liquid-pill-track">
            {["ALL", "pending_approval", "auto_executed", "executed", "rolled_back"].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`liquid-pill-btn ${
                  selectedStatus === st ? "active" : ""
                }`}
              >
                {st === "ALL" ? "All" : st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Decision Cards List */}
      <div className="space-y-4">
        {filteredDecisions.length === 0 ? (
          <div className="liquid-glass-card p-12 text-center space-y-2">
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
              className="liquid-glass-card p-6 space-y-4 hover:shadow-2xl transition-all border border-purple-500/15"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  {getTierBadge(d.tier)}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {d.channel}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-200 border border-purple-500/30">
                    {d.action_type.replace("_", " ")}
                  </span>
                  {getStatusBadge(d.status)}
                </div>

                <div className="text-[11px] text-purple-300/60 font-mono flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>{d.created_at ? new Date(d.created_at).toLocaleTimeString() : "Just now"}</span>
                </div>
              </div>

              {/* Campaign Title & Target SKU */}
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-purple-100 flex items-center space-x-2">
                  <span>{d.campaign_name}</span>
                </h3>
                <div className="text-xs text-slate-500 dark:text-purple-300/60 mt-0.5">
                  Target Product: <span className="text-slate-700 dark:text-purple-200 font-semibold">{d.target_sku}</span>
                </div>
              </div>

              {/* Action Shift Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-purple-500/05 dark:bg-[#07070a] border border-purple-500/15">
                <div>
                  <div className="text-[11px] font-medium text-slate-400 dark:text-purple-300/60">Current Spend Allocation</div>
                  <div className="text-lg font-bold text-slate-800 dark:text-purple-200 font-mono">
                    ${d.current_budget?.toLocaleString()}/day
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <ArrowRight className="w-4 h-4 text-purple-400/40" />
                  <div>
                    <div className="text-[11px] font-medium text-slate-400 dark:text-purple-300/60">Recommended Allocation</div>
                    <div className="text-lg font-bold text-purple-400 font-mono">
                      ${d.new_budget?.toLocaleString()}/day
                      <span className={`text-xs ml-1.5 font-semibold ${d.delta_budget_pct > 0 ? "text-purple-300" : "text-fuchsia-400"}`}>
                        ({d.delta_budget_pct > 0 ? "+" : ""}{d.delta_budget_pct}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-medium text-slate-400 dark:text-purple-300/60">Projected Margin & ROAS Lift</div>
                  <div className="text-sm font-semibold text-purple-300 flex items-center mt-1">
                    <TrendingUp className="w-3.5 h-3.5 mr-1 text-purple-400" />
                    +{Math.round((d.predicted_mer_lift || 0.12) * 100)}% MER / +{Math.round((d.predicted_roas_lift || 0.15) * 100)}% ROAS
                  </div>
                </div>
              </div>

              {/* Rationale & Diagnosis */}
              <div className="text-xs text-slate-600 dark:text-purple-200/80 bg-white dark:bg-[#09090e] p-3.5 rounded-xl border border-purple-500/15 leading-relaxed shadow-sm">
                <span className="font-bold text-purple-400 uppercase tracking-wider text-[10px] block mb-1">
                  Root Cause Diagnosis & AI Rationale:
                </span>
                {d.rationale}
              </div>

              {/* Guardrails Evaluated Breakdown */}
              {d.guardrails_evaluated && d.guardrails_evaluated.length > 0 && (
                <div className="text-xs p-3 rounded-xl bg-purple-500/05 dark:bg-[#07070a] border border-purple-500/15 space-y-1.5">
                  <div className="font-bold text-[10px] uppercase tracking-wider text-purple-400/80">
                    Policy Guardrails Evaluated:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {d.guardrails_evaluated.map((g: any, gIdx: number) => (
                      <div key={gIdx} className="flex items-center space-x-1.5 text-[11px]">
                        <span className={`w-2 h-2 rounded-full ${g.passed ? "bg-purple-400 shadow-sm shadow-purple-500" : "bg-purple-900 border border-purple-400"}`} />
                        <span className="font-medium text-slate-700 dark:text-purple-200">{g.name}:</span>
                        <span className="text-slate-500 dark:text-purple-300/60">{g.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence & Risk Bar + Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-purple-500/15">
                <div className="flex items-center space-x-6 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-purple-300/60 mr-1.5">Confidence:</span>
                    <span className="font-bold text-purple-400 font-mono">
                      {Math.round((d.confidence_score || 0.85) * 100)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-purple-300/60 mr-1.5">Risk Score:</span>
                    <span className="font-bold font-mono text-purple-300">
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
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#0b0b10] text-slate-700 dark:text-purple-200 border border-purple-500/20 hover:bg-purple-500/10 transition interactive-button"
                      >
                        <Edit2 className="w-3 h-3 mr-0.5" />
                        <span>Modify</span>
                      </button>
                      <button
                        onClick={() => handleReject(d.id)}
                        disabled={loadingAction === d.id}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#0b0b10] text-slate-700 dark:text-purple-200 border border-purple-500/20 hover:bg-purple-500/10 transition interactive-button"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(d.id)}
                        disabled={loadingAction === d.id || killSwitchActive}
                        className={`flex items-center space-x-1.5 px-5 py-1.5 rounded-full text-xs font-bold transition shadow-md disabled:opacity-50 interactive-button ${
                          executingStep[d.id]
                            ? "bg-purple-600 text-white shadow-purple-500/40 animate-pulse"
                            : "liquid-btn-primary"
                        }`}
                      >
                        {executingStep[d.id] ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" />
                            <span>{executingStep[d.id]}...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 mr-1" />
                            <span>Approve & Execute</span>
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {(d.status === "executed" || d.status === "auto_executed") && (
                    <button
                      onClick={() => handleRollback(d.id)}
                      disabled={loadingAction === d.id}
                      className="flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 border border-purple-500/30 transition interactive-button"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      <span>Rollback Mutation</span>
                    </button>
                  )}

                  {d.can_rollback && (
                    <button
                      onClick={() => handleRollback(d.id)}
                      disabled={loadingAction === d.id}
                      className="flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-950/40 text-purple-300 border border-purple-500/30 hover:bg-purple-900/40 transition interactive-button"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      <span>{loadingAction === d.id ? "Reverting..." : "1-Click Rollback"}</span>
                    </button>
                  )}

                  {d.status === "rolled_back" && (
                    <span className="text-xs text-purple-300/60 italic">
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
