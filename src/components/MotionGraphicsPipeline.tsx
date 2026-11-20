'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Zap, 
  Activity, 
  MessageSquare, 
  Cloud, 
  Cpu, 
  Calendar, 
  FileSpreadsheet, 
  Bell, 
  Mail, 
  CheckCircle2, 
  ChevronRight, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { ColorTheme } from '@/lib/themes';

interface MotionGraphicsPipelineProps {
  theme: ColorTheme;
  isSimulating?: boolean;
}

interface NodeDetail {
  id: string;
  name: string;
  phase: string;
  description: string;
  tech: string;
  status: 'Online' | 'Active' | 'Ready';
}

const PIPELINE_NODES: Record<string, NodeDetail> = {
  patient: {
    id: 'patient',
    name: 'Patient on WhatsApp',
    phase: 'Phase 0 & 5: Inbound Channel',
    description: 'Patient sends natural language text or voice note in Hindi, Hinglish, or English requesting an appointment.',
    tech: 'WhatsApp Client (iOS / Android / Web)',
    status: 'Online'
  },
  meta: {
    id: 'meta',
    name: 'Meta Cloud API Gateway',
    phase: 'Phase 2: Webhook Endpoint',
    description: 'Permanent System User token receives webhook payload, validates verify_token, and triggers n8n or Next.js server.',
    tech: 'Meta Graph API v22.0 • Webhook POST',
    status: 'Online'
  },
  ai: {
    id: 'ai',
    name: 'LangChain AI Agent Nexus',
    phase: 'Phase 3 & 4: Intelligent Brain',
    description: 'Processes patient request with OpenAI GPT-4o-mini and executes 7 specialized clinic tools in Asia/Kolkata timezone.',
    tech: 'LangChain Tool Calling • GPT-4o-mini',
    status: 'Active'
  },
  calendar: {
    id: 'calendar',
    name: 'Clinic Google Calendar',
    phase: 'Phase 1.2: Slot Manager',
    description: 'Searches 20-min slots (10 AM - 6 PM IST, excluding 1-2 PM lunch & holidays) and books confirmed events immediately.',
    tech: 'Google Calendar API • Asia/Kolkata',
    status: 'Ready'
  },
  sheets: {
    id: 'sheets',
    name: 'Google Sheets DB (Bookings)',
    phase: 'Phase 1.4: 9-Column Master Log',
    description: 'Logs Start_ISO, Date, Time, Patient Name, Phone, Problem, Status, Event_ID, and Reminder_Sent with zero data loss.',
    tech: 'Google Sheets API • 9 Structured Columns',
    status: 'Active'
  },
  reminder: {
    id: 'reminder',
    name: 'Meta Auto-Reminder Engine',
    phase: 'Phase 6: 15-Min Cron Scheduler',
    description: 'Checks upcoming bookings in 30-75 min window and sends approved WhatsApp template "appointment_reminder".',
    tech: 'Vercel Cron / n8n • Meta Template API',
    status: 'Ready'
  },
  report: {
    id: 'report',
    name: 'Daily 8 PM Owner Report',
    phase: 'Phase 7: Clinic Director Digest',
    description: 'Aggregates daily revenue, no-show rates, cancellations, and sends formatted executive report via Resend / SMTP.',
    tech: 'Scheduled Cron (8:00 PM IST) • HTML Email',
    status: 'Ready'
  }
};

