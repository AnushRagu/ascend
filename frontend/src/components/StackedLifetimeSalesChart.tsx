"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface StackedLifetimeSalesChartProps {
  timeseries?: any[];
}

export default function StackedLifetimeSalesChart({ timeseries }: StackedLifetimeSalesChartProps) {
  const [selectedFilter, setSelectedFilter] = useState("Daily");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // If real timeseries data is present from API, format last 12-14 days
  const chartData = (timeseries && timeseries.length > 0)
    ? timeseries.slice(-12).map((item: any) => {
        const dateParts = item.date ? item.date.split("-") : ["", "", ""];
        const dayLabel = dateParts.length === 3 ? `${dateParts[1]}/${dateParts[2]}` : item.date;
        const rev = Math.round(item.revenue || 0);
        const spend = Math.round(item.spend || 0);
        const cm = Math.round(item.contribution_margin || 0);
        return {
          label: dayLabel,
          sales: Math.round(spend / 10), // normalized unit scale
          order: Math.round(cm / 15),
          revenue: Math.round(rev / 25),
          rawRev: rev,
          rawSpend: spend,
          rawCm: cm
        };
      })
    : [
        { label: "Day 1", sales: 85, order: 45, revenue: 35, rawRev: 9400, rawSpend: 3100, rawCm: 3600 },
        { label: "Day 2", sales: 115, order: 48, revenue: 65, rawRev: 9800, rawSpend: 3100, rawCm: 3750 },
        { label: "Day 3", sales: 140, order: 45, revenue: 62, rawRev: 9600, rawSpend: 3100, rawCm: 3700 },
        { label: "Day 4", sales: 175, order: 65, revenue: 75, rawRev: 10200, rawSpend: 3100, rawCm: 3950 },
        { label: "Day 5", sales: 125, order: 55, revenue: 45, rawRev: 9500, rawSpend: 3100, rawCm: 3650 },
        { label: "Day 6", sales: 205, order: 65, revenue: 85, rawRev: 10600, rawSpend: 3100, rawCm: 4100 },
        { label: "Day 7", sales: 185, order: 55, revenue: 65, rawRev: 10100, rawSpend: 3100, rawCm: 3900 },
        { label: "Day 8", sales: 135, order: 50, revenue: 58, rawRev: 9700, rawSpend: 3100, rawCm: 3720 },
        { label: "Day 9", sales: 105, order: 55, revenue: 45, rawRev: 9300, rawSpend: 3100, rawCm: 3580 },
        { label: "Day 10", labelAlt: "D10", sales: 140, order: 55, revenue: 60, rawRev: 9850, rawSpend: 3100, rawCm: 3820 },
        { label: "Day 11", labelAlt: "D11", sales: 165, order: 65, revenue: 70, rawRev: 10400, rawSpend: 3100, rawCm: 4050 },
        { label: "Today", sales: 180, order: 65, revenue: 75, rawRev: 9810, rawSpend: 3100, rawCm: 3802 },
      ];

  const maxValue = 400; // top y-axis limit

  return (
    <div className="netic-card p-6 flex flex-col justify-between">
      {/* Top Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Lifetime Sales & Unit Economics</h3>
          {/* Legend */}
          <div className="flex items-center space-x-4 mt-2 text-xs">
            <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
              <span className="font-medium">Ad Spend Volume</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
              <span className="font-medium">Net Contribution</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
              <span className="font-medium">Gross Revenue</span>
            </span>
          </div>
        </div>

        {/* Filter Pill */}
        <div className="relative">
          <button className="flex items-center space-x-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 shadow-sm">
            <span>{selectedFilter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative h-64 w-full flex">
        {/* Y-Axis scale numbers */}
        <div className="h-full flex flex-col justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500 pr-3 select-none pb-6">
          <span>400</span>
          <span>300</span>
          <span>200</span>
          <span>100</span>
          <span>0</span>
        </div>

        {/* Chart area with dashed horizontal grid lines */}
        <div className="relative flex-1 h-full flex flex-col justify-between pb-6">
          {/* 5 dashed grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
            <div className="w-full border-b border-slate-100 dark:border-slate-800" />
            <div className="w-full border-b border-slate-100 dark:border-slate-800" />
            <div className="w-full border-b border-slate-100 dark:border-slate-800" />
            <div className="w-full border-b border-slate-100 dark:border-slate-800" />
            <div className="w-full border-b border-slate-100 dark:border-slate-800" />
          </div>

          {/* Bars container */}
          <div className="relative z-10 w-full h-full flex items-end justify-between px-2">
            {chartData.map((d: any, idx: number) => {
              const salesHeight = Math.min(100, (d.sales / maxValue) * 100);
              const orderHeight = Math.min(100, (d.order / maxValue) * 100);
              const revenueHeight = Math.min(100, (d.revenue / maxValue) * 100);
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={d.label + idx}
                  className="flex flex-col items-center flex-1 h-full justify-end cursor-pointer group"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 z-30 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-lg shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in">
                      <div className="font-bold">{d.label}</div>
                      <div>Rev: ${d.rawRev?.toLocaleString()} | CM: ${d.rawCm?.toLocaleString()}</div>
                    </div>
                  )}

                  {/* The 3-tier Stacked Bar */}
                  <div className="w-4 sm:w-5 md:w-6 flex flex-col justify-end transition-all duration-200 group-hover:brightness-105">
                    {/* Top: Cyan Revenue */}
                    <div
                      className="w-full bg-[#38bdf8] rounded-t-md mb-[2px]"
                      style={{ height: `${revenueHeight}%` }}
                    />
                    {/* Middle: Orange Order */}
                    <div
                      className="w-full bg-[#f97316] mb-[2px]"
                      style={{ height: `${orderHeight}%` }}
                    />
                    {/* Bottom: Blue Sales */}
                    <div
                      className="w-full bg-[#2563eb]"
                      style={{ height: `${salesHeight}%` }}
                    />
                  </div>

                  {/* X-axis Label */}
                  <div className="absolute -bottom-6 text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate max-w-[36px]">
                    {d.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
