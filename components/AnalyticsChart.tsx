"use client";

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', applicants: 12, hires: 2 },
  { name: 'Tue', applicants: 19, hires: 4 },
  { name: 'Wed', applicants: 15, hires: 3 },
  { name: 'Thu', applicants: 28, hires: 7 },
  { name: 'Fri', applicants: 32, hires: 9 },
  { name: 'Sat', applicants: 45, hires: 12 },
  { name: 'Sun', applicants: 50, hires: 15 },
];

export function AnalyticsChart() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsMounted(true), 0);
    // Force a resize event to trigger Recharts recalculation
    window.dispatchEvent(new Event('resize'));
  }, []);

  if (!isMounted) return <div className="w-full h-48 mt-8 min-h-[192px] bg-gray-50/50 rounded-3xl animate-pulse" />;

  return (
    <div className="w-full h-48 mt-8 min-h-[192px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: 0,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorApplicants" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0F766E" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#cbd5e1" fontSize={8} tickLine={false} axisLine={false} />
          <YAxis stroke="#cbd5e1" fontSize={8} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
            itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}
            labelStyle={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '900' }}
          />
          <Area type="monotone" dataKey="applicants" stroke="#0F766E" strokeWidth={3} fillOpacity={1} fill="url(#colorApplicants)" />
          <Area type="monotone" dataKey="hires" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorHires)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
