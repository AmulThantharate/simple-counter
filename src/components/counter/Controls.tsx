import { Minus, Plus, RotateCcw, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ControlsProps {
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canDecrement: boolean;
  step: number;
  reducedMotion?: boolean;
}

export function Controls({
  onIncrement,
  onDecrement,
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  canDecrement,
  step,
  reducedMotion = false,
}: ControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex items-center justify-center gap-3 sm:gap-4 w-full">
        <BigCircleButton
          ariaLabel={`Decrement by ${step}`}
          onClick={onDecrement}
          disabled={!canDecrement}
          variant="secondary"
          reducedMotion={reducedMotion}
        >
          <Minus className="size-7 sm:size-8" strokeWidth={2.5} />
        </BigCircleButton>

        <BigCircleButton
          ariaLabel={`Increment by ${step}`}
          onClick={onIncrement}
          variant="primary"
          reducedMotion={reducedMotion}
        >
          <Plus className="size-7 sm:size-8" strokeWidth={2.5} />
        </BigCircleButton>
      </div>

      <div className="flex items-center justify-center gap-2 w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last change"
          className="gap-1.5"
        >
          <Undo2 className="size-4" /> Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          aria-label="Reset counter"
          className="gap-1.5 px-4"
        >
          <RotateCcw className="size-4" /> Reset
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo change"
          className="gap-1.5"
        >
          Redo <Redo2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

interface BigCircleButtonProps {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
  variant: "primary" | "secondary";
  reducedMotion?: boolean;
  children: React.ReactNode;
}

function BigCircleButton({
  onClick,
  disabled,
  ariaLabel,
  variant,
  reducedMotion = false,
  children,
}: BigCircleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "group relative inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full",
        "outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        !reducedMotion &&
          "transition-all duration-200 ease-out active:scale-90 disabled:active:scale-100 hover:-translate-y-0.5",
        variant === "primary" &&
          "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]",
        variant === "primary" && !reducedMotion && "hover:shadow-[var(--shadow-glow)]",
        variant === "secondary" &&
          "bg-secondary text-secondary-foreground border border-border hover:bg-accent",
      )}
    >
      {!reducedMotion && (
        <span
          className={cn(
            "absolute inset-0 rounded-full opacity-0 group-active:animate-pulse-ring",
            variant === "primary" ? "bg-primary/30" : "bg-foreground/10",
          )}
        />
      )}
      {children}
    </button>
  );
}
