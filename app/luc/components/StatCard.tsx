import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  value: React.ReactNode;
  title: string;
  subtitle?: string;
  accentColor?: string; // ex: "text-fona-pink"
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  title,
  subtitle,
  accentColor = "text-fona-pink"
}) => (
  <div className="relative bg-gray-50 border border-gray-200 rounded-xl px-6 py-7 flex flex-col items-start justify-between min-h-[140px] transition-all duration-200 hover:border-fona-pink hover:bg-pink-50/40 group">
    <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 group-hover:bg-fona-pink/10">
      {icon}
    </div>
    <span className={`text-3xl font-extrabold ${accentColor} mb-2`}>{value}</span>
    <div className="mt-auto">
      <span className="block text-xs uppercase tracking-widest font-semibold text-gray-400">{title}</span>
      {subtitle && <span className="block text-xs text-gray-400 mt-1">{subtitle}</span>}
    </div>
  </div>
);

export default StatCard;
