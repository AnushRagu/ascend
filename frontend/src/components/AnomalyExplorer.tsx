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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-200 border border-purple-500/50">
            <AlertCircle className="w-3 h-3 mr-1 text-purple-400" /> CRITICAL SIGNAL
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/50 text-purple-200 border border-purple-500/35">
            <AlertTriangle className="w-3 h-3 mr-1 text-purple-300" /> HIGH DEVIATION
          </span>
        );
      case "medium":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
            <Info className="w-3 h-3 mr-1 text-purple-400" /> MODERATE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-purple-100">
          Statistical Anomaly & Root Cause Diagnosis
        </h3>
        <p className="text-xs text-slate-400 dark:text-purple-300/50 mt-0.5">
          Real-time tracking of spend velocity deviations, inventory runout hazards, audience fatigue, and contribution margin compression.
        </p>
      </div>

      <div className="space-y-4">
        {anomalies.length === 0 ? (
          <div className="liquid-glass-card p-10 text-center animate-fade-in border border-purple-500/15">
            <Activity className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-purple-200">
              All channels operating within expected statistical baselines
            </p>
          </div>
        ) : (
          anomalies.map((a, idx) => {
            const isExpanded = expandedId === a.id;
            return (
              <div
                key={a.id}
                className={`liquid-glass-card interactive-card p-5 space-y-3 animate-stagger-${Math.min(4, idx + 1)} border-l-4 border-l-purple-500 border border-purple-500/15`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="relative flex">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-purple-400" />
                      {getSeverityBadge(a.severity)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {a.channel}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-purple-100">
                      {a.anomaly_type.replace("_", " ")}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/05 text-purple-400/80 border border-purple-500/10">
                      Detector: {a.detector_name || "Rolling Z-score"}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 dark:text-purple-300/60 flex items-center space-x-2">
                    <span>
                      Deviation: <span className="text-purple-400 font-bold">{a.deviation_pct ?? (a.z_score * 15).toFixed(1)}%</span> ({a.z_score?.toFixed(2)}σ)
                    </span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : a.id)}
                      className="p-1 rounded hover:bg-purple-500/10 text-purple-400 transition"
                      title="Inspect Structured Evidence"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-slate-400 dark:text-purple-300/60">Campaign / SKU:</div>
                    <div className="font-semibold text-slate-800 dark:text-purple-200 mt-0.5">{a.campaign_name}</div>
                    <div className="text-purple-400/70 text-[11px]">{a.sku_name}</div>
                  </div>

                  <div>
                    <div className="text-slate-400 dark:text-purple-300/60">Metric Breakdown:</div>
                    <div className="mt-0.5 flex items-baseline space-x-2 font-mono">
                      <span className="text-purple-300 font-bold">Current: {a.current_value}</span>
                      <span className="text-purple-400/40">/</span>
                      <span className="text-purple-400/60">Baseline: {a.baseline_value}</span>
                      <span className="text-purple-400/60 text-[11px]">({a.metric_name})</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-500/05 dark:bg-[#07070a] border border-purple-500/15 text-xs text-slate-600 dark:text-purple-200/80 leading-relaxed">
                  <span className="font-bold text-purple-400 text-[10px] uppercase tracking-wider block mb-1">
                    Synthesized Root Cause:
                  </span>
                  {a.root_cause_summary}
                </div>

                {/* Structured Evidence Package (Accordion) */}
                {isExpanded && a.evidence_package && (
                  <div className="p-3.5 rounded-xl bg-[#07070a] text-purple-200 text-xs space-y-2 font-mono animate-in fade-in border border-purple-500/20">
                    <div className="font-bold text-purple-400 text-[11px]">
                      // STRUCTURED EVIDENCE PACKAGE:
                    </div>
                    <pre className="text-[11px] overflow-x-auto text-purple-300/80">
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
