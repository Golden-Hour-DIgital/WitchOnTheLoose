"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

const SPARKLE_COLORS = [
  "#D4A853", // gold
  "#8B5CF6", // magic purple
  "#FAF7F2", // cream
  "#C75B28", // burnt orange
  "#ffffff",
];

export default function WitchHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const witchRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const trailIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const witchPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const witch = witchRef.current;
    if (!canvas || !witch) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to match hero
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Particle helpers ──────────────────────────────────────────
    function spawnTrailParticle(x: number, y: number) {
      const count = 3;
      for (let i = 0; i < count; i++) {
        const life = 40 + Math.random() * 40;
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -Math.random() * 1.2 - 0.3,
          alpha: 0.9,
          size: 2 + Math.random() * 4,
          color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
          life,
          maxLife: life,
        });
      }
    }

    function spawnClickBurst(x: number, y: number) {
      const count = 28;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 2 + Math.random() * 5;
        const life = 35 + Math.random() * 35;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          size: 3 + Math.random() * 5,
          color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
          life,
          maxLife: life,
        });
      }
    }

    // ── Render loop ───────────────────────────────────────────────
    function render() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gentle gravity
        p.life--;
        p.alpha = p.life / p.maxLife;

        if (p.life > 0) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          // Glow
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          alive.push(p);
        }
      }
      particlesRef.current = alive;
      animFrameRef.current = requestAnimationFrame(render);
    }
    render();

    // ── Witch flight ──────────────────────────────────────────────
    function flyWitch() {
      if (!witch || !canvas) return;

      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const startX = -120;
      const endX = W + 120;
      const baseY = H * 0.35;

      // Reset position instantly (off-screen left)
      gsap.set(witch, { x: startX, y: baseY, opacity: 1, scaleX: 1 });

      // Trail emission during flight
      if (trailIntervalRef.current) clearInterval(trailIntervalRef.current);
      trailIntervalRef.current = setInterval(() => {
        const rect = witch.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const wx = rect.left - canvasRect.left + rect.width / 2;
        const wy = rect.top - canvasRect.top + rect.height / 2;
        witchPosRef.current = { x: wx, y: wy };
        spawnTrailParticle(wx, wy);
      }, 80);

      // Flight tween: sweep left → right with sine-wave bob
      const duration = 12;
      gsap.to(witch, {
        x: endX,
        duration,
        ease: "none",
        onUpdate() {
          // Vertical sine bob
          const progress = gsap.getProperty(witch, "x") as number;
          const t = (progress - startX) / (endX - startX);
          const bobY = baseY + Math.sin(t * Math.PI * 5) * 28;
          gsap.set(witch, { y: bobY });
        },
        onComplete() {
          if (trailIntervalRef.current) clearInterval(trailIntervalRef.current);
          gsap.set(witch, { opacity: 0 });
          // Repeat after pause
          gsap.delayedCall(33, flyWitch);
        },
      });
    }

    // First flight after 2s
    gsap.delayedCall(2, flyWitch);

    // ── Click bursts (on the hero section) ───────────────────────
    const heroEl = canvas.parentElement;
    function handleClick(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spawnClickBurst(x, y);
    }
    heroEl?.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", resize);
      heroEl?.removeEventListener("click", handleClick);
      cancelAnimationFrame(animFrameRef.current);
      if (trailIntervalRef.current) clearInterval(trailIntervalRef.current);
      gsap.killTweensOf(witch);
    };
  }, []);

  return (
    <>
      {/* Particle canvas — covers full hero, pointer-events none */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Witch SVG silhouette */}
      <div
        ref={witchRef}
        className="absolute pointer-events-none z-10"
        style={{ top: 0, left: 0, opacity: 0 }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 110 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Broom handle */}
          <line x1="10" y1="72" x2="100" y2="58" stroke="#D4A853" strokeWidth="2.5" strokeLinecap="round" />
          {/* Broom bristles */}
          <path d="M100 58 Q108 54 106 62 Q104 70 96 66 Z" fill="#C75B28" opacity="0.9" />
          <path d="M96 62 Q104 58 102 66 Q100 74 92 70 Z" fill="#D4A853" opacity="0.7" />
          {/* Body / cloak */}
          <path d="M44 55 Q36 68 32 82 Q50 78 60 80 Q70 78 78 82 Q74 68 66 55 Z" fill="#1A1A1A" />
          {/* Head */}
          <circle cx="55" cy="46" r="10" fill="#FAF7F2" />
          {/* Hat brim */}
          <ellipse cx="55" cy="38" rx="17" ry="4" fill="#1A1A1A" />
          {/* Hat cone */}
          <path d="M42 38 L55 8 L68 38 Z" fill="#1A1A1A" />
          {/* Hat band */}
          <rect x="43" y="34" width="24" height="4" rx="1" fill="#8B5CF6" opacity="0.9" />
          {/* Star on hat */}
          <text x="53" y="30" fontSize="8" fill="#D4A853" textAnchor="middle">★</text>
          {/* Face dot eyes */}
          <circle cx="51" cy="46" r="1.5" fill="#1A1A1A" />
          <circle cx="59" cy="46" r="1.5" fill="#1A1A1A" />
          {/* Cloak arms holding broom */}
          <path d="M44 60 Q30 62 18 66" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" />
          {/* Hair strands */}
          <path d="M46 54 Q40 60 36 68" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" />
          <path d="M64 54 Q68 60 70 70" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" />
          {/* Glow aura */}
          <circle cx="55" cy="55" r="50" fill="url(#witchGlow)" />
          <defs>
            <radialGradient id="witchGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </>
  );
}
