"use client";

import React, { useMemo, useState } from "react";
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceDot } from "recharts";
import { Activity, CircleHelp } from "lucide-react";

interface Props { timeseries?: any[]; anomalies?: any[]; decisions?: any[] }
const money = (value: number) => `$${Math.round(value || 0).toLocaleString("en-US")}`;

export default function StackedLifetimeSalesChart({ timeseries = [], anomalies = [], decisions = [] }: Props) {
  const [selected, setSelected] = useState<any>(null);

  const rows = useMemo(() => timeseries.map((item) => ({
    ...item,
    label: item.date ? new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—",
    revenue: Number(item.revenue || 0),
    contribution: Number(item.contribution_margin || 0),
    spend: Number(item.spend || 0),
  })), [timeseries]);

  const active = selected || rows[rows.length - 1];
  const hasValues = rows.some((row) => row.revenue || row.contribution || row.spend);

  // Peak point to display subtle highlight reference dot
  const peakPoint = useMemo(() => {
    if (!rows.length) return null;
    return rows.reduce((max, curr) => (curr.revenue > (max?.revenue || 0) ? curr : max), rows[0]);
  }, [rows]);

  return (
    <section className="liquid-glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold tracking-wider uppercase flex items-center space-x-1.5 opacity-70">
            <Activity size={13} />
            <span>LIVE BUSINESS TELEMETRY</span>
          </div>
          <h2 className="text-base font-medium mt-0.5 tracking-tight">Lifetime Sales & Unit Economics</h2>
          <p className="text-xs opacity-60">Continuous telemetry movement across revenue, contribution and paid ad spend</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
          <span className="live-glow-dot" />
          <span>{rows.length ? `${rows.length} telemetry periods` : "Awaiting telemetry"}</span>
        </div>
      </div>

      {/* Metric Legend & Current Probe Value */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
            <span className="opacity-60">Revenue:</span>
            <b className="font-mono text-white tracking-tight">{active ? money(active.revenue) : "—"}</b>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c4beff] shadow-sm" />
            <span className="opacity-60">Contribution:</span>
            <b className="font-mono text-white tracking-tight">{active ? money(active.contribution) : "—"}</b>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white/40 shadow-sm" />
            <span className="opacity-60">Ad spend:</span>
            <b className="font-mono text-white tracking-tight">{active ? money(active.spend) : "—"}</b>
          </div>
        </div>
        <div className="text-[11px] font-mono font-medium opacity-80">
          {active?.date ? new Date(`${active.date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "Hover graph to inspect point"}
        </div>
      </div>

      {/* Area Chart Container */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {hasValues ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={rows}
              margin={{ top: 12, right: 12, left: -10, bottom: 2 }}
              onMouseMove={(state: any) => { if (state?.activePayload?.[0]) setSelected(state.activePayload[0].payload); }}
              onMouseLeave={() => setSelected(null)}
            >
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--g-fill)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--g-fill)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="contribFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--g-line-2)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--g-line-2)" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="var(--g-grid)" vertical={false} strokeDasharray="3 4" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--g-tick)", fontSize: 11 }} minTickGap={28} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--g-tick)", fontSize: 11 }}
                tickFormatter={(v) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`}
                width={48}
              />

              <Tooltip
                content={({ active: isTooltipActive, payload }) => {
                  if (isTooltipActive && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="lg-tooltip space-y-1.5 min-w-[150px]">
                        <div className="font-mono text-[10px] tracking-wider uppercase opacity-70 pb-0.5 border-b border-white/[0.08]">{data.label}</div>
                        <div className="flex items-center justify-between space-x-3">
                          <span className="opacity-80">Revenue:</span>
                          <b className="font-mono">{money(data.revenue)}</b>
                        </div>
                        <div className="flex items-center justify-between space-x-3">
                          <span className="opacity-80">Contribution:</span>
                          <b className="font-mono">{money(data.contribution)}</b>
                        </div>
                        <div className="flex items-center justify-between space-x-3">
                          <span className="opacity-80">Ad spend:</span>
                          <b className="font-mono">{money(data.spend)}</b>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Area 1: Revenue (Clean white glowing curve + transparent gradient) */}
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="var(--g-line)"
                strokeWidth={2}
                fill="url(#revenueFill)"
                activeDot={{ r: 5, fill: "var(--g-line)", stroke: "var(--g-dot-stroke)", strokeWidth: 2 }}
                isAnimationActive
                animationDuration={850}
                animationEasing="ease-out"
              />

              {/* Area 2: Contribution Margin (Soft lavender/light accent) */}
              <Area
                type="monotone"
                dataKey="contribution"
                name="Contribution"
                stroke="var(--g-line-2)"
                strokeWidth={1.8}
                fill="url(#contribFill)"
                activeDot={{ r: 4, fill: "var(--g-line-2)", stroke: "var(--g-dot-stroke)", strokeWidth: 2 }}
                isAnimationActive
                animationDuration={950}
                animationEasing="ease-out"
              />

              {/* Line 3: Spend (Dashed subtle guide) */}
              <Area
                type="monotone"
                dataKey="spend"
                name="Ad spend"
                stroke="var(--g-line-3)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="transparent"
                activeDot={{ r: 4, fill: "var(--g-line-3)", stroke: "var(--g-dot-stroke)", strokeWidth: 1.5 }}
                isAnimationActive
                animationDuration={750}
                animationEasing="ease-out"
              />

              {/* Peak reference dot indicator */}
              {peakPoint && peakPoint.revenue > 0 && (
                <ReferenceDot
                  x={peakPoint.label}
                  y={peakPoint.revenue}
                  r={4.5}
                  fill="var(--g-line)"
                  stroke="var(--g-dot-stroke)"
                  strokeWidth={2}
                />
              )}

              {/* Anomaly markers */}
              {anomalies.slice(0, 3).map((event, index) => {
                const date = (event.detected_at || event.timestamp || event.created_at || "").slice(0, 10);
                const point = rows.find((row) => row.date === date);
                return point ? (
                  <ReferenceDot
                    key={`a-${event.id || index}`}
                    x={point.label}
                    y={point.revenue}
                    r={5}
                    fill="#f43f5e"
                    stroke="var(--g-dot-stroke)"
                    strokeWidth={2}
                  />
                ) : null;
              })}

              {/* Executed decision markers */}
              {decisions.filter((event) => event.status === "auto_executed" || event.status === "executed").slice(0, 3).map((event, index) => {
                const date = (event.executed_at || event.created_at || "").slice(0, 10);
                const point = rows.find((row) => row.date === date);
                return point ? (
                  <ReferenceDot
                    key={`d-${event.id || index}`}
                    x={point.label}
                    y={point.contribution}
                    r={5}
                    fill="#38bdf8"
                    stroke="var(--g-dot-stroke)"
                    strokeWidth={2}
                  />
                ) : null;
              })}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <CircleHelp size={20} />
            <strong>No telemetry recorded yet</strong>
            <span className="text-xs">Business movement will appear as ASCEND records operating data.</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] opacity-60">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /><span>Anomaly detected</span></span>
          <span className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /><span>Executed decision</span></span>
        </div>
        <span className="font-medium">Source · ASCEND Telemetry Records</span>
      </div>
    </section>
  );
}
