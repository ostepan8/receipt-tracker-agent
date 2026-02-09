"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CATEGORY_COLORS, getCategoryLabel, type ExpenseCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ExpenseChartProps {
  data: Record<ExpenseCategory, number>;
  showLegend?: boolean;
  compact?: boolean;
}

export function ExpenseChart({ data, showLegend = true, compact = false }: ExpenseChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([category, value]) => ({
      name: getCategoryLabel(category),
      value,
      category,
      color: CATEGORY_COLORS[category as ExpenseCategory] || "#6b7280",
    }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-slate-400">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm">No spending data</p>
        </div>
      </div>
    );
  }

  const outerRadius = compact ? 70 : 90;
  const innerRadius = compact ? 45 : 60;

  return (
    <div className={`flex ${compact ? 'flex-col' : 'flex-col lg:flex-row'} items-center gap-6`}>
      <div className={`${compact ? 'w-full h-[180px]' : 'w-full lg:w-1/2 h-[280px]'} relative`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {chartData.map((entry, index) => (
                <linearGradient key={`grad-${index}`} id={`pieGrad-${index}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                  <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#pieGrad-${index})`}
                  stroke={entry.color}
                  strokeWidth={activeIndex === index ? 2 : 0}
                  style={{
                    filter: activeIndex === index ? `drop-shadow(0 4px 8px ${entry.color}40)` : 'none',
                    transform: activeIndex === index ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: 'center',
                    transition: 'all 0.2s ease-out',
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                const percentage = ((data.value / total) * 100).toFixed(1);
                return (
                  <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: data.color }} />
                      <span className="font-semibold">{data.name}</span>
                    </div>
                    <div className="text-slate-300 text-sm">
                      <span className="text-white font-bold text-lg">{formatCurrency(data.value)}</span>
                      <span className="ml-2 text-slate-400">({percentage}%)</span>
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Total</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      {showLegend && (
        <div className={`${compact ? 'w-full' : 'w-full lg:w-1/2'} space-y-2`}>
          {chartData.slice(0, 6).map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <CategoryLegendItem
                key={item.category}
                label={item.name}
                amount={item.value}
                percentage={parseFloat(percentage)}
                color={item.color}
                isActive={activeIndex === index}
                onHover={() => setActiveIndex(index)}
                onLeave={() => setActiveIndex(null)}
                delay={index * 80}
              />
            );
          })}
          {chartData.length > 6 && (
            <p className="text-xs text-slate-400 pt-2">
              +{chartData.length - 6} more categories
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryLegendItem({
  label,
  amount,
  percentage,
  color,
  isActive,
  onHover,
  onLeave,
  delay,
}: {
  label: string;
  amount: number;
  percentage: number;
  color: string;
  isActive: boolean;
  onHover: () => void;
  onLeave: () => void;
  delay: number;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div
      className={`group cursor-pointer transition-all duration-200 ${isActive ? 'scale-[1.02]' : ''}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm transition-transform duration-200"
            style={{
              backgroundColor: color,
              transform: isActive ? 'scale(1.2)' : 'scale(1)',
            }}
          />
          <span className={`text-sm transition-colors ${isActive ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
            {label}
          </span>
        </div>
        <span className="text-sm font-semibold tabular-nums text-slate-900">
          {formatCurrency(amount)}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: color,
            boxShadow: isActive ? `0 0 8px ${color}60` : 'none',
          }}
        />
      </div>
    </div>
  );
}
