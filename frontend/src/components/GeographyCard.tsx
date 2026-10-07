"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Plus, Minus } from "lucide-react";
import { fetchGeography } from "@/lib/api";

export default function GeographyCard() {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [geoData, setGeoData] = useState<any>({
    customer_share_pct: 68,
    conversion_share_pct: 40,
    primary_region: "United States"
  });

  useEffect(() => {
    fetchGeography()
      .then((data) => {
        if (data && data.customer_share_pct) {
          setGeoData(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="netic-card p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Geography</h3>
        <button className="flex items-center space-x-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 shadow-sm">
          <span>{geoData.primary_region || "Country"}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Map Illustration Area */}
      <div className="relative h-48 w-full flex items-center justify-center overflow-hidden my-auto">
        {/* Dot Matrix World Map Representation */}
        <svg
          viewBox="0 0 320 160"
          className="w-full h-full text-slate-200 dark:text-slate-700 transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* North America Dotted Cluster */}
          <g fill="currentColor">
            <circle cx="50" cy="40" r="1.5" /><circle cx="58" cy="38" r="1.5" /><circle cx="66" cy="38" r="1.5" />
            <circle cx="45" cy="46" r="1.5" /><circle cx="53" cy="46" r="1.5" /><circle cx="61" cy="46" r="1.5" /><circle cx="69" cy="46" r="1.5" /><circle cx="77" cy="46" r="1.5" />
            <circle cx="48" cy="54" r="1.5" /><circle cx="56" cy="54" r="1.5" /><circle cx="64" cy="54" r="1.5" /><circle cx="72" cy="54" r="1.5" /><circle cx="80" cy="54" r="1.5" />
            <circle cx="52" cy="62" r="1.5" /><circle cx="60" cy="62" r="1.5" /><circle cx="68" cy="62" r="1.5" /><circle cx="76" cy="62" r="1.5" />
            <circle cx="62" cy="70" r="1.5" /><circle cx="70" cy="70" r="1.5" />
            
            {/* South America */}
            <circle cx="80" cy="90" r="1.5" /><circle cx="88" cy="90" r="1.5" />
            <circle cx="82" cy="98" r="1.5" /><circle cx="90" cy="98" r="1.5" /><circle cx="98" cy="98" r="1.5" />
            <circle cx="84" cy="106" r="1.5" /><circle cx="92" cy="106" r="1.5" />
            <circle cx="86" cy="114" r="1.5" />

            {/* Europe */}
            <circle cx="150" cy="38" r="1.5" /><circle cx="158" cy="38" r="1.5" /><circle cx="166" cy="38" r="1.5" />
            <circle cx="146" cy="46" r="1.5" /><circle cx="154" cy="46" r="1.5" /><circle cx="162" cy="46" r="1.5" /><circle cx="170" cy="46" r="1.5" />
            <circle cx="152" cy="54" r="1.5" /><circle cx="160" cy="54" r="1.5" /><circle cx="168" cy="54" r="1.5" />

            {/* Africa */}
            <circle cx="154" cy="68" r="1.5" /><circle cx="162" cy="68" r="1.5" /><circle cx="170" cy="68" r="1.5" />
            <circle cx="150" cy="76" r="1.5" /><circle cx="158" cy="76" r="1.5" /><circle cx="166" cy="76" r="1.5" /><circle cx="174" cy="76" r="1.5" />
            <circle cx="156" cy="84" r="1.5" /><circle cx="164" cy="84" r="1.5" /><circle cx="172" cy="84" r="1.5" />
            <circle cx="160" cy="92" r="1.5" /><circle cx="168" cy="92" r="1.5" />
            <circle cx="164" cy="100" r="1.5" />

            {/* Asia */}
            <circle cx="190" cy="42" r="1.5" /><circle cx="198" cy="42" r="1.5" /><circle cx="206" cy="42" r="1.5" /><circle cx="214" cy="42" r="1.5" /><circle cx="222" cy="42" r="1.5" /><circle cx="230" cy="42" r="1.5" />
            <circle cx="186" cy="50" r="1.5" /><circle cx="194" cy="50" r="1.5" /><circle cx="202" cy="50" r="1.5" /><circle cx="210" cy="50" r="1.5" /><circle cx="218" cy="50" r="1.5" /><circle cx="226" cy="50" r="1.5" /><circle cx="234" cy="50" r="1.5" />
            <circle cx="200" cy="58" r="1.5" /><circle cx="208" cy="58" r="1.5" /><circle cx="216" cy="58" r="1.5" /><circle cx="224" cy="58" r="1.5" />
            <circle cx="206" cy="66" r="1.5" /><circle cx="214" cy="66" r="1.5" /><circle cx="222" cy="66" r="1.5" />

            {/* Australia */}
            <circle cx="240" cy="100" r="1.5" /><circle cx="248" cy="100" r="1.5" /><circle cx="256" cy="100" r="1.5" />
            <circle cx="242" cy="108" r="1.5" /><circle cx="250" cy="108" r="1.5" /><circle cx="258" cy="108" r="1.5" />
            <circle cx="246" cy="116" r="1.5" />
          </g>
        </svg>

        {/* Pin on US / Primary Region */}
        <div className="absolute top-[32%] left-[22%] flex flex-col items-center">
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 32 32" className="w-full h-full">
                <rect width="32" height="32" fill="#b91c1c" />
                <rect y="5" width="32" height="5" fill="#ffffff" />
                <rect y="15" width="32" height="5" fill="#ffffff" />
                <rect y="25" width="32" height="5" fill="#ffffff" />
                <rect width="15" height="17" fill="#1e3a8a" />
                <circle cx="7" cy="8" r="2.5" fill="#ffffff" />
              </svg>
            </div>
            <div className="w-2 h-2 rounded-full bg-slate-900 mx-auto mt-1" />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-1 left-1 flex flex-col space-y-1">
          <button
            onClick={() => setZoomLevel((prev) => Math.min(prev + 0.2, 1.6))}
            className="w-6 h-6 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((prev) => Math.max(prev - 0.2, 0.8))}
            className="w-6 h-6 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Metrics Bar */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            <span>Customer</span>
            <span className="font-bold">{geoData.customer_share_pct}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#2563eb] h-full rounded-full transition-all duration-300"
              style={{ width: `${geoData.customer_share_pct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            <span>Conversion</span>
            <span className="font-bold">{geoData.conversion_share_pct}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#f97316] h-full rounded-full transition-all duration-300"
              style={{ width: `${geoData.conversion_share_pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
