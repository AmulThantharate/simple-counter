import { cn } from "@/lib/utils";

interface StepSelectorProps {
  step: number;
  onChange: (step: number) => void;
  options?: number[];
}

export function StepSelector({ step, onChange, options = [1, 5, 10, 100] }: StepSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Step size"
      className="inline-flex items-center gap-1 p-1 rounded-full bg-muted border border-border"
    >
      {options.map((opt) => {
        const active = opt === step;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            className={cn(
              "relative px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            +{opt}
          </button>
        );
      })}
    </div>
  );
}
