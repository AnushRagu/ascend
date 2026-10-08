"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Swords, Play, RotateCcw, Volume2, VolumeX, Sparkles } from "lucide-react";

export default function AgentBattleArena() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [winnerAnim, setWinnerAnim] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play synthetic sound effect using Web Audio API
  const playSfx = useCallback((type: "laser" | "shield" | "boom" | "peace") => {
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

      if (type === "laser") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "shield") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === "boom") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "peace") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.6);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
      }
    } catch {
      // Audio not permitted or supported
    }
  }, [soundEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = 360);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 360;
    };
    window.addEventListener("resize", handleResize);

    // Characters state
    let frame = 0;
    let battlePhase = 0; // 0: skirmish, 1: heavy clash, 2: arbiter descends, 3: peace/balance

    const growth = {
      x: width * 0.18,
      y: height * 0.65,
      targetX: width * 0.18,
      vx: 0,
      vy: 0,
      emoji: "🚀",
      color: "#10b981",
      hp: 100,
      charge: 0,
      shieldActive: false,
    };

    const cfo = {
      x: width * 0.5,
      y: height * 0.65,
      targetX: width * 0.5,
      vx: 0,
      vy: 0,
      emoji: "🛡️",
      color: "#f59e0b",
      hp: 100,
      shieldActive: true,
      shieldAngle: 0,
    };

    const supply = {
      x: width * 0.82,
      y: height * 0.65,
      targetX: width * 0.82,
      vx: 0,
      vy: 0,
      emoji: "📦",
      color: "#a855f7",
      hp: 100,
      charge: 0,
      shieldActive: false,
    };

    const arbiter = {
      x: width * 0.5,
      y: -80,
      targetY: height * 0.32,
      emoji: "⚖️",
      color: "#818cf8",
      alpha: 0,
      pulse: 0,
    };

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      alpha: number;
      decay: number;
    }
    const particles: Particle[] = [];

    interface Projectile {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      owner: "growth" | "cfo" | "supply";
      life: number;
    }
    const projectiles: Projectile[] = [];

    interface Shockwave {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      color: string;
      alpha: number;
    }
    const shockwaves: Shockwave[] = [];

    const addSparks = (x: number, y: number, color: string, count = 12) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: Math.random() * 3 + 1.5,
          alpha: 1,
          decay: Math.random() * 0.03 + 0.02,
        });
      }
    };

    const addShockwave = (x: number, y: number, color: string, maxR = 60) => {
      shockwaves.push({
        x,
        y,
        radius: 5,
        maxRadius: maxR,
        color,
        alpha: 0.9,
      });
    };

    let screenShake = 0;

    const render = () => {
      frame++;

      // Shake effect
      ctx.save();
      if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        screenShake *= 0.88;
        if (screenShake < 0.2) screenShake = 0;
      }

      // Arena background
      ctx.fillStyle = "#090910";
      ctx.fillRect(0, 0, width, height);

      // Arena grid lines
      ctx.strokeStyle = "rgba(168, 85, 247, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 35) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 35) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Neon Stage floor line
      const floorY = height * 0.78;
      const grad = ctx.createLinearGradient(0, floorY, width, floorY);
      grad.addColorStop(0, "rgba(16, 185, 129, 0.4)");
      grad.addColorStop(0.5, "rgba(245, 158, 11, 0.6)");
      grad.addColorStop(1, "rgba(168, 85, 247, 0.4)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, floorY);
      ctx.lineTo(width - 40, floorY);
      ctx.stroke();

      // Floor glow
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 12;

      // BATTLE PHASES LOGIC (Loop every 360 frames ~ 6 seconds)
      const loopTime = frame % 360;

      if (loopTime < 140) {
        battlePhase = 0; // Skirmish
      } else if (loopTime < 240) {
        battlePhase = 1; // Heavy clash
      } else if (loopTime < 310) {
        battlePhase = 2; // Arbiter descends
      } else {
        battlePhase = 3; // Peace & Balance
      }

      // PHASE 0 & 1: FIGHTING LOGIC
      if (battlePhase === 0 || battlePhase === 1) {
        // Growth: dashes towards center and fires green laser beams
        growth.x = width * 0.22 + Math.sin(frame * 0.12) * 28;
        growth.y = floorY - 32 + Math.sin(frame * 0.2) * 12;

        if (frame % 16 === 0) {
          projectiles.push({
            x: growth.x + 20,
            y: growth.y,
            vx: 8.5,
            vy: (Math.random() - 0.5) * 1.5,
            color: "#10b981",
            size: 5,
            owner: "growth",
            life: 60,
          });
          playSfx("laser");
          addSparks(growth.x + 20, growth.y, "#10b981", 4);
        }

        // Supply: drops aerial energy crates / missiles towards center
        supply.x = width * 0.78 - Math.sin(frame * 0.14) * 25;
        supply.y = floorY - 32 + Math.cos(frame * 0.18) * 10;

        if (frame % 20 === 0) {
          projectiles.push({
            x: supply.x - 20,
            y: supply.y - 10,
            vx: -7.5,
            vy: (Math.random() - 0.5) * 2,
            color: "#c084fc",
            size: 6,
            owner: "supply",
            life: 60,
          });
          playSfx("laser");
          addSparks(supply.x - 20, supply.y, "#c084fc", 4);
        }

        // CFO: stands in the middle holding an electric shield deflecting both sides!
        cfo.x = width * 0.5 + Math.sin(frame * 0.08) * 12;
        cfo.y = floorY - 30;
        cfo.shieldAngle += 0.05;

        // Arbiter is hidden in sky
        arbiter.y = -80;
        arbiter.alpha = 0;
      }

      // PHASE 2: THE ARBITER DESCENDS & BRINGS BALANCE
      if (battlePhase === 2) {
        // Arbiter drops from sky with golden celestial beam
        arbiter.y += (arbiter.targetY - arbiter.y) * 0.08;
        arbiter.alpha = Math.min(1, arbiter.alpha + 0.05);

        if (Math.abs(arbiter.y - arbiter.targetY) < 5 && frame % 40 === 0) {
          addShockwave(arbiter.x, arbiter.y, "#818cf8", width * 0.5);
          playSfx("boom");
          playSfx("peace");
          screenShake = 12;
        }

        // Agents pushed back to corners in awe
        growth.x += (width * 0.15 - growth.x) * 0.08;
        supply.x += (width * 0.85 - supply.x) * 0.08;
        cfo.x += (width * 0.5 - cfo.x) * 0.08;
      }

      // PHASE 3: HARMONY & CONSENSUS
      if (battlePhase === 3) {
        arbiter.alpha = 1;
        arbiter.pulse += 0.08;

        // Glowing synergy triangles
        ctx.strokeStyle = "rgba(129, 140, 248, 0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(growth.x, growth.y);
        ctx.lineTo(cfo.x, cfo.y);
        ctx.lineTo(supply.x, supply.y);
        ctx.lineTo(growth.x, growth.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(growth.x, growth.y);
        ctx.lineTo(arbiter.x, arbiter.y);
        ctx.lineTo(supply.x, supply.y);
        ctx.stroke();
      }

      // UPDATE & DRAW PROJECTILES
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        // Collision with CFO Shield in the middle
        const distToCfo = Math.hypot(p.x - cfo.x, p.y - cfo.y);
        if (distToCfo < 38) {
          addSparks(p.x, p.y, p.color, 10);
          addShockwave(p.x, p.y, "#f59e0b", 25);
          playSfx("shield");
          screenShake = 4;
          projectiles.splice(i, 1);
          continue;
        }

        // Head-on collision between projectiles
        let destroyed = false;
        for (let j = i - 1; j >= 0; j--) {
          const other = projectiles[j];
          if (p.owner !== other.owner && Math.hypot(p.x - other.x, p.y - other.y) < 16) {
            addSparks((p.x + other.x) / 2, (p.y + other.y) / 2, "#fbbf24", 16);
            addShockwave((p.x + other.x) / 2, (p.y + other.y) / 2, "#fbbf24", 30);
            playSfx("boom");
            screenShake = 6;
            projectiles.splice(i, 1);
            projectiles.splice(j, 1);
            destroyed = true;
            break;
          }
        }
        if (destroyed) continue;

        if (p.life <= 0 || p.x < 0 || p.x > width) {
          projectiles.splice(i, 1);
          continue;
        }

        // Draw projectile
        ctx.save();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.7;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5);
        ctx.stroke();
        ctx.restore();
      }

      // UPDATE & DRAW SHOCKWAVES
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const s = shockwaves[i];
        s.radius += (s.maxRadius - s.radius) * 0.15 + 2;
        s.alpha *= 0.92;

        ctx.save();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (s.alpha < 0.05 || s.radius >= s.maxRadius) {
          shockwaves.splice(i, 1);
        }
      }

      // UPDATE & DRAW PARTICLES
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.08; // gravity
        pt.alpha -= pt.decay;

        if (pt.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // DRAW CHARACTERS

      // 1. Alex (Growth - Rocket)
      ctx.save();
      ctx.shadowColor = growth.color;
      ctx.shadowBlur = 15;
      // Glowing aura circle
      ctx.fillStyle = "rgba(16, 185, 129, 0.18)";
      ctx.beginPath();
      ctx.arc(growth.x, growth.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rocket thrust flame
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(growth.x - 18, growth.y + 12);
      ctx.lineTo(growth.x - 30 - Math.random() * 8, growth.y + 12);
      ctx.lineTo(growth.x - 18, growth.y + 8);
      ctx.fill();

      // Character Icon
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(growth.emoji, growth.x, growth.y);
      ctx.restore();

      // 2. Marcus (CFO - Shield Titan)
      ctx.save();
      ctx.shadowColor = cfo.color;
      ctx.shadowBlur = 18;
      // Hexagonal / Double Energy Shield
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 3;
      ctx.fillStyle = "rgba(245, 158, 11, 0.18)";
      ctx.beginPath();
      ctx.arc(cfo.x, cfo.y, 30 + Math.sin(frame * 0.1) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rotating shield rings
      ctx.save();
      ctx.translate(cfo.x, cfo.y);
      ctx.rotate(cfo.shieldAngle);
      ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
      ctx.lineWidth = 2;
      ctx.strokeRect(-24, -24, 48, 48);
      ctx.restore();

      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cfo.emoji, cfo.x, cfo.y);
      ctx.restore();

      // 3. Elena (Supply Sentinel - Drone/Box)
      ctx.save();
      ctx.shadowColor = supply.color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = "rgba(168, 85, 247, 0.18)";
      ctx.beginPath();
      ctx.arc(supply.x, supply.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Orbital kinetic satellites
      const satAngle = frame * 0.08;
      const satX = supply.x + Math.cos(satAngle) * 28;
      const satY = supply.y + Math.sin(satAngle) * 16;
      ctx.fillStyle = "#c084fc";
      ctx.beginPath();
      ctx.arc(satX, satY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(supply.emoji, supply.x, supply.y);
      ctx.restore();

      // 4. The Arbiter (Consensus Entity)
      if (arbiter.alpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = arbiter.alpha;
        ctx.shadowColor = "#818cf8";
        ctx.shadowBlur = 25;

        // Celestial light pillar from top
        const beamGrad = ctx.createLinearGradient(arbiter.x, 0, arbiter.x, floorY);
        beamGrad.addColorStop(0, "rgba(129, 140, 248, 0.6)");
        beamGrad.addColorStop(0.5, "rgba(129, 140, 248, 0.2)");
        beamGrad.addColorStop(1, "rgba(129, 140, 248, 0.0)");
        ctx.fillStyle = beamGrad;
        ctx.fillRect(arbiter.x - 30, 0, 60, floorY);

        // Halo ring
        ctx.strokeStyle = "#818cf8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(arbiter.x, arbiter.y, 32 + Math.sin(arbiter.pulse) * 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = "32px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(arbiter.emoji, arbiter.x, arbiter.y);
        ctx.restore();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [playSfx]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-purple-500/25 bg-[#07070c] shadow-2xl">
      {/* Top Controls Overlay */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <span className="text-xs font-bold tracking-wider uppercase text-white/90 bg-black/50 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
            Live Agent Arena
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl bg-black/60 border border-white/10 text-white/80 hover:text-white hover:bg-black/90 transition backdrop-blur-md"
            title={soundEnabled ? "Mute SFX" : "Unmute SFX"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* The 60FPS Battle Canvas */}
      <canvas ref={canvasRef} className="w-full h-[360px] block cursor-crosshair" />

      {/* Bottom Sub-Arena Glow */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
        <div className="flex items-center gap-6 px-4 py-1 rounded-full bg-black/40 border border-white/05 backdrop-blur-sm text-[11px] text-white/70">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>🚀 Growth</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>🛡️ CFO</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>📦 Supply</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>⚖️ Arbiter</span>
          </span>
        </div>
      </div>
    </div>
  );
}
