import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { CounterDisplay } from "@/components/counter/CounterDisplay";
import { Controls } from "@/components/counter/Controls";
import { StepSelector } from "@/components/counter/StepSelector";
import { SettingsRow } from "@/components/counter/SettingsRow";
import { useCounter } from "@/hooks/use-counter";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Counter — A premium counting experience" },
      {
        name: "description",
        content:
          "A beautifully crafted counter app with step control, undo/redo, keyboard shortcuts, sound, and dark mode.",
      },
      { property: "og:title", content: "Counter — A premium counting experience" },
      {
        property: "og:description",
        content:
          "Premium counter app with step control, undo/redo, keyboard shortcuts and dark mode.",
      },
    ],
  }),
});

function Index() {
  const counter = useCounter();
  const { theme, toggle: toggleTheme } = useTheme();

  // Keyboard shortcuts: ↑ increment, ↓ decrement, R reset, Z/Y undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        counter.increment();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        counter.decrement();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        counter.reset();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        counter.undo();
      } else if (
        (e.metaKey || e.ctrlKey) &&
        (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))
      ) {
        e.preventDefault();
        counter.redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [counter]);

  const canDecrement = !(counter.preventNegative && counter.value <= 0);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-grid -z-10" aria-hidden />
      <div
        className="absolute inset-x-0 top-0 -z-10 h-[40rem] bg-gradient-to-b from-primary/5 to-transparent"
        aria-hidden
      />

      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-10 sm:py-16">
        <header className="mb-6 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Counter • 0.0.2
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">A counter 🤓.</h1>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Use{" "}
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
              ↑
            </kbd>{" "}
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
              ↓
            </kbd>{" "}
            to count and{" "}
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
              R
            </kbd>{" "}
            to reset.
          </p>
        </header>

        <section
          aria-label="Counter"
          className="w-full rounded-3xl border border-border bg-card/80 p-6 sm:p-10 shadow-[var(--shadow-soft)] backdrop-blur-xl"
        >
          <div className="flex flex-col items-center gap-8">
            <CounterDisplay value={counter.value} reducedMotion={counter.reducedMotion} />

            <Controls
              onIncrement={counter.increment}
              onDecrement={counter.decrement}
              onReset={counter.reset}
              onUndo={counter.undo}
              onRedo={counter.redo}
              canUndo={counter.canUndo}
              canRedo={counter.canRedo}
              canDecrement={canDecrement}
              step={counter.step}
              reducedMotion={counter.reducedMotion}
            />

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Step size
              </span>
              <StepSelector step={counter.step} onChange={counter.setStep} />
            </div>
          </div>
        </section>

        <section aria-label="Settings" className="mt-5 w-full">
          <SettingsRow
            preventNegative={counter.preventNegative}
            onTogglePreventNegative={counter.togglePreventNegative}
            soundEnabled={counter.soundEnabled}
            onToggleSound={counter.toggleSound}
            reducedMotion={counter.reducedMotion}
            onToggleReducedMotion={counter.toggleReducedMotion}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </section>

        <footer className="mt-8 text-center text-xs text-muted-foreground">
          Your value is saved automatically.
        </footer>
      </div>
    </main>
  );
}
