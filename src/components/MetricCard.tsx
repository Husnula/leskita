import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: string;
  iconBgColor?: string; // e.g. "bg-secondary-container"
  iconColor?: string; // e.g. "text-on-secondary-container"
  valueColor?: string; // e.g. "text-primary" or "text-on-surface"
  bgVariant?: "default" | "tertiary";
  bottomIndicator?: boolean;
}

export function MetricCard({
  title,
  value,
  unit,
  icon,
  iconBgColor = "bg-secondary-container",
  iconColor = "text-on-secondary-container",
  valueColor = "text-primary",
  bgVariant = "default",
  bottomIndicator = false,
}: MetricCardProps) {
  const isTertiary = bgVariant === "tertiary";
  const containerClass = isTertiary
    ? "bg-tertiary-fixed border border-outline-variant rounded-xl p-card-padding flex flex-col gap-4 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-200"
    : "bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding flex flex-col gap-4 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-200";

  const circleClass = isTertiary
    ? "absolute -right-4 -top-4 w-24 h-24 bg-tertiary-fixed-dim rounded-full opacity-50 group-hover:scale-110 transition-transform duration-300"
    : "absolute -right-4 -top-4 w-24 h-24 bg-surface-container rounded-full opacity-50 group-hover:scale-110 transition-transform duration-300";

  const titleClass = isTertiary
    ? "font-label-md text-label-md text-on-tertiary-fixed-variant uppercase tracking-wider"
    : "font-label-md text-label-md text-secondary uppercase tracking-wider";

  const iconContainerClass = isTertiary
    ? "w-8 h-8 rounded-md bg-surface text-on-surface flex items-center justify-center shadow-sm"
    : `w-8 h-8 rounded-md ${iconBgColor} ${iconColor} flex items-center justify-center`;

  return (
    <div className={containerClass}>
      <div className={circleClass}></div>
      <div className="flex justify-between items-start relative z-10">
        <span className={titleClass}>{title}</span>
        <div className={iconContainerClass}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      
      <div className="flex items-end gap-2 relative z-10 mt-auto pt-4">
        <span className={`font-headline-lg text-headline-lg ${valueColor}`}>
          {value}
        </span>
        {unit && (
          <span className="font-body-md text-body-md text-secondary mb-1">
            {unit}
          </span>
        )}
      </div>

      {bottomIndicator && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-outline-variant"></div>
      )}
    </div>
  );
}
