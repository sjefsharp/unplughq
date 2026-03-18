"use client";

import { cn } from "@/lib/utils";

interface ResourceGaugeProps {
  value: number; // 0-100
  label: string;
  className?: string;
}

function getGaugeColor(value: number) {
  if (value >= 90) return "var(--color-critical-base)";
  if (value >= 70) return "var(--color-warning-base)";
  return "var(--color-success-base)";
}

export function ResourceGauge({ value, label, className }: ResourceGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = getGaugeColor(clamped);

  // Semi-circular arc: 180° sweep. SVG viewBox 120x70 (semi-circle plus room for text)
  const radius = 46;
  const strokeWidth = 8;
  const cx = 60;
  const cy = 56;
  // Arc length for 180°
  const circumference = Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("flex flex-col items-center", className)}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${Math.round(clamped)}%`}
    >
      <svg
        viewBox="0 0 120 70"
        className="h-[96px] w-[120px] lg:h-[120px] lg:w-[150px]"
        aria-hidden="true"
      >
        {/* Background arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-[var(--dur-base)] ease-[var(--ease-standard)]"
        />
        {/* Center value text */}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          className="fill-[var(--color-text-base)] text-[24px] font-bold"
          style={{ fontSize: "24px", fontWeight: 700 }}
        >
          {Math.round(clamped)}%
        </text>
      </svg>
      <span className="mt-[-4px] text-[length:var(--text-xs-fs)] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
        {label}
      </span>
    </div>
  );
}
