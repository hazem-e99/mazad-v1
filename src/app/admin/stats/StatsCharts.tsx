"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sparkles, TrendingUp } from "lucide-react";

type MetricPoint = { name: string; value: number };
type StatusPoint = MetricPoint & { color: string };

interface StatsChartsProps {
  activityData: MetricPoint[];
  auctionStatusData: StatusPoint[];
  bidData: MetricPoint[];
  totalAuctions: number;
}

const tooltipContentStyle = {
  background: "#121b26",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
};

export function StatsCharts({ activityData, auctionStatusData, bidData, totalAuctions }: StatsChartsProps) {
  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-(--color-text)">نشاط المزادات</h2>
              <p className="text-sm text-(--color-text-faint)">مؤشرات الأداء الحالية</p>
            </div>
            <span className="rounded-full border border-(--color-gold)/25 bg-(--color-gold-tint) px-2.5 py-1 text-xs text-(--color-gold)">مباشر</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="goldArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ecbd33" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ecbd33" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#b3b8c5", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#b3b8c5", fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  formatter={(value) => {
                    const normalized = Array.isArray(value) ? value[0] : value;
                    return [`${normalized ?? 0}`, "القيمة"];
                  }}
                  labelStyle={{ color: "#fff" }}
                  contentStyle={tooltipContentStyle}
                />
                <Area type="monotone" dataKey="value" stroke="#ecbd33" strokeWidth={3} fill="url(#goldArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-(--color-text)">حالة المزادات</h2>
              <p className="text-sm text-(--color-text-faint)">توزيع الحالات</p>
            </div>
            <Sparkles className="h-4 w-4 text-(--color-gold)" aria-hidden="true" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={auctionStatusData} dataKey="value" innerRadius={52} outerRadius={86} paddingAngle={3} stroke="rgba(0,0,0,0.15)">
                  {auctionStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value ?? 0}`, "المزادات"]} contentStyle={tooltipContentStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-[-10px] text-center">
            <div className="text-[11px] text-(--color-text-faint)">إجمالي المزادات</div>
            <div className="tnum text-2xl font-bold text-(--color-text)">{totalAuctions}</div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {auctionStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                  <span className="text-(--color-text-muted)">{item.name}</span>
                </div>
                <span className="tnum font-medium text-(--color-text)">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-(--color-text)">أداء المزايدات</h2>
              <p className="text-sm text-(--color-text-faint)">عدد المزايدات خلال الأسبوع</p>
            </div>
            <TrendingUp className="h-4 w-4 text-(--color-gold)" aria-hidden="true" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bidData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#b3b8c5", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#b3b8c5", fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip formatter={(value) => [`${value ?? 0}`, "المزايدات"]} contentStyle={tooltipContentStyle} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#ecbd33" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
