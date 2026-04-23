import { Layers } from "lucide-react";

export function Brand({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  const icon = size === "lg" ? 28 : size === "sm" ? 18 : 22;
  return (
    <div className="flex items-center gap-2 select-none" data-testid="brand">
      <div className="relative grid place-items-center">
        <div className="absolute inset-0 rounded-md blur-md bg-primary/40" />
        <div className="relative grid place-items-center rounded-md bg-primary/15 border border-primary/30 p-1.5">
          <Layers size={icon} className="text-primary" strokeWidth={2.4} />
        </div>
      </div>
      <span className={`${text} font-semibold tracking-tight`}>
        Responsi<span className="text-gradient-brand">board</span>
      </span>
    </div>
  );
}
