"use client";

import React, { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceDot } from "recharts";
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

  return <section className="netic-card chart-card">
    <div className="chart-heading">
      <div>
        <div className="eyebrow"><Activity size={13} /> LIVE BUSINESS TELEMETRY</div>
        <h2>Lifetime sales &amp; unit economics</h2>
        <p>Performance movement across revenue, contribution and paid media</p>
      </div>
      <div className="chart-status"><span className="status-pulse" /> {rows.length ? `${rows.length} telemetry periods` : "Awaiting telemetry"}</div>
    </div>
    <div className="chart-summary">
      <div><span className="metric-dot revenue-dot"/><span>Revenue</span><b>{active ? money(active.revenue) : "—"}</b></div>
      <div><span className="metric-dot contribution-dot"/><span>Contribution</span><b>{active ? money(active.contribution) : "—"}</b></div>
      <div><span className="metric-dot spend-dot"/><span>Ad spend</span><b>{active ? money(active.spend) : "—"}</b></div>
      <div className="period-label">{active?.date ? new Date(`${active.date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "Select a period"}</div>
    </div>
    <div className="chart-plot">
      {hasValues ? <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 12, right: 12, left: 2, bottom: 2 }} onMouseMove={(state: any) => { if (state?.activePayload?.[0]) setSelected(state.activePayload[0].payload); }} onMouseLeave={() => setSelected(null)}>
          <CartesianGrid stroke="var(--grid)" vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-tick)", fontSize: 11 }} minTickGap={28} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--chart-tick)", fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`} width={46} />
          <Tooltip content={() => null} />
          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--chart-revenue)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "var(--chart-revenue)", stroke: "var(--panel)", strokeWidth: 3 }} isAnimationActive animationDuration={600} />
          <Line type="monotone" dataKey="contribution" name="Contribution" stroke="var(--chart-contribution)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "var(--chart-contribution)", stroke: "var(--panel)", strokeWidth: 3 }} isAnimationActive animationDuration={700} />
          <Line type="monotone" dataKey="spend" name="Ad spend" stroke="var(--chart-spend)" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4, fill: "var(--chart-spend)", stroke: "var(--panel)", strokeWidth: 2 }} isAnimationActive animationDuration={500} />
          {anomalies.slice(0, 3).map((event, index) => {
            const date = (event.detected_at || event.timestamp || event.created_at || "").slice(0, 10);
            const point = rows.find((row) => row.date === date);
            return point ? <ReferenceDot key={`a-${event.id || index}`} x={point.label} y={point.revenue} r={5} fill="#fb7185" stroke="#190c12" /> : null;
          })}
          {decisions.filter((event) => event.status === "auto_executed" || event.status === "executed").slice(0, 3).map((event, index) => {
            const date = (event.executed_at || event.created_at || "").slice(0, 10);
            const point = rows.find((row) => row.date === date);
            return point ? <ReferenceDot key={`d-${event.id || index}`} x={point.label} y={point.contribution} r={5} fill="var(--chart-revenue)" stroke="var(--panel)" /> : null;
          })}
        </LineChart>
      </ResponsiveContainer> : <div className="chart-empty"><CircleHelp size={20}/><strong>No telemetry recorded yet</strong><span>Business movement will appear as ASCEND records operating data.</span></div>}
    </div>
    <div className="chart-footnote"><span><i className="event-key anomaly-key"/> Anomaly</span><span><i className="event-key decision-key"/> Executed decision</span><span className="chart-source">Source · ASCEND metric records</span></div>
  </section>;
}
