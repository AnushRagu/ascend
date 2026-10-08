"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { ShieldCheck, Volume2, VolumeX, AlertTriangle, Shield } from "lucide-react";

interface IncidentRadarVisualizerProps {
  isContained?: boolean;
}

export default function IncidentRadarVisualizer({ isContained = false }: IncidentRadarVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSfx = useCallback((type: "ping" | "shield" | "alert") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === "ping") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "shield") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.25);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Audio not permitted
    }
  }, [soundEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = 320);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 320;
    };
    window.addEventListener("resize", handleResize);

    const centerX = width / 2;
    const centerY = height / 2;

    // 23 Affected Campaign Nodes distributed in 3 concentric rings
    const nodes: Array<{
      id: number;
      ring: number;
      angle: number;
      baseRadius: number;
      speed: number;
      size: number;
      channel: "meta" | "google" | "amazon";
    }> = [];

    for (let i = 0; i < 23; i++) {
      const ring = (i % 3) + 1; // 1, 2, 3
      const baseRadius = ring === 1 ? 65 : ring === 2 ? 105 : 138;
      const angle = (i / 23) * Math.PI * 2;
      const speed = 0.004 * (ring % 2 === 0 ? 1 : -1);
      const channel = i % 3 === 0 ? "meta" : i % 3 === 1 ? "google" : "amazon";
      nodes.push({ id: i, ring, angle, baseRadius, speed, size: 5, channel });
    }

    interface Packet {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      progress: number;
      speed: number;
      color: string;
    }
    const packets: Packet[] = [];

    let frame = 0;
    let radarAngle = 0;

    const render = () => {
      frame++;
      radarAngle += 0.035;

      // Dark futuristic war room background
      ctx.fillStyle = "#07070d";
      ctx.fillRect(0, 0, width, height);

      // Radar grid rings
      ctx.lineWidth = 1;
      const ringRadii = [65, 105, 138];
      ringRadii.forEach((r, idx) => {
        ctx.strokeStyle = isContained
          ? "rgba(16, 185, 129, 0.15)"
          : "rgba(244, 63, 94, 0.15)";
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();

        // Ring crosshair ticks
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          const tx1 = centerX + Math.cos(a) * (r - 3);
          const ty1 = centerY + Math.sin(a) * (r - 3);
          const tx2 = centerX + Math.cos(a) * (r + 3);
          const ty2 = centerY + Math.sin(a) * (r + 3);
          ctx.beginPath();
          ctx.moveTo(tx1, ty1);
          ctx.lineTo(tx2, ty2);
          ctx.stroke();
        }
      });

      // Axis crosshairs
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.beginPath();
      ctx.moveTo(centerX - 160, centerY);
      ctx.lineTo(centerX + 160, centerY);
      ctx.moveTo(centerX, centerY - 150);
      ctx.lineTo(centerX, centerY + 150);
      ctx.stroke();

      // Rotating Sonar Sweep Beam
      const sweepLength = 150;
      const sweepGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, sweepLength);
      if (isContained) {
        sweepGrad.addColorStop(0, "rgba(16, 185, 129, 0.25)");
        sweepGrad.addColorStop(1, "rgba(16, 185, 129, 0.0)");
      } else {
        sweepGrad.addColorStop(0, "rgba(244, 63, 94, 0.3)");
        sweepGrad.addColorStop(1, "rgba(244, 63, 94, 0.0)");
      }

      ctx.save();
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, sweepLength, radarAngle - 0.45, radarAngle);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Central Epicenter: Product Under Demand Surge
      const pulseSize = Math.sin(frame * 0.1) * 4;
      const centerColor = isContained ? "#10b981" : "#f43f5e";

      // Pulsing outer shockwave rings
      const shockwaveR = (frame * 1.5) % 150;
      const shockAlpha = Math.max(0, 1 - shockwaveR / 150);
      ctx.save();
      ctx.strokeStyle = centerColor;
      ctx.globalAlpha = shockAlpha * 0.6;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, shockwaveR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Center glowing core
      ctx.save();
      ctx.shadowColor = centerColor;
      ctx.shadowBlur = 20;
      ctx.fillStyle = centerColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 16 + pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // Core icon
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(isContained ? "🛡️" : "🚨", centerX, centerY);
      ctx.restore();

      // Spawn surge packets flowing between nodes and center
      if (frame % 4 === 0) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        const nx = centerX + Math.cos(randomNode.angle) * randomNode.baseRadius;
        const ny = centerY + Math.sin(randomNode.angle) * randomNode.baseRadius;
        packets.push({
          x: nx,
          y: ny,
          targetX: centerX,
          targetY: centerY,
          progress: 0,
          speed: 0.035,
          color: isContained ? "#34d399" : "#fb7185",
        });
        if (frame % 40 === 0) playSfx("ping");
      }

      // Draw and update packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          packets.splice(i, 1);
          continue;
        }
        const curX = p.x + (p.targetX - p.x) * p.progress;
        const curY = p.y + (p.targetY - p.y) * p.progress;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(curX, curY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw 23 Campaign Nodes
      nodes.forEach((node) => {
        node.angle += node.speed;
        const nx = centerX + Math.cos(node.angle) * node.baseRadius;
        const ny = centerY + Math.sin(node.angle) * node.baseRadius;

        // Connecting filament to center
        ctx.strokeStyle = isContained
          ? "rgba(16, 185, 129, 0.12)"
          : "rgba(244, 63, 94, 0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        // Node dot
        const nodeColor = isContained
          ? "#10b981"
          : node.channel === "meta"
          ? "#f43f5e"
          : node.channel === "google"
          ? "#f59e0b"
          : "#a855f7";

        ctx.save();
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(nx, ny, node.size, 0, Math.PI * 2);
        ctx.fill();

        // If contained: draw protective hexagonal barrier around node
        if (isContained) {
          ctx.strokeStyle = "rgba(52, 211, 153, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(nx, ny, node.size + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [isContained, playSfx]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-rose-500/25 dark:border-rose-500/20 bg-[#07070d] shadow-2xl">
      {/* Top Overlay Indicator */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isContained ? "bg-emerald-400" : "bg-rose-500 animate-ping"
            }`}
          ></span>
          <span className="text-xs font-bold tracking-wider uppercase text-white/90 bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
            {isContained ? "Incident Contained • Blast Radius Protected" : "Blast Radius Hologram • 23 Campaigns Affected"}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl bg-black/60 border border-white/10 text-white/80 hover:text-white transition backdrop-blur-md"
            title={soundEnabled ? "Mute Radar" : "Unmute Radar"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* The 60FPS Hologram Radar Canvas */}
      <canvas ref={canvasRef} className="w-full h-[320px] block cursor-crosshair" />

      {/* Bottom Sub-Arena Channel Legend */}
      <div className="absolute bottom-2.5 left-0 right-0 flex justify-center pointer-events-none">
        <div className="flex items-center gap-5 px-4 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[11px] text-white/80">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Meta Ads (12)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Google Shopping (7)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Amazon Sponsored (4)</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isContained ? "Shields Active" : "Uncontained"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
