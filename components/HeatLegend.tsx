interface HeatLegendProps {
  className?: string;
}

export default function HeatLegend({ className }: HeatLegendProps) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">
        Clear
      </span>
      <div
        className="h-2.5 w-32 rounded-full sm:w-40"
        style={{
          background: "linear-gradient(to right, #3E7CB1, #E8A33D, #D6432F)",
        }}
        aria-hidden="true"
      />
      <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">
        Confused
      </span>
    </div>
  );
}
