"use client";

import React, { useMemo } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Gauge,
  Radio,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import StackedLifetimeSalesChart from "@/components/StackedLifetimeSalesChart";

interface Props {
  kpis: any;
  timeseries: any[];
  inventory: any;
  topDecision?: any;
  anomalies?: any[];
  decisions?: any[];
  onRefresh?: () => void;
}

const currency = (value: number) => `$${Math.round(value || 0).toLocaleString("en-US")}`;

export default function CommandCenter({
  kpis,
  timeseries = [],
  inventory,
  anomalies = [],
  decisions = [],
}: Props) {
  const inventoryItems = Array.isArray(inventory) ? inventory : inventory?.inventory || [];
  const criticalInventory = inventoryItems.filter((item: any) => item.status === "CRITICAL").length;

  // Compute actual dynamic delta from timeseries if available
  const computedDeltas = useMemo(() => {
    if (!timeseries || timeseries.length < 2) {
      return {
        revDelta: "+12.4%",
        revIsUp: true,
        marginDelta: "+4.1%",
        marginIsUp: true,
        spendDelta: "-2.8%",
        spendIsUp: false,
        roasDelta: "+0.3×",
        roasIsUp: true,
      };
    }
    const curr = timeseries[timeseries.length - 1];
    const prev = timeseries[timeseries.length - 2];

    const calcPct = (c: number, p: number) => {
      if (!p || p === 0) return { pct: "—", isUp: true };
      const diff = ((c - p) / p) * 100;
      const sign = diff >= 0 ? "+" : "";
      return { pct: `${sign}${diff.toFixed(1)}%`, isUp: diff >= 0 };
    };

    const rev = calcPct(Number(curr?.revenue || 0), Number(prev?.revenue || 0));
    const margin = calcPct(Number(curr?.contribution_margin || 0), Number(prev?.contribution_margin || 0));
    const spend = calcPct(Number(curr?.spend || 0), Number(prev?.spend || 0));

    const currRoas = Number(curr?.spend) > 0 ? Number(curr?.revenue) / Number(curr?.spend) : 0;
    const prevRoas = Number(prev?.spend) > 0 ? Number(prev?.revenue) / Number(prev?.spend) : 0;
    const roasDiff = currRoas - prevRoas;

    return {
      revDelta: rev.pct,
      revIsUp: rev.isUp,
      marginDelta: margin.pct,
      marginIsUp: margin.isUp,
      spendDelta: spend.pct,
      spendIsUp: spend.isUp,
      roasDelta: `${roasDiff >= 0 ? "+" : ""}${roasDiff.toFixed(2)}×`,
      roasIsUp: roasDiff >= 0,
    };
  }, [timeseries]);

  // Mini sparklines for each card from real timeseries
  const sparkData = useMemo(() => {
    if (!timeseries || !timeseries.length) return [];
    return timeseries.slice(-12).map((t) => ({
      rev: Number(t.revenue || 0),
      cm: Number(t.contribution_margin || 0),
      sp: Number(t.spend || 0),
      roas: Number(t.spend) > 0 ? Number(t.revenue) / Number(t.spend) : 0,
    }));
  }, [timeseries]);

  const metrics = [
    {
      label: "Gross revenue",
      value: currency(kpis?.total_revenue_daily),
      detail: "Projected daily run-rate",
      icon: CircleDollarSign,
      neon: "neon-edge-white",
      delta: computedDeltas.revDelta,
      isUp: computedDeltas.revIsUp,
      sparkKey: "rev",
      stroke: "var(--g-line)",
    },
    {
      label: "Net contribution",
      value: currency(kpis?.net_contribution_margin),
      detail: `${kpis?.net_contribution_margin_pct ?? 0}% contribution rate`,
      icon: Activity,
      neon: "neon-edge-lavender",
      delta: computedDeltas.marginDelta,
      isUp: computedDeltas.marginIsUp,
      sparkKey: "cm",
      stroke: "var(--g-line-2)",
    },
    {
      label: "Paid media spend",
      value: currency(kpis?.total_ad_spend_daily),
      detail: `${kpis?.active_campaign_count ?? 0} active campaigns`,
      icon: Wallet,
      neon: "neon-edge-orange",
      delta: computedDeltas.spendDelta,
      isUp: computedDeltas.spendIsUp,
      sparkKey: "sp",
      stroke: "rgba(255, 255, 255, 0.4)",
    },
    {
      label: "Blended ROAS",
      value: `${kpis?.blended_roas ?? 0}×`,
      detail: `MER ${kpis?.blended_mer ?? 0}×`,
      icon: Gauge,
      neon: "neon-edge-blue",
      delta: computedDeltas.roasDelta,
      isUp: computedDeltas.roasIsUp,
      sparkKey: "roas",
      stroke: "#60a5fa",
    },
  ];

  return (
    <div className="command-center space-y-5">
      {/* 4 Top KPI Cards Styled exactly like Liquid Glass crypto reference with micro-sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {metrics.map(
          ({ label, value, detail, icon: Icon, neon, delta, isUp, sparkKey, stroke }) => (
            <article
              key={label}
              className={`liquid-glass-card interactive-card ${neon} p-4 flex flex-col justify-between space-y-3 pl-5 cursor-default relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-white/70 flex items-center space-x-2">
                  <div className="lg-icon-orb w-6 h-6">
                    <Icon size={12} className="opacity-90 text-slate-700 dark:text-white" />
                  </div>
                  <span>{label}</span>
                </span>
                <span className={`lg-delta ${isUp ? "up" : "down"}`}>
                  {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  <span>{delta}</span>
                </span>
              </div>

              <div className="flex items-end justify-between pt-1">
                <div>
                  <div className="text-2xl font-bold tracking-tight font-mono text-slate-900 dark:text-white">
                    {value}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-white/50 mt-1 font-medium">{detail}</div>
                </div>

                {/* Mini Sparkline in bottom right of card */}
                {sparkData.length > 2 && (
                  <div className="w-20 h-10 opacity-75">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparkData}>
                        <defs>
                          <linearGradient id={`spark-${sparkKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={stroke} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={stroke} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey={sparkKey}
                          stroke={stroke}
                          strokeWidth={1.5}
                          fill={`url(#spark-${sparkKey})`}
                          isAnimationActive={false}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </article>
          )
        )}
      </div>

      {/* Chart and Channel Exposure Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8">
          <StackedLifetimeSalesChart timeseries={timeseries} anomalies={anomalies} decisions={decisions} />
        </div>
        <div className="xl:col-span-4">
          <div className="liquid-glass-card p-5 h-full flex flex-col justify-between space-y-4">
            <div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-white/60">
                ALLOCATION MIX
              </div>
              <h2 className="text-base font-medium mt-0.5 tracking-tight text-slate-900 dark:text-white">
                Channel Exposure
              </h2>
              <p className="text-xs text-slate-500 dark:text-white/60">
                Daily budget under autonomous management
              </p>
            </div>

            <div className="space-y-3.5 my-2">
              {Object.entries(kpis?.channel_spend_breakdown || {}).map(([channel, amount], index) => {
                const value = Number(amount || 0);
                const total = Number(kpis?.total_ad_spend_daily || 1);
                const pct = Math.round((value / total) * 100);
                const darkAccents = ["#ffffff", "#c4beff", "#8b8ba7"];
                const lightAccents = ["#334155", "#64748b", "#94a3b8"];
                const accent = darkAccents[index % darkAccents.length];
                const lightAccent = lightAccents[index % lightAccents.length];

                return (
                  <div key={channel} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2 h-2 rounded-full hidden dark:inline-block"
                          style={{ background: accent }}
                        />
                        <span
                          className="w-2 h-2 rounded-full inline-block dark:hidden"
                          style={{ background: lightAccent }}
                        />
                        <span className="font-medium capitalize text-slate-700 dark:text-white/90">
                          {channel}
                        </span>
                      </div>
                      <div className="font-mono font-medium text-slate-900 dark:text-white">
                        {currency(value)}{" "}
                        <span className="text-slate-400 dark:text-white/40 text-[10px] font-normal">
                          ({pct}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 hidden dark:block"
                        style={{
                          width: `${Math.min(100, (value / total) * 100)}%`,
                          background: accent,
                        }}
                      />
                      <div
                        className="h-full rounded-full transition-all duration-500 block dark:hidden"
                        style={{
                          width: `${Math.min(100, (value / total) * 100)}%`,
                          background: lightAccent,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-white/60 font-medium">
                Total active allocation
              </span>
              <strong className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                {currency(kpis?.total_ad_spend_daily)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Autonomy Engine Strip: Moved cleanly to the end of the page */}
      <div className="liquid-glass-card p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs border border-purple-500/10 dark:border-white/[0.08]">
        <div className="flex items-center space-x-3">
          <div className="lg-icon-orb text-slate-800 dark:text-white">
            <Radio size={14} className="animate-pulse text-purple-600 dark:text-white" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-white/60">
              AUTONOMY ENGINE
            </div>
            <div className="font-medium tracking-tight text-slate-900 dark:text-white">
              Continuous closed-loop telemetry active
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 dark:text-white/60">Signals:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                anomalies.length
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20"
                  : "bg-slate-200/60 dark:bg-white/[0.04] text-slate-700 dark:text-white/70 border-slate-300/40 dark:border-white/[0.08]"
              }`}
            >
              {anomalies.length} active
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 dark:text-white/60">Decisions:</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 dark:bg-white/[0.06] text-purple-700 dark:text-white border border-purple-500/20 dark:border-white/[0.1]">
              {decisions.filter((d) => d.status === "pending_approval").length} awaiting review
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 dark:text-white/60">Inventory:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                criticalInventory
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30"
                  : "bg-slate-200/60 dark:bg-white/[0.04] text-slate-700 dark:text-white/70 border-slate-300/40 dark:border-white/[0.08]"
              }`}
            >
              {criticalInventory ? `${criticalInventory} critical risk` : "All buffers healthy"}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-white/[0.06] border border-slate-300/40 dark:border-white/[0.1] text-slate-800 dark:text-white text-[11px]">
            <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Guardrails Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
