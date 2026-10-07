"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  ShoppingCart,
  TrendingDown,
  CheckCircle2,
  MoreVertical,
} from "lucide-react";
import CircularProgressArc from "@/components/CircularProgressArc";
import StackedLifetimeSalesChart from "@/components/StackedLifetimeSalesChart";
import GeographyCard from "@/components/GeographyCard";
import DecisionExecutionBanner from "@/components/DecisionExecutionBanner";

interface CommandCenterProps {
  kpis: any;
  timeseries: any[];
  inventory: any[];
  topDecision?: any;
  onRefresh?: () => void;
}

export default function CommandCenter({
  kpis,
  timeseries,
  inventory,
  topDecision,
  onRefresh,
}: CommandCenterProps) {
  // Format numbers cleanly with Rupee or Dollar sign
  const formatCurrency = (val: number) => {
    return `$${Math.round(val || 0).toLocaleString("en-US")}`;
  };

  const revenueVal = kpis?.total_revenue_daily ?? 9810;
  const netProfitVal = kpis?.net_contribution_margin ?? 3802;
  const adSpendVal = kpis?.total_ad_spend_daily ?? 3100;
  const roasVal = kpis?.blended_roas ? `${kpis.blended_roas}x` : "3.16x";
  const profitMarginPct = kpis?.net_contribution_margin_pct ?? 38.8;

  return (
    <div className="space-y-6">
      {/* Row of 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Revenue / Total Sales */}
        <div className="netic-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#fff7ed] dark:bg-[#7c2d12]/30 flex items-center justify-center text-[#f97316]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <button className="text-slate-300 dark:text-slate-600 hover:text-slate-500 transition">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Revenue</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ffedd5] text-[#ea580c]">
                  Daily Active
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(revenueVal)}
              </div>
            </div>

            <CircularProgressArc percentage={68} color="#f97316" size={62} strokeWidth={5} />
          </div>
        </div>

        {/* Card 2: Net Contribution Margin / Profit */}
        <div className="netic-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] dark:bg-[#1e3a8a]/30 flex items-center justify-center text-[#3b82f6]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <button className="text-slate-300 dark:text-slate-600 hover:text-slate-500 transition">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Net Profit</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#dbeafe] text-[#2563eb]">
                  {profitMarginPct}% Margin
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(netProfitVal)}
              </div>
            </div>

            <CircularProgressArc percentage={Math.min(100, Math.round(profitMarginPct * 2))} color="#3b82f6" size={62} strokeWidth={5} />
          </div>
        </div>

        {/* Card 3: Ad Spend */}
        <div className="netic-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#fff1f2] dark:bg-[#881337]/30 flex items-center justify-center text-[#f43f5e]">
              <TrendingDown className="w-5 h-5" />
            </div>
            <button className="text-slate-300 dark:text-slate-600 hover:text-slate-500 transition">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ad Spend</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ffe4e6] text-[#e11d48]">
                  {kpis?.active_campaign_count ?? 4} Active
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(adSpendVal)}
              </div>
            </div>

            <CircularProgressArc percentage={55} color="#f43f5e" size={62} strokeWidth={5} />
          </div>
        </div>

        {/* Card 4: Blended ROAS */}
        <div className="netic-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] dark:bg-[#064e3b]/30 flex items-center justify-center text-[#10b981]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <button className="text-slate-300 dark:text-slate-600 hover:text-slate-500 transition">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Blended ROAS</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#dcfce7] text-[#16a34a]">
                  MER {kpis?.blended_mer ?? "2.91"}
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {roasVal}
              </div>
            </div>

            <CircularProgressArc percentage={Math.min(100, Math.round((kpis?.blended_roas || 3.16) * 22))} color="#10b981" size={62} strokeWidth={5} />
          </div>
        </div>
      </div>

      {/* Middle Row: Lifetime Sales (Stacked Bars) & Geography */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <StackedLifetimeSalesChart timeseries={timeseries} />
        </div>
        <div className="lg:col-span-4">
          <GeographyCard />
        </div>
      </div>

      {/* Bottom Row: The Decision Execution Banner */}
      <DecisionExecutionBanner topDecision={topDecision} onRefresh={onRefresh} />
    </div>
  );
}
