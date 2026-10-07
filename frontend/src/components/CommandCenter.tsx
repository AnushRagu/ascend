"use client";

import React from "react";
import { Activity, ArrowDownRight, ArrowUpRight, CircleDollarSign, Gauge, Radio, ShieldCheck, Wallet } from "lucide-react";
import StackedLifetimeSalesChart from "@/components/StackedLifetimeSalesChart";
import DecisionExecutionBanner from "@/components/DecisionExecutionBanner";

interface Props { kpis: any; timeseries: any[]; inventory: any; topDecision?: any; anomalies?: any[]; decisions?: any[]; onRefresh?: () => void }
const currency = (value: number) => `$${Math.round(value || 0).toLocaleString("en-US")}`;

export default function CommandCenter({ kpis, timeseries, inventory, topDecision, anomalies = [], decisions = [], onRefresh }: Props) {
  const inventoryItems = Array.isArray(inventory) ? inventory : inventory?.inventory || [];
  const metrics = [
    { label: "Gross revenue", value: currency(kpis?.total_revenue_daily), detail: "Projected daily", icon: CircleDollarSign, tone: "teal", change: "Business state" },
    { label: "Net contribution", value: currency(kpis?.net_contribution_margin), detail: `${kpis?.net_contribution_margin_pct ?? 0}% contribution rate`, icon: Activity, tone: "violet", change: "Unit economics" },
    { label: "Paid media spend", value: currency(kpis?.total_ad_spend_daily), detail: `${kpis?.active_campaign_count ?? 0} active campaigns`, icon: Wallet, tone: "amber", change: "Across channels" },
    { label: "Blended ROAS", value: `${kpis?.blended_roas ?? 0}×`, detail: `MER ${kpis?.blended_mer ?? 0}×`, icon: Gauge, tone: "blue", change: "Efficiency" },
  ];
  const criticalInventory = inventoryItems.filter((item: any) => item.status === "CRITICAL").length;

  return <div className="command-center space-y-5">
    <div className="state-strip">
      <div className="state-intro"><div className="state-orb"><Radio size={17}/></div><div><div className="eyebrow">BUSINESS STATE</div><strong>Autonomy monitor</strong></div></div>
      <div className="state-item"><span>Signals</span><b className={anomalies.length ? "text-rose" : ""}>{anomalies.length} active</b></div>
      <div className="state-item"><span>Decisions</span><b>{decisions.filter((d) => d.status === "pending_approval").length} awaiting review</b></div>
      <div className="state-item"><span>Inventory risk</span><b className={criticalInventory ? "text-amber" : ""}>{criticalInventory ? `${criticalInventory} critical` : "Within guardrails"}</b></div>
      <div className="state-protected"><ShieldCheck size={15}/> Guardrails active</div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {metrics.map(({ label, value, detail, icon: Icon, tone, change }) => <article key={label} className={`netic-card kpi-card kpi-${tone}`}>
        <div className="kpi-top"><span className="kpi-icon"><Icon size={17}/></span><span className="kpi-change"><ArrowUpRight size={13}/>{change}</span></div>
        <div className="kpi-label">{label}</div><div className="kpi-value">{value}</div><div className="kpi-detail">{detail}</div>
      </article>)}
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      <div className="xl:col-span-8"><StackedLifetimeSalesChart timeseries={timeseries} anomalies={anomalies} decisions={decisions}/></div>
      <div className="xl:col-span-4"><div className="netic-card channel-card h-full">
        <div className="eyebrow">ALLOCATION MIX</div><h2>Channel exposure</h2><p className="channel-subtitle">Daily budget under management</p>
        {Object.entries(kpis?.channel_spend_breakdown || {}).map(([channel, amount], index) => {
          const value = Number(amount || 0); const total = Number(kpis?.total_ad_spend_daily || 1); const colors = ["#65d8d0", "#b29cff", "#f2ad69"];
          return <div key={channel} className="channel-row"><div className="channel-row-label"><span className="channel-mark" style={{ background: colors[index % colors.length] }}/><span>{channel}</span><b>{currency(value)}</b></div><div className="channel-track"><span style={{ width: `${Math.min(100, value / total * 100)}%`, background: colors[index % colors.length] }}/></div></div>;
        })}
        <div className="channel-total"><span>Total active allocation</span><strong>{currency(kpis?.total_ad_spend_daily)}</strong></div>
        <div className="channel-note"><ArrowDownRight size={14}/> Spend levels reflect current campaign budgets</div>
      </div></div>
    </div>
    <DecisionExecutionBanner topDecision={topDecision} onRefresh={onRefresh}/>
  </div>;
}
