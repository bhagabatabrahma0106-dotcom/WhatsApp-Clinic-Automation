'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Radio, Cpu, ShieldCheck, Zap, RefreshCw } from 'lucide-react';
import { ColorTheme } from '@/lib/themes';

interface MotionTelemetryCardProps {
  theme: ColorTheme;
}

export default function MotionTelemetryCard({ theme }: MotionTelemetryCardProps) {
  const [pulseCount, setPulseCount] = useState<number>(0);
  const [sineOffset, setSineOffset] = useState<number>(0);
  const isDark = theme.isDark;

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount(p => (p + 1) % 100);
      setSineOffset(s => (s + 2) % 360);
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
      isDark ? 'bg-[#0f172a]/80 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-md'
    }`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md"
            style={{ backgroundColor: theme.accentColor }}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Telemetry & Neural Flow
            </h4>
            <p className="text-[10px] text-slate-400">Live AI agent throughput</p>
          </div>
        </div>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
          99.98% SLA
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {/* SVG Circular Dial 1: AI Confidence */}
        <div className="flex flex-col items-center">
          <svg className="w-14 h-14" viewBox="0 0 36 36">
            <path
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              style={{ stroke: theme.accentColor }}
              strokeDasharray="98, 100"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20.5" className="text-[8px] font-bold fill-current" textAnchor="middle">98%</text>
          </svg>
          <span className="text-[10px] text-slate-400 mt-1 font-medium">AI Precision</span>
        </div>

        {/* SVG Circular Dial 2: Slot Density */}
        <div className="flex flex-col items-center">
          <svg className="w-14 h-14" viewBox="0 0 36 36">
            <path
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-cyan-400"
              strokeDasharray="85, 100"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20.5" className="text-[8px] font-bold fill-current" textAnchor="middle">85%</text>
          </svg>
          <span className="text-[10px] text-slate-400 mt-1 font-medium">Slot Fill Rate</span>
        </div>

        {/* SVG Circular Dial 3: Uptime */}
        <div className="flex flex-col items-center">
          <svg className="w-14 h-14" viewBox="0 0 36 36">
            <path
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-emerald-400"
              strokeDasharray="100, 100"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20.5" className="text-[8px] font-bold fill-current" textAnchor="middle">100%</text>
          </svg>
          <span className="text-[10px] text-slate-400 mt-1 font-medium">Uptime</span>
        </div>
      </div>

      {/* Animated Oscillating Heartbeat Wave */}
      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span>Signal Heartbeat (IST Sync)</span>
          <span className="font-mono text-emerald-400 font-bold">LIVE</span>
        </div>
        <div className="h-6 w-full overflow-hidden flex items-center">
          <svg className="w-full h-full" viewBox="0 0 200 24" preserveAspectRatio="none">
            <path
              d={`M 0 12 Q 25 ${12 + 8 * Math.sin((sineOffset * Math.PI) / 180)}, 50 12 T 100 12 T 150 12 T 200 12`}
              fill="none"
              stroke={theme.accentColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
