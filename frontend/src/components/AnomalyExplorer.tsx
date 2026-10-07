"use client";

import React from "react";
import { AlertTriangle, AlertCircle, Info, ShieldAlert, Activity } from "lucide-react";

interface AnomalyExplorerProps {
  anomalies: any[];
}

export default function AnomalyExplorer({ anomalies }: AnomalyExplorerProps) {
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertCircle className="w-3 h-3 mr-1" /> CRITICAL
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3 mr-1" /> HIGH
          </span>
        );
      case "medium":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <Info className="w-3 h-3 mr-1" /> MEDIUM
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white">Statistical Anomaly & Root Cause Diagnosis</h3>
        <p className="text-xs text-slate-400">
          Continuous monitoring across spend velocity, inventory runout, audience creative fatigue, and margin thresholds.
        </p>
      </div>

      <div className="space-y-4">
        {anomalies.length === 0 ? (
          <div className="glass-panel p-10 text-center rounded-xl border border-slate-800">
            <Activity className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300">All channels operating within expected statistical baselines</p>
          </div>
        ) : (
          anomalies.map((a) => (
            <div key={a.id} className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  {getSeverityBadge(a.severity)}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                    {a.channel}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {a.anomaly_type.replace("_", " ")}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  Z-Score: <span className="text-slate-200 font-bold">{a.z_score.toFixed(2)}σ</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-400">Campaign / SKU:</div>
                  <div className="font-semibold text-white mt-0.5">{a.campaign_name}</div>
                  <div className="text-slate-400 text-[11px]">{a.sku_name}</div>
                </div>

                <div>
                  <div className="text-slate-400">Metric Deviation:</div>
                  <div className="mt-0.5 flex items-baseline space-x-2 font-mono">
                    <span className="text-rose-400 font-bold">Current: {a.current_value}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-400">Baseline: {a.baseline_value}</span>
                    <span className="text-slate-500 text-[11px]">({a.metric_name})</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-amber-300 text-[10px] uppercase tracking-wide block mb-1">
                  Root Cause Synthesis:
                </span>
                {a.root_cause_summary}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
