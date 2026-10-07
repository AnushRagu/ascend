"use client";

import React from "react";
import {
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface CommandCenterProps {
  kpis: any;
  timeseries: any[];
  inventory: any[];
}

export default function CommandCenter({ kpis, timeseries, inventory }: CommandCenterProps) {
  if (!kpis) return null;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blended MER */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Blended MER</span>
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tight text-white">{kpis.blended_mer}x</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% vs avg
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Net Sales / Total Ad Spend across all channels</p>
        </div>

        {/* Contribution Margin */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Net Contribution Margin</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tight text-white">${kpis.net_contribution_margin.toLocaleString()}</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              {kpis.net_contribution_margin_pct}% of Net
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">True profit after COGS, Shipping & Ad Spend</p>
        </div>

        {/* Daily Ad Spend */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Daily Ad Spend</span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tight text-white">${kpis.total_ad_spend_daily.toLocaleString()}</span>
            <span className="text-xs font-medium text-slate-400">
              {kpis.active_campaign_count} campaigns
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Meta, Google & Amazon blended pacing</p>
        </div>

        {/* Inventory Stockout Risk */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Inventory Health</span>
            <span className={`p-2 rounded-lg ${kpis.inventory_critical_count > 0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl font-bold tracking-tight ${kpis.inventory_critical_count > 0 ? "text-rose-400" : "text-white"}`}>
              {kpis.inventory_critical_count} At Risk
            </span>
            <span className="text-xs text-slate-400">SKUs &lt; 5d runout</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Autonomous spend throttle guards active</p>
        </div>
      </div>

      {/* Main Charts & Channel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Telemetry Area Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Multi-Channel Financial Efficiency Timeline</h3>
              <p className="text-xs text-slate-400">Daily Gross Revenue vs Ad Spend vs Net Contribution Margin</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              14-Day Rolling
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeseries}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="contribution_margin" name="Contribution Margin ($)" stroke="#10b981" fillOpacity={1} fill="url(#colorMargin)" strokeWidth={2} />
                <Area type="monotone" dataKey="spend" name="Ad Spend ($)" stroke="#f43f5e" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Allocation Split */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Cross-Channel Allocation</h3>
            <p className="text-xs text-slate-400">Current Daily Spend by Platform</p>
          </div>

          <div className="space-y-4 my-auto">
            {/* Meta */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-300">Meta Ads (Instagram / Facebook)</span>
                <span className="font-bold text-white">${kpis.channel_spend_breakdown?.meta || 0}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (kpis.channel_spend_breakdown?.meta / (kpis.total_ad_spend_daily || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Google */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-300">Google Ads (P-Max / Search)</span>
                <span className="font-bold text-white">${kpis.channel_spend_breakdown?.google || 0}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (kpis.channel_spend_breakdown?.google / (kpis.total_ad_spend_daily || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Amazon */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-300">Amazon Ads (Sponsored Products)</span>
                <span className="font-bold text-white">${kpis.channel_spend_breakdown?.amazon || 0}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (kpis.channel_spend_breakdown?.amazon / (kpis.total_ad_spend_daily || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Engine Note:</span> Target MER floor is set to 2.50x. Budget shift recommendations optimize contribution margin over vanity ROAS.
          </div>
        </div>
      </div>

      {/* SKU Inventory Health & Unit Economics */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">SKU Inventory Runout & Unit Margin Health</h3>
            <p className="text-xs text-slate-400">Live Shopify inventory cross-referenced with advertising spend capacity</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Product Name / SKU</th>
                <th className="py-2.5 px-3">Price</th>
                <th className="py-2.5 px-3">Stock Units</th>
                <th className="py-2.5 px-3">7D Velocity</th>
                <th className="py-2.5 px-3">Runout Days</th>
                <th className="py-2.5 px-3">Unit Margin</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {inventory.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 font-medium text-slate-200">
                    {s.name}
                    <div className="text-[10px] text-slate-400 font-mono">{s.sku}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-mono">${s.price}</td>
                  <td className="py-3 px-3 text-slate-200 font-semibold">{s.stock}</td>
                  <td className="py-3 px-3 text-slate-300">{s.velocity} / day</td>
                  <td className="py-3 px-3">
                    <span className={`font-mono font-bold ${s.runout_days <= 2 ? "text-rose-400" : s.runout_days <= 5 ? "text-amber-400" : "text-emerald-400"}`}>
                      {s.runout_days} days
                    </span>
                  </td>
                  <td className="py-3 px-3 text-emerald-400 font-semibold">{s.margin_pct}%</td>
                  <td className="py-3 px-3">
                    {s.status === "CRITICAL" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        <AlertCircle className="w-3 h-3 mr-1" /> STOCKOUT DANGER
                      </span>
                    ) : s.status === "WARNING" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        WARNING
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> HEALTHY
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
