import { useEffect, useRef, useState } from "react";
import { MilestoneCelebration } from "./MilestoneCelebration";

interface CounterDisplayProps {
  value: number;
  reducedMotion?: boolean;
}

/**
 * Animated counter display. Each digit (and the optional minus sign) is rendered
 * separately so changing digits animate in/out independently for a smooth,
 * tactile transition reminiscent of modern flip/odometer displays.
 *
 * When `reducedMotion` is true, animations are disabled and digits render statically.
 */
export function CounterDisplay({ value, reducedMotion = false }: CounterDisplayProps) {
  const prev = useRef<string>(String(value));
  const [direction, setDirection] = useState<"up" | "down" | "none">("none");
  const current = String(value);

  useEffect(() => {
    const prevNum = Number(prev.current);
    if (value > prevNum) setDirection("up");
    else if (value < prevNum) setDirection("down");
    else setDirection("none");
    prev.current = current;
  }, [value, current]);

  const chars = current.split("");

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Counter value ${value}`}
      className="relative flex items-center justify-center"
    >
      <div
        className={
          "pointer-events-none absolute inset-0 -z-10 blur-3xl opacity-40 bg-gradient-to-br from-primary/40 via-primary/10 to-transparent rounded-full"
        }
      />
      <div className="flex items-center justify-center gap-0 font-bold tracking-tight tabular-nums text-[7rem] sm:text-[9rem] md:text-[11rem] leading-none">
        {reducedMotion ? (
          <span className="text-gradient">{current}</span>
        ) : (
          chars.map((c, i) => (
            <span
              key={`${current.length}-${i}-${c}-${direction}`}
              className="relative inline-block animate-digit-in text-gradient"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              {c}
            </span>
          ))
        )}
      </div>
      <MilestoneCelebration value={value} reducedMotion={reducedMotion} />
    </div>
  );
}
