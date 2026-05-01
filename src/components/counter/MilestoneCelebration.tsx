import { useEffect, useMemo, useRef, useState } from "react";

interface MilestoneCelebrationProps {
  value: number;
  reducedMotion?: boolean;
}

const MILESTONES = [10, 20, 50, 100, 250, 500, 1000, 5000, 10000];

function getMilestone(value: number): number | null {
  if (value <= 0) return null;
  // Exact match in the curated list
  if (MILESTONES.includes(value)) return value;
  // Every 1000 after 1000 also celebrates
  if (value > 1000 && value % 1000 === 0) return value;
  return null;
}

interface Particle {
  id: number;
  /** Horizontal peak offset (px) */
  tx: number;
  /** Vertical peak offset (negative = up, px) */
  tyPeak: number;
  /** Horizontal end offset after drift (px) */
  txEnd: number;
  /** Vertical end offset after gravity (positive = below, px) */
  tyEnd: number;
  rotate: number;
  color: string;
  width: number;
  height: number;
  delay: number;
}

const COLORS = [
  "var(--primary)",
  "var(--success)",
  "oklch(0.78 0.17 60)", // amber
  "oklch(0.7 0.2 350)", // pink
  "oklch(0.7 0.18 200)", // cyan
];

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }).map((_, i) => {
    // Bias angles toward the upper hemisphere so pieces shoot up before falling.
    // Angle 0 = right, -PI/2 = straight up.
    const baseAngle = -Math.PI + Math.random() * Math.PI; // -PI..0 (upper half)
    const speed = 110 + Math.random() * 90; // initial burst distance
    const tx = Math.cos(baseAngle) * speed;
    const tyPeak = Math.sin(baseAngle) * speed; // negative (up)

    // Gravity: pieces continue horizontally a bit, then fall well below origin.
    const drift = (Math.random() - 0.5) * 60; // small horizontal sway
    const fallDistance = 260 + Math.random() * 180;

    return {
      id: i,
      tx,
      tyPeak,
      txEnd: tx + drift,
      tyEnd: fallDistance, // always positive — gravity wins
      rotate: (Math.random() * 720 - 360) * 1.2,
      color: COLORS[i % COLORS.length],
      width: 6 + Math.random() * 6,
      height: 4 + Math.random() * 5,
      delay: Math.random() * 120,
    };
  });
}

/**
 * Renders a confetti burst + milestone badge whenever the counter hits a
 * milestone value (10, 20, 50, 100, 250, 500, 1000, then every 1000).
 * Respects the reduced-motion preference: when enabled, only a static badge
 * is shown briefly without particles.
 */
export function MilestoneCelebration({ value, reducedMotion = false }: MilestoneCelebrationProps) {
  const [active, setActive] = useState<number | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const lastValue = useRef(value);

  useEffect(() => {
    const prev = lastValue.current;
    lastValue.current = value;
    // Only celebrate when crossing UP into a milestone, not on hydration or decrement
    if (value <= prev) return;
    const milestone = getMilestone(value);
    if (milestone === null) return;
    setActive(milestone);
    setBurstKey((k) => k + 1);
    const timeout = window.setTimeout(() => setActive(null), reducedMotion ? 1500 : 2400);
    return () => window.clearTimeout(timeout);
  }, [value, reducedMotion]);

  const particles = useMemo(() => makeParticles(28), [burstKey]);

  // Static sparkle positions arranged around the badge for reduced-motion mode.
  // No travel, just a gentle fade/scale pulse — completely motion-safe.
  const sparkles = useMemo(
    () => [
      { x: -90, y: -10, size: 14, delay: 0 },
      { x: 90, y: -10, size: 14, delay: 120 },
      { x: -60, y: -40, size: 10, delay: 240 },
      { x: 60, y: -40, size: 10, delay: 240 },
      { x: 0, y: -56, size: 12, delay: 360 },
    ],
    [],
  );

  if (active === null) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-visible"
    >
      {/* Milestone badge */}
      <div
        key={`badge-${burstKey}`}
        className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 animate-milestone-badge"
      >
        <div className="rounded-full bg-gradient-to-r from-primary to-success px-4 py-1.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]">
          🎉 {active} reached!
        </div>
      </div>

      {/* Reduced motion: calm sparkles around the badge instead of confetti */}
      {reducedMotion &&
        sparkles.map((s, i) => (
          <span
            key={`${burstKey}-sparkle-${i}`}
            className="absolute left-1/2 top-1/2 block animate-sparkle-soft text-primary"
            style={{
              transform: `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px))`,
              fontSize: `${s.size}px`,
              animationDelay: `${s.delay}ms`,
              lineHeight: 1,
            }}
          >
            ✦
          </span>
        ))}

      {/* Confetti burst — only when reduced motion is OFF */}
      {!reducedMotion &&
        particles.map((p) => (
          <span
            key={`${burstKey}-${p.id}`}
            className="absolute left-1/2 top-1/2 block rounded-sm animate-confetti-burst"
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              backgroundColor: p.color,
              ["--tx" as string]: `${p.tx}px`,
              ["--ty-peak" as string]: `${p.tyPeak}px`,
              ["--tx-end" as string]: `${p.txEnd}px`,
              ["--ty-end" as string]: `${p.tyEnd}px`,
              ["--rot" as string]: `${p.rotate}deg`,
              animationDelay: `${p.delay}ms`,
            }}
          />
        ))}
    </div>
  );
}
