'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, Sparkles, X, Calendar, Clock, User } from 'lucide-react';
import { ColorTheme } from '@/lib/themes';

interface BookingToastProps {
  theme: ColorTheme;
  title: string;
  patientName: string;
  time: string;
  onClose: () => void;
  onViewSheet?: () => void;
}

export default function BookingToast({
  theme,
  title,
  patientName,
  time,
  onClose,
  onViewSheet
}: BookingToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isDark = theme.isDark;

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-full animate-toast">
      <div className={`p-4 rounded-2xl border shadow-2xl relative overflow-hidden backdrop-blur-xl ${
        isDark 
          ? 'bg-[#101b2b]/95 border-emerald-500/40 text-slate-100 shadow-emerald-950/50' 
          : 'bg-white/95 border-emerald-300 text-slate-900 shadow-xl'
      }`}>
        {/* Animated Celebration Confetti Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span className="absolute top-2 left-6 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="absolute top-4 right-12 w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="absolute bottom-3 left-1/3 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
        </div>

        <div className="flex items-start justify-between gap-2.5 relative z-10">
          <div className="flex items-start space-x-3 min-w-0 flex-1">
            {/* Animated Draw Checkmark */}
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path
                  className="animate-draw-check"
                  d="M 4 12 L 9 17 L 20 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <h4 className="font-extrabold text-xs sm:text-sm text-emerald-500 truncate flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
                  {title}
                </h4>
              </div>
              <p className="text-xs font-bold truncate mt-0.5 text-slate-800 dark:text-slate-100">
                {patientName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-2 truncate">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-emerald-500" />
                  {time} IST
                </span>
                <span>•</span>
                <span className="text-emerald-500 font-semibold">Synced to Sheet & Cal</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {onViewSheet && (
          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex justify-end">
            <button
              onClick={() => {
                onViewSheet();
                onClose();
              }}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View in Google Sheets &gt;
            </button>
          </div>
        )}

        {/* Auto-Dismiss Linear Progress Timer Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-[4500ms] ease-linear"
            style={{ width: '0%', animation: 'shrinkWidth 4.5s linear forwards' }}
          ></div>
        </div>
      </div>
    </div>
  );
}
