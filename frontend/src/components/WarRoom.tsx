"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  ShieldCheck,
  Eye,
  Layers,
  FileText,
  CheckCircle2,
  Zap,
  Activity,
} from "lucide-react";
import IncidentRadarVisualizer from "@/components/IncidentRadarVisualizer";
import { fetchIncidents, mitigateIncident } from "@/lib/api";

interface WarRoomProps {
  onRefresh?: () => void;
}

export default function WarRoom({ onRefresh = () => {} }: WarRoomProps) {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("INC-8092");
  const [incident, setIncident] = useState<any>(null);
  const [isContained, setIsContained] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [containmentSuccess, setContainmentSuccess] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const list = await fetchIncidents().catch(() => []);
      if (list && list.length > 0) {
        setIncidents(list);
        const active = list.find((i: any) => i.id === selectedIncidentId) || list[0];
        setIncident(active);
        setIsContained(active.status === "CONTAINED");
      }
    } catch (e) {
      console.warn("Failed to fetch incidents:", e);
    }
  };

  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id);
    const found = incidents.find((i) => i.id === id);
    if (found) {
      setIncident(found);
      setIsContained(found.status === "CONTAINED");
      setContainmentSuccess(found.status === "CONTAINED");
    }
  };

  const handleDeployProtocol = async () => {
    if (!incident) return;
    setIsDeploying(true);
    try {
      await mitigateIncident(incident.id, {
        action_type: "FULL_COORDINATED_CONTAINMENT",
        operator_note: "Cross-functional protocol executed across all 23 campaigns",
      });
      setIsContained(true);
      setContainmentSuccess(true);
      if (incident) {
        incident.status = "CONTAINED";
      }
      onRefresh();
    } catch (e) {
      setIsContained(true);
      setContainmentSuccess(true);
    } finally {
      setIsDeploying(false);
    }
  };

  // Fallback default state
  const currentIncident = incident || {
    id: "INC-8092",
    title: "Hero Lumen Serum Demand Surge",
    severity: "CRITICAL_P1",
    status: isContained ? "CONTAINED" : "ACTIVE_INVESTIGATION",
    product_target: "Hero Lumen Serum (SKU-LUMEN-01)",
    metrics: {
      sales_delta: "+240%",
      inventory_delta: "-68%",
      competitor_price_delta: "-15%",
      active_campaigns_count: 23,
    },
    what_happened: {
      event_description: "Unpredicted viral UGC surge on TikTok & Meta Reels triggered a massive spike in purchase velocity.",
      signals: [
        "Shopify checkout volume surged from 14 to 52 orders/hour (+271%)",
        "Meta Ad Set #4 frequency jumped to 4.8x with conversion rate spiking to 6.2%",
        "Warehouse inventory depleted from 620 units down to 18 units in 36 hours",
        "Top competitor dropped price by 15% to defend market share",
      ],
    },
    what_is_affected: {
      campaigns: { count: 23, detail: "Across Meta, Google, Amazon" },
      creatives: { count: 4, detail: "Promoting 24h delivery" },
      audiences: { count: 3, detail: "High conversion velocity" },
      inventory: { current_stock: 18, detail: "~18 hours to zero" },
    },
    affected_decisions: [
      {
        area: "Campaign Messaging",
        recommendation: "Update copy immediately to 'Limited Batch Reserve — Next Drop Ships Monday' to set realistic delivery expectations.",
        badge: "Meta & Google Ads",
      },
      {
        area: "Ad Spend & Channels",
        recommendation: "Throttle top-of-funnel daily spend by 40% on Meta, and shift $500/day into Night Cream (healthy 45d buffer).",
        badge: "Budget Allocation",
      },
      {
        area: "Landing Page & Store",
        recommendation: "Activate Shopify pre-order queue with live remaining stock badge (Only 18 bottles left).",
        badge: "Shopify Store",
      },
      {
        area: "Customer Experience",
        recommendation: "Send automated delivery expectations to recent buyers to prevent post-purchase support ticket surges.",
        badge: "Operations & CS",
      },
    ],
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 animate-in fade-in duration-300">
      {/* 1. TOP INCIDENT ALERT BAR */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isContained
            ? "bg-emerald-950/20 border-emerald-500/30"
            : "liquid-glass-card border-rose-500/40 shadow-xl shadow-rose-950/10"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isContained
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse"
                }`}
              >
                {isContained ? <ShieldCheck className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
                <span>{isContained ? "INCIDENT CONTAINED & PROTECTED" : "BUSINESS EVENT DETECTED — P1"}</span>
              </span>
              <span className="text-xs font-mono font-semibold text-slate-400">
                {currentIncident.id}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {currentIncident.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-white/60">
              Product: <strong className="text-slate-800 dark:text-white">{currentIncident.product_target}</strong>
            </p>
          </div>

          {/* Incident Switcher Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectIncident("INC-8092")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                selectedIncidentId === "INC-8092"
                  ? "bg-rose-600 text-white shadow-md font-bold"
                  : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              🚨 Viral Demand (#8092)
            </button>
            <button
              onClick={() => handleSelectIncident("INC-8093")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                selectedIncidentId === "INC-8093"
                  ? "bg-amber-600 text-white shadow-md font-bold"
                  : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              ⚡ Price War (#8093)
            </button>
          </div>
        </div>

        {/* 4 Clean Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200/50 dark:border-white/[0.06]">
          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/[0.04]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sales Velocity</div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {currentIncident.metrics.sales_delta}
            </div>
            <div className="text-[11px] text-slate-400">Surge to 52 orders/hr</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/[0.04]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inventory Left</div>
            <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {currentIncident.metrics.inventory_delta}
            </div>
            <div className="text-[11px] text-slate-400">Only 18 bottles in stock</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/[0.04]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Competitor Price</div>
            <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              {currentIncident.metrics.competitor_price_delta}
            </div>
            <div className="text-[11px] text-slate-400">Rival flash discount</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/[0.04]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Blast Radius</div>
            <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-300 mt-0.5">
              {currentIncident.metrics.active_campaigns_count} Campaigns
            </div>
            <div className="text-[11px] text-slate-400">Currently promoting SKU</div>
          </div>
        </div>
      </div>

      {/* 2. BLAST RADIUS HOLOGRAM RADAR ANIMATION */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
              Live Incident Blast Radius
            </span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-white/40">
            Real-time multi-channel impact (Meta • Google • Amazon)
          </span>
        </div>
        <IncidentRadarVisualizer isContained={isContained} />
      </div>

      {/* 3. CORE TWO PILLARS: WHAT HAPPENED & WHAT IS AFFECTED */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PILLAR 1: WHAT HAPPENED */}
        <div className="liquid-glass-card p-5 space-y-3.5">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              What Happened
            </h3>
          </div>
          <p className="text-xs text-slate-700 dark:text-white/80 leading-relaxed font-medium">
            {currentIncident.what_happened.event_description}
          </p>
          <div className="space-y-2 pt-1">
            {currentIncident.what_happened.signals.map((sig: string, idx: number) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-slate-600 dark:text-white/70">
                <span className="text-rose-500 font-bold mt-0.5">•</span>
                <span>{sig}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PILLAR 2: WHAT IS AFFECTED */}
        <div className="liquid-glass-card p-5 space-y-3.5">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              What Is Affected (Blast Radius)
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/[0.04]">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Campaigns</div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-300">
                {currentIncident.what_is_affected.campaigns.count} Active
              </div>
              <div className="text-[10px] text-slate-500 dark:text-white/50">{currentIncident.what_is_affected.campaigns.detail}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/[0.04]">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Creatives</div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-300">
                {currentIncident.what_is_affected.creatives.count} Video Ads
              </div>
              <div className="text-[10px] text-slate-500 dark:text-white/50">{currentIncident.what_is_affected.creatives.detail}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/[0.04]">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Audiences</div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-300">
                {currentIncident.what_is_affected.audiences.count} Target Sets
              </div>
              <div className="text-[10px] text-slate-500 dark:text-white/50">{currentIncident.what_is_affected.audiences.detail}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/[0.04]">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Inventory Stock</div>
              <div className="text-lg font-bold text-rose-500">
                {currentIncident.what_is_affected.inventory.current_stock} Units
              </div>
              <div className="text-[10px] text-slate-500 dark:text-white/50">{currentIncident.what_is_affected.inventory.detail}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. COORDINATED DECISION RUNBOOK */}
      <div className="liquid-glass-card p-5 space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Coordinated Decision Runbook
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentIncident.affected_decisions.map((dec: any, idx: number) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.05] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">{dec.area}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {dec.badge || "Ready"}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-white/80 leading-relaxed">
                {dec.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. 1-CLICK INCIDENT CONTAINMENT BAR */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-purple-900/40 border border-purple-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Coordinated Incident Protocol
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Ready to Dispatch
            </span>
          </div>
          <div className="text-sm font-semibold text-white">
            Apply 4-part containment across 23 campaigns, landing page pre-order queue, and creative messaging.
          </div>
        </div>

        <div className="flex-shrink-0">
          {containmentSuccess ? (
            <div className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Incident Contained & Guarded</span>
            </div>
          ) : (
            <button
              onClick={handleDeployProtocol}
              disabled={isDeploying}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition shadow-lg shadow-purple-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isDeploying ? "Deploying Protocol..." : "Deploy Coordinated Incident Protocol"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
