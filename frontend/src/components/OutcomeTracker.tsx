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
          <h3 className="text-sm font-semibold text-white">Closed-Loop Learning & Outcome Retrospectives</h3>
          <p className="text-xs text-slate-400">
            Evaluating executed actions across 24h, 72h, and 7d observation windows to calibrate future recommendation confidence.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="glass-panel px-3.5 py-1.5 rounded-lg border border-slate-800 flex items-center space-x-2 text-xs">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">Calibration Accuracy:</span>
            <span className="font-bold text-emerald-400 font-mono">{successRate}%</span>
          </div>

          <div className="glass-panel px-3.5 py-1.5 rounded-lg border border-slate-800 flex items-center space-x-2 text-xs">
            <Database className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Vector Index:</span>
            <span className="font-bold text-slate-200">{outcomes.length} Episodes</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {outcomes.length === 0 ? (
          <div className="glass-panel p-10 text-center rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400">No executed decisions have cleared the 24-hour observation window yet.</p>
          </div>
        ) : (
          outcomes.map((o) => (
            <div key={o.id} className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                    Window: {o.window_type}
                  </span>
                  <span className="text-xs font-bold text-white">{o.campaign_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                    {o.channel}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validated Outcome</span>
                </div>
              </div>

              {/* Lift metrics comparison */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Baseline ROAS</div>
                  <div className="text-base font-bold text-slate-300 font-mono">{o.baseline_roas}x</div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px]">Post-Execution ROAS</div>
                  <div className="text-base font-bold text-emerald-400 font-mono flex items-center">
                    {o.post_roas}x
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px]">Actual vs Predicted Lift</div>
                  <div className="text-base font-bold text-white font-mono">
                    <span className="text-emerald-400">+{o.actual_roas_lift_pct}%</span>
                    <span className="text-slate-500 text-xs font-normal"> / +{o.predicted_roas_lift_pct}% pred</span>
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px]">Net Margin Delta</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">
                    +${o.contribution_margin_delta?.toLocaleString() || "0"}
                  </div>
                </div>
              </div>

              {/* Learning Retrospective Notes */}
              <div className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 flex items-start space-x-2">
                <Brain className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-300">Continuous Learning Retrospective: </strong>
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
