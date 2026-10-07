"use client";

import React from "react";

interface CircularProgressArcProps {
  percentage?: number; // 0 to 100
  color: string;       // e.g. "#f97316", "#3b82f6", "#f43f5e", "#10b981"
  size?: number;       // diameter in px (default 56)
  strokeWidth?: number;// stroke thickness (default 5)
}

export default function CircularProgressArc({
  percentage = 65,
  color,
  size = 64,
  strokeWidth = 5,
}: CircularProgressArcProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // We only show a 240-degree arc max
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(10, percentage))) / 100;

  // Calculate endpoint of arc for the indicator dot
  const angle = (percentage / 100) * 270 - 135; // degrees
  const angleRad = (angle * Math.PI) / 180;
  const dotX = center + radius * Math.cos(angleRad);
  const dotY = center + radius * Math.sin(angleRad);

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[135deg]">
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />

        {/* Progress Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Endpoint accent dot */}
      <div
        className="absolute w-2 h-2 rounded-full shadow-sm pointer-events-none transition-all duration-700 ease-out"
        style={{
          backgroundColor: color,
          top: dotY - 4,
          left: dotX - 4,
        }}
      />
    </div>
  );
}