export default function MotionGraphicsPipeline({ theme, isSimulating = false }: MotionGraphicsPipelineProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [packetProgress, setPacketProgress] = useState<number>(0);
  const [isManualBurst, setIsManualBurst] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);

  // Motion Packet Loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = 30 / speedMultiplier;
    const timer = setInterval(() => {
      setPacketProgress(prev => {
        const next = prev + 0.8;
        if (next >= 100) {
          if (isManualBurst) setIsManualBurst(false);
          return 0;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier, isManualBurst]);

  // Sync step with packet position
  useEffect(() => {
    if (packetProgress < 20) setActiveStep(1); // Patient -> Meta
    else if (packetProgress < 50) setActiveStep(2); // Meta -> AI Agent
    else if (packetProgress < 75) setActiveStep(3); // AI -> Calendar & Sheet
    else setActiveStep(4); // Reminders & Reports
  }, [packetProgress]);

  const triggerManualBurst = () => {
    setPacketProgress(0);
    setIsManualBurst(true);
    setIsPlaying(true);
  };

  const isDark = theme.isDark;

  return (
    <div className={`w-full rounded-3xl border overflow-hidden transition-all duration-300 shadow-2xl ${
      isDark ? 'bg-[#0a0f1d]/90 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Motion Graphics Header Bar */}
      <div className={`px-5 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-100 bg-slate-50/60'
      }`}>
        <div className="flex items-center space-x-3 min-w-0">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 relative overflow-hidden"
            style={{ backgroundColor: theme.accentColor }}
          >
            <Activity className="w-5 h-5 animate-pulse" />
            <div className="absolute inset-0 bg-white/20 animate-radar-sweep pointer-events-none"></div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className={`font-black text-sm sm:text-base tracking-tight truncate ${theme.classes.textPrimary}`}>
                Live Motion Graphics: Data Stream Pipeline
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-ping"></span>
                Real-Time
              </span>
            </div>
            <p className={`text-xs truncate ${theme.classes.textSecondary}`}>
              Visual representation of patient messages flowing through Meta Cloud API, AI Tool Nexus, and Google Services
            </p>
          </div>
        </div>

        {/* Motion Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
            title={isPlaying ? "Pause Stream" : "Resume Stream"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={triggerManualBurst}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 text-white transition shadow-md ${theme.classes.primaryBtn}`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Packet Flow</span>
          </button>

          <div className={`flex items-center rounded-xl border p-0.5 text-xs font-bold ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
          }`}>
            {[1, 2, 4].map(mult => (
              <button
                key={mult}
                onClick={() => setSpeedMultiplier(mult)}
                className={`px-2 py-1 rounded-lg transition ${
                  speedMultiplier === mult 
                    ? isDark ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                    : 'hover:text-slate-200'
                }`}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Motion Canvas Container */}
      <div className="p-4 sm:p-6 w-full relative overflow-x-auto no-scrollbar">
        <div className="min-w-[850px] w-full">
          <svg 
            viewBox="0 0 1000 320" 
            className="w-full h-auto overflow-visible"
            style={{ filter: isDark ? 'drop-shadow(0 10px 25px rgba(0,0,0,0.5))' : 'none' }}
          >
            <defs>
              {/* Gradients */}
              <linearGradient id="streamGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="streamGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor={theme.accentColor} stopOpacity="0.9" />
              </linearGradient>

              <linearGradient id="streamGradCalendar" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={theme.accentColor} stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="streamGradSheet" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={theme.accentColor} stopOpacity="0.9" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="streamGradReminder" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
              </linearGradient>

              <linearGradient id="streamGradReport" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
              </linearGradient>

              {/* Glowing Filters */}
              <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <filter id="glowAccent" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Circuit Background Grid */}
            <g opacity={isDark ? "0.15" : "0.06"} stroke="currentColor">
              {Array.from({ length: 11 }).map((_, i) => (
                <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="320" strokeWidth="1" strokeDasharray="3 3" />
              ))}
              {Array.from({ length: 4 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * 80 + 40} x2="1000" y2={i * 80 + 40} strokeWidth="1" strokeDasharray="3 3" />
              ))}
            </g>

            {/* BASE CONDUIT PATHS (Static Translucent Tracks) */}
            {/* 1. Patient -> Meta API */}
            <path
              d="M 120 160 L 260 160"
              fill="none"
              stroke={isDark ? "#1e293b" : "#e2e8f0"}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* 2. Meta API -> AI Nexus */}
            <path
              d="M 340 160 L 460 160"
              fill="none"
              stroke={isDark ? "#1e293b" : "#e2e8f0"}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* 3. AI Nexus -> Google Calendar */}
            <path
              d="M 540 140 C 600 140, 630 90, 700 90"
              fill="none"
              stroke={isDark ? "#1e293b" : "#e2e8f0"}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* 4. AI Nexus -> Google Sheets */}
            <path
              d="M 540 180 C 600 180, 630 230, 700 230"
              fill="none"
              stroke={isDark ? "#1e293b" : "#e2e8f0"}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* 5. Google Calendar -> Auto Reminder */}
            <path
              d="M 780 90 L 880 90"
              fill="none"
              stroke={isDark ? "#1e293b" : "#e2e8f0"}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* 6. Google Sheets -> 8 PM Report */}
            <path
              d="M 780 230 L 880 230"
              fill="none"
              stroke={isDark ? "#1e293b" : "#e2e8f0"}
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* ANIMATED PULSE STREAMS (Glowing SVG Dash Flow) */}
            {isPlaying && (
              <>
                <path
                  d="M 120 160 L 260 160"
                  fill="none"
                  stroke="url(#streamGrad1)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-data-stream"
                  filter="url(#glowGreen)"
                />
                <path
                  d="M 340 160 L 460 160"
                  fill="none"
                  stroke="url(#streamGrad2)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="animate-data-stream"
                  filter="url(#glowAccent)"
                />
                <path
                  d="M 540 140 C 600 140, 630 90, 700 90"
                  fill="none"
                  stroke="url(#streamGradCalendar)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-data-stream"
                />
                <path
                  d="M 540 180 C 600 180, 630 230, 700 230"
                  fill="none"
                  stroke="url(#streamGradSheet)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-data-stream"
                />
                <path
                  d="M 780 90 L 880 90"
                  fill="none"
                  stroke="url(#streamGradReminder)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-data-stream"
                />
                <path
                  d="M 780 230 L 880 230"
                  fill="none"
                  stroke="url(#streamGradReport)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-data-stream"
                />
              </>
            )}

            {/* DYNAMIC TRAVELING DATA PACKET (Calculated position) */}
            {isPlaying && (
              <g>
                {/* Stage 1: 0% - 25% (Patient -> Meta) */}
                {packetProgress >= 0 && packetProgress < 25 && (
                  <circle
                    cx={120 + (packetProgress / 25) * 140}
                    cy={160}
                    r="6"
                    fill="#10b981"
                    filter="url(#glowGreen)"
                  >
                    <animate attributeName="r" values="5;7;5" dur="0.8s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Stage 2: 25% - 50% (Meta -> AI Nexus) */}
                {packetProgress >= 25 && packetProgress < 50 && (
                  <circle
                    cx={340 + ((packetProgress - 25) / 25) * 120}
                    cy={160}
                    r="7"
                    fill="#06b6d4"
                    filter="url(#glowAccent)"
                  >
                    <animate attributeName="r" values="6;8;6" dur="0.6s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Stage 3: 50% - 75% (AI Nexus -> Calendar & Sheets simultaneously) */}
                {packetProgress >= 50 && packetProgress < 75 && (
                  <>
                    {/* Branch A: To Calendar */}
                    <circle
                      cx={540 + ((packetProgress - 50) / 25) * 160}
                      cy={140 - ((packetProgress - 50) / 25) * 50}
                      r="6"
                      fill="#3b82f6"
                      filter="url(#glowAccent)"
                    />
                    {/* Branch B: To Sheets */}
                    <circle
                      cx={540 + ((packetProgress - 50) / 25) * 160}
                      cy={180 + ((packetProgress - 50) / 25) * 50}
                      r="6"
                      fill="#10b981"
                      filter="url(#glowGreen)"
                    />
                  </>
                )}

                {/* Stage 4: 75% - 100% (Calendar -> Reminder, Sheets -> Report) */}
                {packetProgress >= 75 && packetProgress <= 100 && (
                  <>
                    <circle
                      cx={780 + ((packetProgress - 75) / 25) * 100}
                      cy={90}
                      r="6"
                      fill="#f59e0b"
                      filter="url(#glowAccent)"
                    />
                    <circle
                      cx={780 + ((packetProgress - 75) / 25) * 100}
                      cy={230}
                      r="6"
                      fill="#ec4899"
                      filter="url(#glowAccent)"
                    />
                  </>
                )}
              </g>
            )}

            {/* ===================== NODE 1: PATIENT WHATSAPP ===================== */}
            <g 
              transform="translate(80, 160)" 
              className="cursor-pointer group"
              onClick={() => setSelectedNode(PIPELINE_NODES.patient)}
            >
              <circle 
                r="36" 
                fill={isDark ? "#111b21" : "#f1f5f9"} 
                stroke="#25d366" 
                strokeWidth={activeStep === 1 ? "3" : "1.5"} 
                className="transition-all"
              />
              {activeStep === 1 && (
                <circle r="44" fill="none" stroke="#25d366" strokeWidth="1.5" opacity="0.6" className="animate-pulse-ring" />
              )}
              {/* WhatsApp Icon placeholder inside SVG */}
              <circle r="22" fill="#25d366" />
              <path d="M -8 -4 C -8 -9 8 -9 8 -4 C 8 2 2 4 -1 7 L -2 9 L -4 9 L -3 6 C -7 5 -8 1 -8 -4" fill="white" transform="scale(0.8) translate(-1, -1)" />
              <text y="54" textAnchor="middle" fill={isDark ? "#94a3b8" : "#475569"} fontSize="11" fontWeight="700">Patient Chat</text>
              <text y="68" textAnchor="middle" fill="#25d366" fontSize="9" fontWeight="600">WhatsApp Cloud</text>
            </g>

            {/* ===================== NODE 2: META CLOUD API GATEWAY ===================== */}
            <g 
              transform="translate(300, 160)" 
              className="cursor-pointer group"
              onClick={() => setSelectedNode(PIPELINE_NODES.meta)}
            >
              <rect 
                x="-40" 
                y="-32" 
                width="80" 
                height="64" 
                rx="18" 
                fill={isDark ? "#0f172a" : "#f8fafc"} 
                stroke="#06b6d4" 
                strokeWidth={activeStep === 2 ? "3" : "1.5"} 
                className="transition-all"
              />
              {activeStep === 2 && (
                <rect x="-46" y="-38" width="92" height="76" rx="22" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" className="animate-pulse-ring" />
              )}
              {/* Meta Symbol / Cloud */}
              <circle cx="0" cy="-4" r="14" fill="#06b6d4" opacity="0.2" />
              <path d="M -10 2 C -10 -4, -4 -8, 0 -6 C 4 -8, 10 -4, 10 2 C 10 8, -10 8, -10 2 Z" fill="#06b6d4" />
              <text y="48" textAnchor="middle" fill={isDark ? "#94a3b8" : "#475569"} fontSize="11" fontWeight="700">Meta Webhook</text>
              <text y="62" textAnchor="middle" fill="#06b6d4" fontSize="9" fontWeight="600">v22.0 API Gateway</text>
            </g>

            {/* ===================== NODE 3: CENTRAL AI RECEPTIONIST NEXUS ===================== */}
            <g 
              transform="translate(500, 160)" 
              className="cursor-pointer group"
              onClick={() => setSelectedNode(PIPELINE_NODES.ai)}
            >
              {/* Outer Planetary Orbital Ring 1 */}
              <circle 
                r="64" 
                fill="none" 
                stroke={theme.accentColor} 
                strokeWidth="1.5" 
                strokeDasharray="4 8" 
                opacity="0.4" 
                className="animate-orbit-slow"
              />
              {/* Orbiting Satellite 1 (OpenAI Brain) */}
              <g className="animate-orbit-slow" style={{ transformOrigin: '0 0' }}>
                <circle cx="0" cy="-64" r="6" fill="#10b981" filter="url(#glowGreen)" />
              </g>

              {/* Orbiting Satellite 2 (Tool Router) */}
              <g className="animate-orbit-reverse" style={{ transformOrigin: '0 0' }}>
                <circle cx="0" cy="64" r="5" fill="#06b6d4" />
              </g>

              {/* Core AI Ring */}
              <circle 
                r="46" 
                fill={isDark ? "#0b1220" : "#ffffff"} 
                stroke={theme.accentColor} 
                strokeWidth={activeStep === 2 || activeStep === 3 ? "3.5" : "2"} 
                filter="url(#glowAccent)"
                className="transition-all"
              />

              {/* Inner Pulsing Core */}
              <circle r="34" fill={theme.accentColor} opacity={isDark ? "0.2" : "0.15"} />
              <circle r="22" fill={theme.accentColor} opacity={isDark ? "0.85" : "0.9"} />
              
              {/* Brain / Spark Icon */}
              <path d="M -6 -6 L 6 -6 L 0 6 Z" fill="white" transform="scale(1.2)" />
              <circle cx="0" cy="0" r="3" fill="#ffffff" />

              <text y="64" textAnchor="middle" fill={isDark ? "#ffffff" : "#0f172a"} fontSize="12" fontWeight="800">
                AI Receptionist
              </text>
              <text y="78" textAnchor="middle" fill={theme.accentColor} fontSize="9" fontWeight="700">
                GPT-4o + 7 Tools
              </text>
            </g>

            {/* ===================== NODE 4: GOOGLE CALENDAR ===================== */}
            <g 
              transform="translate(740, 90)" 
              className="cursor-pointer group"
              onClick={() => setSelectedNode(PIPELINE_NODES.calendar)}
            >
              <rect 
                x="-38" 
                y="-30" 
                width="76" 
                height="60" 
                rx="16" 
                fill={isDark ? "#0f172a" : "#f8fafc"} 
                stroke="#3b82f6" 
                strokeWidth={activeStep === 3 ? "2.5" : "1.5"} 
                className="transition-all"
              />
              {activeStep === 3 && (
                <rect x="-44" y="-36" width="88" height="72" rx="20" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6" className="animate-pulse-ring" />
              )}
              <rect x="-14" y="-14" width="28" height="24" rx="4" fill="#3b82f6" />
              <line x1="-14" y1="-6" x2="14" y2="-6" stroke="white" strokeWidth="2" />
              <circle cx="-5" cy="2" r="2" fill="white" />
              <circle cx="5" cy="2" r="2" fill="white" />
              <text y="46" textAnchor="middle" fill={isDark ? "#94a3b8" : "#475569"} fontSize="11" fontWeight="700">Google Calendar</text>
              <text y="59" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="600">20-Min IST Slots</text>
            </g>

            {/* ===================== NODE 5: GOOGLE SHEETS ===================== */}
            <g 
              transform="translate(740, 230)" 
              className="cursor-pointer group"
              onClick={() => setSelectedNode(PIPELINE_NODES.sheets)}
            >
              <rect 
                x="-38" 
                y="-30" 
                width="76" 
                height="60" 
                rx="16" 
                fill={isDark ? "#0f172a" : "#f8fafc"} 
                stroke="#10b981" 
                strokeWidth={activeStep === 3 ? "2.5" : "1.5"} 
                className="transition-all"
              />
              {activeStep === 3 && (
                <rect x="-44" y="-36" width="88" height="72" rx="20" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.6" className="animate-pulse-ring" />
              )}
              <rect x="-14" y="-14" width="28" height="24" rx="4" fill="#10b981" />
              <line x1="-8" y1="-8" x2="8" y2="-8" stroke="white" strokeWidth="1.5" />
              <line x1="-8" y1="-2" x2="8" y2="-2" stroke="white" strokeWidth="1.5" />
              <line x1="-8" y1="4" x2="8" y2="4" stroke="white" strokeWidth="1.5" />
              <text y="46" textAnchor="middle" fill={isDark ? "#94a3b8" : "#475569"} fontSize="11" fontWeight="700">Google Sheets</text>
              <text y="59" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="600">9-Col Master Log</text>
            </g>

            {/* ===================== NODE 6: AUTO-REMINDER CRON ===================== */}
            <g 
              transform="translate(920, 90)" 
              className="cursor-pointer group"
              onClick={() => setSelectedNode(PIPELINE_NODES.reminder)}
            >
              <circle 
                r="30" 
                fill={isDark ? "#0f172a" : "#f8fafc"} 
                stroke="#f59e0b" 
                strokeWidth={activeStep === 4 ? "2.5" : "1.5"} 
                className="transition-all"
              />
              {activeStep === 4 && (
                <circle r="38" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" className="animate-pulse-ring" />
              )}
              <circle r="16" fill="#f59e0b" />
              {/* Bell Shape */}
              <path d="M -6 4 C -6 -4, 6 -4, 6 4 Z" fill="white" />
              <circle cx="0" cy="7" r="1.5" fill="white" />
              <text y="46" textAnchor="middle" fill={isDark ? "#94a3b8" : "#475569"} fontSize="11" fontWeight="700">Auto Reminders</text>
              <text y="59" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="600">15-Min Scheduler</text>
            </g>

            {/* ===================== NODE 7: DAILY 8 PM OWNER REPORT ===================== */}
            <g 
              transform="translate(920, 230)" 
              className="cursor-pointer group"
              onClick={() => setSelectedNode(PIPELINE_NODES.report)}
            >
              <circle 
                r="30" 
                fill={isDark ? "#0f172a" : "#f8fafc"} 
                stroke="#ec4899" 
                strokeWidth={activeStep === 4 ? "2.5" : "1.5"} 
                className="transition-all"
              />
              {activeStep === 4 && (
                <circle r="38" fill="none" stroke="#ec4899" strokeWidth="1.5" opacity="0.6" className="animate-pulse-ring" />
              )}
              <circle r="16" fill="#ec4899" />
              {/* Mail Shape */}
              <rect x="-8" y="-6" width="16" height="12" rx="2" fill="white" />
              <path d="M -8 -4 L 0 2 L 8 -4" fill="none" stroke="#ec4899" strokeWidth="1.5" />
              <text y="46" textAnchor="middle" fill={isDark ? "#94a3b8" : "#475569"} fontSize="11" fontWeight="700">8 PM Summary</text>
              <text y="59" textAnchor="middle" fill="#ec4899" fontSize="9" fontWeight="600">Director Email</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Node Inspection Drawer / Live Telemetry Bar */}
      <div className={`px-5 py-4 border-t flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'border-slate-800 bg-[#070b14]/90' : 'border-slate-200 bg-slate-50'
      }`}>
        {selectedNode ? (
          <div className="flex-1 min-w-0 flex items-start sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  {selectedNode.phase}
                </span>
                <h4 className={`text-xs sm:text-sm font-bold truncate ${theme.classes.textPrimary}`}>
                  {selectedNode.name}
                </h4>
              </div>
              <p className={`text-xs mt-0.5 ${theme.classes.textSecondary}`}>
                {selectedNode.description}
              </p>
              <p className="text-[11px] font-mono text-cyan-500 mt-0.5">
                Tech Stack: {selectedNode.tech}
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs text-slate-400 hover:text-slate-200 shrink-0 font-semibold underline"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            <div className={`p-2.5 rounded-xl border flex items-center space-x-2.5 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0"></div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-medium">Pipeline Status</p>
                <p className="text-xs font-bold text-emerald-400 truncate">100% Operational</p>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center space-x-2.5 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-medium">Message Latency</p>
                <p className="text-xs font-bold text-cyan-400 truncate">~380 ms Average</p>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center space-x-2.5 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-medium">Auto-Reminders</p>
                <p className="text-xs font-bold text-amber-400 truncate">15-Min Cron Window</p>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center space-x-2.5 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0"></div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-medium">Audit Sync</p>
                <p className="text-xs font-bold text-purple-400 truncate">Google Sheets + Cal</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
