"use client";

import React, { useState } from "react";
import { AlertTriangle, AlertCircle, Info, Activity, ChevronDown, ChevronUp } from "lucide-react";

interface AnomalyExplorerProps {
  anomalies: any[];
}

export default function AnomalyExplorer({ anomalies }: AnomalyExplorerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffe4e6] text-[#e11d48]">
            <AlertCircle className="w-3 h-3 mr-1" /> CRITICAL
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffedd5] text-[#ea580c]">
            <AlertTriangle className="w-3 h-3 mr-1" /> HIGH
          </span>
        );
      case "medium":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f5f3ff] text-[#635bff]">
            <Info className="w-3 h-3 mr-1" /> MEDIUM
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white">
          Statistical Anomaly & Root Cause Diagnosis
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time tracking of spend velocity deviations, inventory runout hazards, audience fatigue, and contribution margin compression.
        </p>
      </div>

      <div className="space-y-4">
        {anomalies.length === 0 ? (
          <div className="netic-card p-10 text-center">
            <Activity className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              All channels operating within expected statistical baselines
            </p>
          </div>
        ) : (
          anomalies.map((a) => {
            const isExpanded = expandedId === a.id;
            return (
              <div key={a.id} className="netic-card p-5 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    {getSeverityBadge(a.severity)}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {a.channel}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {a.anomaly_type.replace("_", " ")}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Detector: {a.detector_name || "Rolling Z-score"}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
                    <span>
                      Deviation: <span className="text-[#635bff] font-bold">{a.deviation_pct ?? (a.z_score * 15).toFixed(1)}%</span> ({a.z_score?.toFixed(2)}σ)
                    </span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : a.id)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition"
                      title="Inspect Structured Evidence"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-slate-400">Campaign / SKU:</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{a.campaign_name}</div>
                    <div className="text-slate-400 text-[11px]">{a.sku_name}</div>
                  </div>

                  <div>
                    <div className="text-slate-400">Metric Breakdown:</div>
                    <div className="mt-0.5 flex items-baseline space-x-2 font-mono">
                      <span className="text-[#e11d48] font-bold">Current: {a.current_value}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-slate-500">Baseline: {a.baseline_value}</span>
                      <span className="text-slate-400 text-[11px]">({a.metric_name})</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-bold text-[#ea580c] text-[10px] uppercase tracking-wider block mb-1">
                    Synthesized Root Cause:
                  </span>
                  {a.root_cause_summary}
                </div>

                {/* Structured Evidence Package (Accordion) */}
                {isExpanded && a.evidence_package && (
                  <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs space-y-2 font-mono animate-in fade-in">
                    <div className="font-bold text-indigo-400 text-[11px]">
                      // STRUCTURED EVIDENCE PACKAGE:
                    </div>
                    <pre className="text-[11px] overflow-x-auto text-slate-300">
                      {JSON.stringify(a.evidence_package, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
