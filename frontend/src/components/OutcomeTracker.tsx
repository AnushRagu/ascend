"use client";

import React from "react";
import { CheckCircle2, TrendingUp, Brain, Database, ArrowUpRight } from "lucide-react";

interface OutcomeTrackerProps {
  outcomes: any[];
}

export default function OutcomeTracker({ outcomes }: OutcomeTrackerProps) {
  const successCount = outcomes.filter((o) => o.is_success).length;
  const successRate = outcomes.length > 0 ? Math.round((successCount / outcomes.length) * 100) : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            Closed-Loop Learning & Retrospectives
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Counterfactual evaluation across 24h, 72h, and 7d observation windows to calibrate future recommendation confidence.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="netic-card px-3.5 py-2 flex items-center space-x-2 text-xs">
            <Brain className="w-4 h-4 text-[#635bff]" />
            <span className="text-slate-400">Calibration Accuracy:</span>
            <span className="font-bold text-emerald-600 font-mono">{successRate}%</span>
          </div>

          <div className="netic-card px-3.5 py-2 flex items-center space-x-2 text-xs">
            <Database className="w-4 h-4 text-indigo-500" />
            <span className="text-slate-400">Episodes Indexed:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{outcomes.length}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {outcomes.length === 0 ? (
          <div className="netic-card p-10 text-center">
            <p className="text-xs text-slate-400">No executed decisions have cleared the 24-hour observation window yet.</p>
          </div>
        ) : (
          outcomes.map((o) => (
            <div key={o.id} className="netic-card p-5 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#f5f3ff] text-[#635bff] border border-[#e2dcff] font-mono">
                    Window: {o.window_type}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{o.campaign_name}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {o.channel}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validated Outcome</span>
                </div>
              </div>

              {/* Lift metrics comparison */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Baseline ROAS</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono">{o.baseline_roas}x</div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px]">Post-Execution ROAS</div>
                  <div className="text-base font-bold text-emerald-600 font-mono flex items-center">
                    {o.post_roas}x
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px]">Actual vs Predicted Lift</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono">
                    <span className="text-emerald-600">+{o.actual_roas_lift_pct}%</span>
                    <span className="text-slate-400 text-xs font-normal"> / +{o.predicted_roas_lift_pct}% pred</span>
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px]">Net Margin Delta</div>
                  <div className="text-base font-bold text-emerald-600 font-mono">
                    +${o.contribution_margin_delta?.toLocaleString() || "0"}
                  </div>
                </div>
              </div>

              {/* Learning Retrospective Notes */}
              <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-start space-x-2 shadow-sm">
                <Brain className="w-4 h-4 text-[#635bff] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#635bff]">Continuous Learning Retrospective: </strong>
                  <span>{o.learning_notes}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
