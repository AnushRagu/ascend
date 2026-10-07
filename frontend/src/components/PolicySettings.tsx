"use client";

import React, { useState } from "react";
import { Shield, Save, Check, ShieldAlert, Sliders } from "lucide-react";
import { updatePolicies } from "@/lib/api";

interface PolicySettingsProps {
  policies: any;
  onRefresh: () => void;
}

export default function PolicySettings({ policies, onRefresh }: PolicySettingsProps) {
  const [formData, setFormData] = useState({
    tier1_max_budget_delta_pct: policies?.tier1_max_budget_delta_pct || 10.0,
    tier1_min_confidence_score: policies?.tier1_min_confidence_score || 0.85,
    tier2_max_budget_delta_pct: policies?.tier2_max_budget_delta_pct || 30.0,
    min_contribution_margin_floor: policies?.min_contribution_margin_floor || 0.15,
    min_inventory_days_buffer: policies?.min_inventory_days_buffer || 5,
    cooldown_hours: policies?.cooldown_hours || 24,
    auto_rollback_drop_pct: policies?.auto_rollback_drop_pct || 15.0,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updatePolicies(formData);
      setSuccess(true);
      onRefresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <Shield className="w-5 h-5 text-[#635bff]" />
          <span>Configurable 3-Tier Autonomy & Policy Guardrails</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Define mathematical boundaries and safety ceilings that govern which decisions ASCEND can execute autonomously vs which require operator approval.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tier 1 & 2 Autonomy Thresholds */}
        <div className="netic-card p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#635bff]" />
            <span>Autonomy Tier Boundaries</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
                Tier 1 Max Budget Delta % (Fully Autonomous)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Maximum % budget increase/decrease ASCEND may execute autonomously without human review.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="50"
                  value={formData.tier1_max_budget_delta_pct}
                  onChange={(e) => setFormData({ ...formData, tier1_max_budget_delta_pct: parseFloat(e.target.value) })}
                  className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white font-mono"
                />
                <span className="text-xs text-slate-400">% per 24 hours</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
                Tier 1 Min AI Confidence Score
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Decisions with confidence below this threshold cannot auto-execute and are routed to review.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="1.0"
                  value={formData.tier1_min_confidence_score}
                  onChange={(e) => setFormData({ ...formData, tier1_min_confidence_score: parseFloat(e.target.value) })}
                  className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white font-mono"
                />
                <span className="text-xs text-slate-400">({Math.round(formData.tier1_min_confidence_score * 100)}% minimum)</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
                Tier 2 Max Budget Delta % (1-Click Approval)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Changes larger than this ceiling are classified as Tier 3 Mandatory Escalation.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="1"
                  min="15"
                  max="100"
                  value={formData.tier2_max_budget_delta_pct}
                  onChange={(e) => setFormData({ ...formData, tier2_max_budget_delta_pct: parseFloat(e.target.value) })}
                  className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white font-mono"
                />
                <span className="text-xs text-slate-400">% shift</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
                Campaign Cooldown Period
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Hours required between edits to prevent ad network learning phase reset thrashing.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="1"
                  min="6"
                  max="72"
                  value={formData.cooldown_hours}
                  onChange={(e) => setFormData({ ...formData, cooldown_hours: parseInt(e.target.value) })}
                  className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white font-mono"
                />
                <span className="text-xs text-slate-400">hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Floors & Automatic Rollback */}
        <div className="netic-card p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Safety Floors & Automated Watchdog Reversibility</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
                Contribution Margin Floor %
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Prevents scaling ad spend on products if net contribution margin falls below this floor.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.05"
                  max="0.5"
                  value={formData.min_contribution_margin_floor}
                  onChange={(e) => setFormData({ ...formData, min_contribution_margin_floor: parseFloat(e.target.value) })}
                  className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white font-mono"
                />
                <span className="text-xs text-slate-400">({Math.round(formData.min_contribution_margin_floor * 100)}% net margin)</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
                Inventory Stockout Buffer Days
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                If inventory runout drops below this number of days, ad spend is locked and throttled.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="30"
                  value={formData.min_inventory_days_buffer}
                  onChange={(e) => setFormData({ ...formData, min_inventory_days_buffer: parseInt(e.target.value) })}
                  className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white font-mono"
                />
                <span className="text-xs text-slate-400">days of stock</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
                Automatic Rollback Drop Threshold %
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Safety watchdog automatically rolls back ad mutations if ROAS/MER degrades by this % in 6-24h.
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="40"
                  value={formData.auto_rollback_drop_pct}
                  onChange={(e) => setFormData({ ...formData, auto_rollback_drop_pct: parseFloat(e.target.value) })}
                  className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white font-mono"
                />
                <span className="text-xs text-slate-400">% drop triggers auto-reversion</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-1.5 px-6 py-2.5 rounded-full text-xs font-bold bg-[#635bff] hover:bg-[#5248e8] text-white transition shadow-md shadow-indigo-500/25"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Guardrails..." : "Save Policy Guardrails"}</span>
          </button>

          {success && (
            <span className="text-xs text-emerald-600 font-medium flex items-center space-x-1">
              <Check className="w-4 h-4" />
              <span>Policies updated and applied to decision engine.</span>
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
