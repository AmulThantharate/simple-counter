import { Volume2, VolumeX, Shield, ShieldOff, Moon, Sun, Sparkles, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SettingsRowProps {
  preventNegative: boolean;
  onTogglePreventNegative: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function SettingsRow({
  preventNegative,
  onTogglePreventNegative,
  soundEnabled,
  onToggleSound,
  reducedMotion,
  onToggleReducedMotion,
  theme,
  onToggleTheme,
}: SettingsRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
      <SettingTile
        icon={preventNegative ? <Shield className="size-4" /> : <ShieldOff className="size-4" />}
        label="No negatives"
        active={preventNegative}
        onChange={onTogglePreventNegative}
      />
      <SettingTile
        icon={soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        label="Sound"
        active={soundEnabled}
        onChange={onToggleSound}
      />
      <SettingTile
        icon={reducedMotion ? <Zap className="size-4" /> : <Sparkles className="size-4" />}
        label="Reduced motion"
        active={reducedMotion}
        onChange={onToggleReducedMotion}
      />
      <SettingTile
        icon={theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        label="Dark mode"
        active={theme === "dark"}
        onChange={onToggleTheme}
      />
    </div>
  );
}

function SettingTile({
  icon,
  label,
  active,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border cursor-pointer",
        "transition-all duration-200 select-none",
        active ? "bg-accent/50 border-primary/30" : "bg-card border-border hover:bg-accent/30",
      )}
    >
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className={cn("text-muted-foreground", active && "text-primary")}>{icon}</span>
        {label}
      </span>
      <Switch checked={active} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}
