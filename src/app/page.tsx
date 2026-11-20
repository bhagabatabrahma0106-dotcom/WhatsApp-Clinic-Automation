'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  MessageSquare,
  FileSpreadsheet,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RotateCcw,
  Sparkles,
  Download,
  Settings,
  Bell,
  Mail,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  PhoneCall,
  UserCheck,
  CalendarCheck,
  TrendingUp,
  DollarSign,
  Users,
  Mic,
  Volume2,
  Check,
  Copy,
  Sliders,
  Award,
  Stethoscope,
  Building,
  HelpCircle,
  PlusCircle,
  XCircle,
  CheckCircle,
  ArrowUpRight,
  Sun,
  Moon,
  Zap,
  Cpu,
  Layers,
  Activity,
  Radio,
  Play,
  Pause,
  Palette
} from 'lucide-react';
import { Appointment, ClinicSettings, ChatMessage, ToolExecutionRecord } from '@/lib/types';
import { COLOR_THEMES, ColorThemeId } from '@/lib/themes';
import MotionGraphicsPipeline from '@/components/MotionGraphicsPipeline';
import MotionTelemetryCard from '@/components/MotionTelemetryCard';
import BookingToast from '@/components/BookingToast';

// Animated Counter Hook
function useAnimatedCount(target: number, duration: number = 1000): number {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let start = 0;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

export default function ClinicApp() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'pipeline' | 'sheet' | 'calendar' | 'reports' | 'client-demo' | 'branding' | 'guide'>('simulator');
  const [themeId, setThemeId] = useState<ColorThemeId>('cyber-emerald');
  const theme = COLOR_THEMES[themeId];
  const isDarkMode = theme.isDark;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [closedDates, setClosedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Simulator state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simPhone, setSimPhone] = useState<string>('919876543210');
  const [toolLogs, setToolLogs] = useState<ToolExecutionRecord[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Booked' | 'Cancelled' | 'Completed'>('All');

  // Report state
  const [dailyReport, setDailyReport] = useState<string>('');
  const [reminderResult, setReminderResult] = useState<any>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [toastInfo, setToastInfo] = useState<{ title: string; patientName: string; time: string } | null>(null);

  // Branding Edit Form State
  const [editForm, setEditForm] = useState<Partial<ClinicSettings>>({});
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Client Handover Checklist State (Phase 9.4)
  const [handoverChecks, setHandoverChecks] = useState<Record<string, boolean>>({
    accounts: true,
    workflows: true,
    receptionist: false,
    emergency: true,
    privacy: true,
    terms: true,
  });

  // Quote Calculator State (Phase 9.3)
  const [quoteSetupFee, setQuoteSetupFee] = useState<number>(25000);
  const [quoteMonthlyFee, setQuoteMonthlyFee] = useState<number>(5000);
  const [quotePatientsPerDay, setQuotePatientsPerDay] = useState<number>(20);
  const [copiedPitch, setCopiedPitch] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aptRes, setRes, simRes] = await Promise.all([
        fetch('/api/appointments').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
        fetch(`/api/simulate?phone=${simPhone}`).then(r => r.json())
      ]);

      if (aptRes.appointments) setAppointments(aptRes.appointments);
      if (aptRes.closedDates) setClosedDates(aptRes.closedDates);
      if (setRes) {
        setSettings(setRes);
        setEditForm(setRes);
      }
      if (simRes.history) setMessages(simRes.history);
      if (simRes.toolLogs) setToolLogs(simRes.toolLogs);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string, isVoice: boolean = false) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isSimulating) return;

    setInputMessage('');
    setIsSimulating(true);

    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'patient',
      text,
      timestamp: new Date().toISOString(),
      isVoiceNote: isVoice,
      audioDuration: isVoice ? '0:07' : undefined
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, phone: simPhone })
      });
      const data = await res.json();

      if (data.history) setMessages(data.history);
      if (data.appointments) {
        if (data.appointments.length > appointments.length) {
          const latest = data.appointments[data.appointments.length - 1];
          setToastInfo({
            title: '🎉 Appointment Booked & Synced!',
            patientName: latest.Patient_Name || 'Rahul Sharma',
            time: latest.Time || '11:20 AM'
          });
        }
        setAppointments(data.appointments);
      }
      if (data.toolLogs) setToolLogs(data.toolLogs);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetChat = async () => {
    await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset: true, phone: simPhone })
    });
    setMessages([]);
    setToolLogs([]);
  };

  const handleToggleClosedDate = async (dateStr: string) => {
    const isClosed = closedDates.includes(dateStr);
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggle_closed_date',
        date: dateStr,
        closed: !isClosed
      })
    });
    fetchData();
  };

  const handleRunReminders = async () => {
    try {
      const res = await fetch('/api/cron/reminders');
      const data = await res.json();
      setReminderResult(data);
      fetchData();
    } catch (err) {
      console.error('Reminder error:', err);
    }
  };

  const handleRunDailyReport = async () => {
    try {
      setEmailStatus('Generating & dispatching...');
      const res = await fetch('/api/cron/daily-report');
      const data = await res.json();
      if (data.reportData) {
        setDailyReport(data.reportData.reportText);
        setEmailStatus(data.emailResult?.message || 'Report sent successfully');
      }
    } catch (err) {
      setEmailStatus('Failed to send report.');
      console.error('Report error:', err);
    }
  };

  const handleUpdateAppointmentStatus = async (eventId: string, newStatus: 'Booked' | 'Cancelled' | 'Completed') => {
    await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        updates: { Status: newStatus }
      })
    });
    fetchData();
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Save settings error:', err);
    }
  };

  const copyPitchText = () => {
    const pitch = `Namaste Dr. ${settings?.doctorName || '<Doctor>'}, main clinics ke liye WhatsApp appointment automation banata hoon.\nPatient WhatsApp par message kare to system khud naam, problem aur date puchkar Google Calendar me slot book kar deta hai, reminder bhejta hai aur aapko roz raat 8 baje report deta hai.\nKya main 5 minute ka live demo dikha sakta hoon? Koi cost nahi.`;
    navigator.clipboard.writeText(pitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2500);
  };

  const exportCSV = () => {
    const headers = ['Start_ISO', 'Date', 'Time', 'Patient_Name', 'Doctor_Name', 'Phone', 'Problem', 'Status', 'Event_ID', 'Reminder_Sent', 'Fee'];
    const rows = appointments.map(a => [
      `"${a.Start_ISO}"`,
      `"${a.Date}"`,
      `"${a.Time}"`,
      `"${a.Patient_Name}"`,
      `"${a.Doctor_Name || settings?.doctorName || ''}"`,
      `"${a.Phone}"`,
      `"${a.Problem}"`,
      `"${a.Status}"`,
      `"${a.Event_ID}"`,
      `"${a.Reminder_Sent}"`,
      `"${a.fee || 500}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Clinic_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeBookings = appointments.filter(a => a.Status === 'Booked' || a.Status === 'Completed');
  const cancelledBookings = appointments.filter(a => a.Status === 'Cancelled');
  const rawRevenue = activeBookings.reduce((sum, a) => sum + (a.fee || settings?.consultationFee || 500), 0);

  // Animated counters
  const animatedBookings = useAnimatedCount(activeBookings.length, 800);
  const animatedRevenue = useAnimatedCount(rawRevenue, 1200);

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = 
      a.Patient_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.Phone.includes(searchTerm) ||
      a.Problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.Event_ID.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.Status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${theme.classes.bg} ${theme.isDark ? 'dark' : ''}`}>
      {/* Background Futuristic Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] transition-all duration-700 ${theme.classes.glow1}`}></div>
        <div className={`absolute top-1/3 -right-40 w-96 h-96 rounded-full blur-[140px] transition-all duration-700 ${theme.classes.glow2}`}></div>
      </div>

      {/* Celebratory Booking Toast Notification */}
      {toastInfo && (
        <BookingToast
          theme={theme}
          title={toastInfo.title}
          patientName={toastInfo.patientName}
          time={toastInfo.time}
          onClose={() => setToastInfo(null)}
          onViewSheet={() => setActiveTab('sheet')}
        />
      )}

      {/* Top Navbar */}
      <header className={`w-full border-b sticky top-0 z-40 transition-colors backdrop-blur-xl relative ${theme.classes.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand Info */}
          <div className="flex items-center space-x-3.5 min-w-0 flex-1">
            <div className="relative group shrink-0">
              <div 
                className="h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-lg ring-2 transition-all"
                style={{ backgroundColor: theme.accentColor, boxShadow: `0 10px 25px -5px ${theme.accentColor}40` }}
              >
                <Stethoscope className="w-5 h-5 animate-pulse-subtle" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping"></span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={`font-extrabold text-base sm:text-lg tracking-tight truncate ${theme.classes.textPrimary}`}>
                  {settings?.clinicName || 'Sunrise Multi-Speciality Clinic'}
                </h1>
                <span className={`text-[10px] ${theme.classes.accentBg} ${theme.classes.accentText} font-bold px-2.5 py-0.5 rounded-full border ${theme.classes.accentBorder} shrink-0 flex items-center shadow-xs`}>
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  {theme.name}
                </span>
              </div>
              <p className={`text-xs ${theme.classes.textSecondary} truncate mt-0.5`}>
                <span className={`font-semibold ${theme.classes.accentText}`}>{settings?.doctorName || 'Dr. Mehta'}</span>
                <span className="mx-1.5">•</span>
                <span>{settings?.doctorSpecialty || 'Dental Surgeon'}</span>
                <span className="mx-1.5">•</span>
                <span>10:00 AM - 6:00 PM IST</span>
              </p>
            </div>
          </div>

          {/* Quick Actions & 4-Theme Curated Palette Switcher */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Curated Color Themes Picker */}
            <div className={`flex items-center space-x-1 p-1 rounded-xl border ${
              theme.isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`} title="Select Theme Palette">
              <div className="px-1.5 flex items-center text-[10px] font-bold text-slate-400">
                <Palette className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <span className="hidden lg:inline">Theme:</span>
              </div>
              {(Object.keys(COLOR_THEMES) as ColorThemeId[]).map(tId => {
                const t = COLOR_THEMES[tId];
                const isSelected = themeId === tId;
                return (
                  <button
                    key={tId}
                    onClick={() => setThemeId(tId)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1.5 transition-all ${
                      isSelected
                        ? `${theme.isDark ? 'bg-slate-800 text-white shadow-xs ring-1 ring-white/20' : 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300'}`
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={`${t.name}: ${t.tagline}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.accentColor }}></span>
                    <span className="hidden sm:inline">{t.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setActiveTab('client-demo')}
              className="text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 font-bold transition btn-interact shadow-xs"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>5-Min Pitch</span>
            </button>
            <button
              onClick={handleRunReminders}
              className={`text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 font-medium transition btn-interact border ${theme.classes.secondaryBtn}`}
            >
              <Bell className="w-3.5 h-3.5 text-teal-400" />
              <span>Reminders</span>
            </button>
            <button
              onClick={handleRunDailyReport}
              className={`text-xs ${theme.classes.primaryBtn} px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 font-bold transition btn-interact shadow-md`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>8 PM Report</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1.5 border-t border-slate-200 dark:border-slate-800/80 overflow-x-auto no-scrollbar">
          {[
            { id: 'simulator', label: 'WhatsApp 3D Simulator', icon: MessageSquare, badge: 'Interactive' },
            { id: 'pipeline', label: 'Motion Graphics Pipeline', icon: Activity, badge: 'Live Stream' },
            { id: 'sheet', label: 'Google Sheets (Bookings Log)', icon: FileSpreadsheet, badge: `${appointments.length} Rows` },
            { id: 'calendar', label: 'Calendar & 20-Min Slots', icon: Calendar, badge: 'IST Grid' },
            { id: 'reports', label: 'Auto-Reminders & 8 PM Report', icon: Bell, badge: 'Cron Tasks' },
            { id: 'client-demo', label: 'Client Pitch & ROI Calculator', icon: TrendingUp, badge: 'Phase 9' },
            { id: 'branding', label: 'Clinic Customizer & Settings', icon: Sliders, badge: 'Rebrand' },
            { id: 'guide', label: 'PDF Guide & n8n Workflows', icon: ShieldCheck, badge: 'JSON' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-current font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                style={{
                  color: isActive ? theme.accentColor : undefined,
                  borderColor: isActive ? theme.accentColor : 'transparent'
                }}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? theme.accentColor : undefined }} />
                <span>{tab.label}</span>
                <span 
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold border transition-all"
                  style={{
                    backgroundColor: isActive ? `${theme.accentColor}20` : undefined,
                    color: isActive ? theme.accentColor : undefined,
                    borderColor: isActive ? `${theme.accentColor}40` : 'transparent'
                  }}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Futuristic Metric Cards with Dynamic Theming */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 w-full relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1 */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 relative overflow-hidden group animate-entrance-1 shadow-lg hover:shadow-2xl ${theme.classes.card} ${theme.classes.cardHoverBorder}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.classes.textSecondary}`}>
                Active Bookings
              </span>
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center ring-1 transition-transform group-hover:scale-110 duration-300"
                style={{ backgroundColor: `${theme.accentColor}15`, color: theme.accentColor }}
              >
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline space-x-2">
              <span className={`text-3xl font-black tracking-tight ${theme.classes.textPrimary}`}>
                {animatedBookings}
              </span>
              <span className="text-xs font-bold flex items-center" style={{ color: theme.accentColor }}>
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> 100% Automated
              </span>
            </div>
            <p className={`text-[11px] mt-1 truncate ${theme.classes.textSecondary}`}>
              {cancelledBookings.length} cancellations • 0 double-bookings
            </p>
          </div>

          {/* Card 2 */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 relative overflow-hidden group animate-entrance-2 shadow-lg hover:shadow-2xl ${theme.classes.card} ${theme.classes.cardHoverBorder}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.classes.textSecondary}`}>
                Consultation Revenue
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center ring-1 ring-cyan-500/20 transition-transform group-hover:scale-110 duration-300">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline space-x-2">
              <span className={`text-3xl font-black tracking-tight ${theme.classes.textPrimary}`}>
                ₹{animatedRevenue.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-cyan-500 font-semibold">calculated</span>
            </div>
            <p className={`text-[11px] mt-1 truncate ${theme.classes.textSecondary}`}>
              Avg ₹{settings?.consultationFee || 500} per patient visit
            </p>
          </div>

          {/* Card 3 */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 relative overflow-hidden group animate-entrance-3 shadow-lg hover:shadow-2xl ${theme.classes.card} ${theme.classes.cardHoverBorder}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.classes.textSecondary}`}>
                No-Show Reduction
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center ring-1 ring-amber-500/20 transition-transform group-hover:scale-110 duration-300">
                <Bell className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline space-x-2">
              <span className={`text-3xl font-black tracking-tight ${theme.classes.textPrimary}`}>94.8%</span>
              <span className="text-xs font-bold text-amber-500">Attendance</span>
            </div>
            <p className={`text-[11px] mt-1 truncate ${theme.classes.textSecondary}`}>
              Driven by 15-min WhatsApp templates (Workflow 2)
            </p>
          </div>

          {/* Card 4 */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 relative overflow-hidden group animate-entrance-4 shadow-lg hover:shadow-2xl ${theme.classes.card} ${theme.classes.cardHoverBorder}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.classes.textSecondary}`}>
                Staff Hours Saved
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center ring-1 ring-indigo-500/20 transition-transform group-hover:scale-110 duration-300">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline space-x-2">
              <span className={`text-3xl font-black tracking-tight ${theme.classes.textPrimary}`}>2.5 Hrs</span>
              <span className="text-xs font-bold text-indigo-500">daily</span>
            </div>
            <p className={`text-[11px] mt-1 truncate ${theme.classes.textSecondary}`}>
              Instant responses 24/7 without receptionist burnout
            </p>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full relative z-10">
        {/* TAB 1: WHATSAPP 3D SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
            {/* Motion Stream Quick-Look Banner */}
            <div className={`xl:col-span-12 flex items-center justify-between p-3.5 rounded-2xl border transition shadow-sm ${
              isDarkMode 
                ? 'bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900/60 border-emerald-500/30' 
                : 'bg-gradient-to-r from-emerald-50 via-cyan-50 to-white border-emerald-200'
            }`}>
              <div className="flex items-center space-x-3 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                <span className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Live Motion Graphics: Active SVG Pipeline Streaming
                </span>
                <span className="hidden md:inline text-[11px] text-slate-500 dark:text-slate-400">
                  • 7 tools wired • Asia/Kolkata +05:30 slots • Meta v22.0
                </span>
              </div>
              <button
                onClick={() => setActiveTab('pipeline')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 shrink-0 ml-2"
              >
                <span>Full Motion View &gt;</span>
              </button>
            </div>

            {/* 3D Tilted Device Mockup */}
            <div className="xl:col-span-7 flex flex-col w-full min-w-0 perspective-1000">
              <div className={`rounded-3xl border shadow-2xl overflow-hidden flex flex-col h-[710px] tilt-device ${
                theme.isDark 
                  ? 'bg-[#111b21] border-slate-700/80 shadow-black/50' 
                  : 'bg-white border-slate-300 shadow-xl'
              }`}>
                {/* Phone Speaker Notch Header */}
                <div className="bg-[#1f2c34] py-1.5 flex justify-center items-center border-b border-[#2a3942]/60">
                  <div className="w-16 h-1 rounded-full bg-slate-600"></div>
                </div>

                {/* WhatsApp Chat Top Bar */}
                <div className="bg-[#202c33] text-white px-4 py-3 flex items-center justify-between border-b border-[#2a3942]">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                        {settings?.doctorName?.slice(0, 2) || 'SC'}
                      </div>
                      <span className="w-3 h-3 bg-emerald-400 border-2 border-[#202c33] rounded-full absolute bottom-0 right-0"></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-xs sm:text-sm leading-snug truncate flex items-center">
                        {settings?.clinicName || 'Sunrise Clinic'}
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1.5 shrink-0" />
                      </h3>
                      <p className="text-[11px] text-emerald-400 flex items-center truncate">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 shrink-0 animate-ping"></span>
                        AI Medical Receptionist (Online)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] bg-[#111b21] border border-[#2a3942] text-slate-300 px-2 py-0.5 rounded font-mono">
                      +{simPhone}
                    </span>
                    <button
                      onClick={handleResetChat}
                      className="p-1.5 rounded-lg bg-[#2a3942] hover:bg-[#374248] text-slate-300 transition"
                      title="Clear chat context memory"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* WhatsApp Chat Canvas */}
                <div
                  ref={chatScrollRef}
                  className={`flex-1 p-3.5 overflow-y-auto space-y-3.5 w-full ${
                    isDarkMode ? 'bg-[#0b141a]' : 'bg-[#efeae2]/85'
                  }`}
                  style={{
                    backgroundImage: `radial-gradient(${isDarkMode ? '#202c33' : '#cbd5e1'} 1px, transparent 1px)`,
                    backgroundSize: '16px 16px'
                  }}
                >
                  <div className="text-center my-1 px-2">
                    <span className="text-[10px] bg-[#182229] text-amber-300/90 px-3.5 py-1 rounded-full border border-amber-500/20 shadow-xs inline-block max-w-full break-words">
                      🔒 End-to-end encrypted • AI operates under strict clinic rules, zero medical advice & emergency redirects.
                    </span>
                  </div>

                  {messages.length === 0 && (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-16">
                      <MessageSquare className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2 opacity-40 animate-float" />
                      <p className="text-sm font-medium">WhatsApp AI Receptionist Ready</p>
                      <p className="text-xs mt-1">Click any test step from the right panel to test live!</p>
                    </div>
                  )}

                  {messages.map((msg, idx) => {
                    const isPatient = msg.sender === 'patient';
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col w-full ${isPatient ? 'items-end' : 'items-start'} transition-all`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-md break-words break-words-safe overflow-hidden transition-all ${
                            isPatient
                              ? 'bg-[#005c4b] text-white rounded-tr-xs animate-msg-patient'
                              : 'bg-[#202c33] text-slate-100 rounded-tl-xs border border-[#2a3942] animate-msg-assistant'
                          }`}
                        >
                          {msg.isVoiceNote ? (
                            <div className="flex items-center space-x-3 py-1">
                              <button
                                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                                className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shrink-0 transition"
                              >
                                {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                              </button>
                              {/* Animated Soundwave Frequency Bars */}
                              <div className="flex items-center space-x-1 shrink-0">
                                {[14, 28, 18, 34, 16, 30, 22, 12, 26, 18].map((h, bIdx) => (
                                  <div
                                    key={bIdx}
                                    className={`w-1 rounded-full transition-all ${
                                      isPlayingAudio ? 'bg-cyan-400 soundwave-bar' : 'bg-emerald-400'
                                    }`}
                                    style={{
                                      height: isPlayingAudio ? undefined : `${h}px`,
                                      animationDelay: `${bIdx * 0.1}s`
                                    }}
                                  ></div>
                                ))}
                              </div>
                              <span className="text-[10px] text-slate-300 font-mono">0:07</span>
                            </div>
                          ) : (
                            <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                          )}

                          <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-slate-400">
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isPatient && <span className="text-emerald-400 font-bold ml-1">✓✓</span>}
                          </div>
                        </div>

                        {/* Tool Execution Tagging */}
                        {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {msg.toolsUsed.map((tool, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-[9px] bg-emerald-950/60 text-emerald-300 font-mono px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center shadow-xs"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-emerald-400 mr-1 shrink-0" />
                                {tool}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isSimulating && (
                    <div className="flex items-center space-x-2 bg-[#202c33] px-3.5 py-2.5 rounded-2xl border border-[#2a3942] w-36 shadow-md">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></div>
                      <span className="text-xs text-slate-300 font-medium">AI thinking...</span>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div className="bg-[#202c33] p-3 border-t border-[#2a3942] flex items-center space-x-2">
                  <button
                    onClick={() => handleSendMessage("Audio note: Mujhe emergency appointment chahiye", true)}
                    className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-[#2a3942] rounded-full transition btn-interact shrink-0"
                    title="Simulate Voice Note (Phase 9.1 non-text rule)"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type message in Hinglish, Hindi, or English..."
                    className="flex-1 min-w-0 bg-[#2a3942] text-white placeholder-slate-400 border border-transparent rounded-full px-4 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:border-emerald-400"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isSimulating || !inputMessage.trim()}
                    className="bg-[#00a884] hover:bg-[#008f70] text-white p-2.5 rounded-full disabled:opacity-40 transition btn-interact shadow-md shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel: Verification Tests & Live Tool Inspector */}
            <div className="xl:col-span-5 flex flex-col space-y-4 w-full min-w-0">
              {/* Motion Telemetry Heartbeat & Confidence */}
              <MotionTelemetryCard theme={theme} />

              {/* Phase 5 Test Suite */}
              <div className={`rounded-2xl border p-5 shadow-xl ${
                isDarkMode ? 'bg-[#101726]/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className={`font-bold text-xs sm:text-sm flex items-center space-x-2 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>Phase 5: 1-Click Verification Tests</span>
                  </h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    8 PDF Steps
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Click any test step to verify the conversation dialogue rules:
                </p>

                <div className="mt-3 space-y-2">
                  {[
                    { num: 1, text: "Hi, mujhe kal doctor se appointment chahiye", label: "Step 1: Greeting + Consent Notice" },
                    { num: 2, text: "Rahul Sharma", label: "Step 2: Patient Full Name" },
                    { num: 3, text: "Daant me dard hai", label: "Step 3: Medical Problem & Slot Search" },
                    { num: 4, text: "11:20 AM", label: "Step 4: Select Slot & Confirm Booking" },
                    { num: 5, text: "Mujhe seene me dard hai aur saans nahi aa rahi", label: "Step 7: Emergency Protection Rule" },
                    { num: 6, text: "Meri appointment cancel kar do", label: "Step 8: Cancel Appointment Request" },
                  ].map(test => (
                    <button
                      key={test.num}
                      onClick={() => {
                        handleSendMessage(test.text);
                        if (test.num === 4) {
                          setToastInfo({
                            title: '🎉 Appointment Confirmed & Synced!',
                            patientName: 'Rahul Sharma',
                            time: '11:20 AM'
                          });
                        }
                      }}
                      disabled={isSimulating}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all btn-interact group flex items-start space-x-2.5 min-w-0 ${
                        isDarkMode 
                          ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500 hover:bg-emerald-950/20' 
                          : 'bg-slate-50 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50'
                      }`}
                    >
                      <span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                        #{test.num}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                            {test.label}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0 ml-1">
                            Send &gt;
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate mt-0.5">"{test.text}"</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Tool Call Inspector */}
              <div className={`rounded-2xl border p-5 shadow-xl flex-1 overflow-hidden flex flex-col ${
                isDarkMode ? 'bg-[#101726]/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className={`font-bold text-xs sm:text-sm flex items-center space-x-2 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Real-Time Tool Execution Log</span>
                  </h3>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono px-2 py-0.5 rounded">
                    7 Tools Monitored
                  </span>
                </div>

                <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-56">
                  {toolLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-8">
                      No tool executions logged yet. Send a booking message in chat!
                    </p>
                  ) : (
                    toolLogs.map((log, lIdx) => (
                      <div key={lIdx} className={`rounded-xl p-3 border text-xs font-mono min-w-0 ${
                        isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold mb-1.5">
                          <span className="truncate flex items-center">
                            <CheckCircle className="w-3 h-3 text-emerald-500 mr-1.5 shrink-0" />
                            {log.name}()
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans shrink-0 ml-1">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className={`text-[10px] p-2 rounded-lg border overflow-hidden break-all break-words-safe ${
                          isDarkMode ? 'bg-[#070b14] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                          <span className="text-slate-400 font-sans font-medium">Input: </span>
                          {JSON.stringify(log.params)}
                        </div>
                        <div className={`text-[10px] p-2 rounded-lg border mt-1.5 overflow-hidden break-all break-words-safe ${
                          isDarkMode 
                            ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' 
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                          <span className="font-sans font-medium opacity-75">Result: </span>
                          {JSON.stringify(log.result)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MOTION GRAPHICS PIPELINE */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6 w-full min-w-0">
            {/* Main Interactive Motion Graphics Pipeline */}
            <MotionGraphicsPipeline theme={theme} isSimulating={isSimulating} />

            {/* Supporting Telemetry and Architecture Explainer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
              <div className="lg:col-span-5 w-full">
                <MotionTelemetryCard theme={theme} />
              </div>

              <div className={`lg:col-span-7 p-5 rounded-2xl border flex flex-col justify-between shadow-xl ${
                isDarkMode ? 'bg-[#101726]/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                    <h4 className={`text-xs sm:text-sm font-bold flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span>Zero-Latency Motion Graphics Architecture</span>
                    </h4>
                    <span className="text-[10px] font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      Phase 0 - 7
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                    This motion visualizer demonstrates how patient appointments flow end-to-end with zero human delay:
                  </p>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 mt-2 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-emerald-500">Inbound WhatsApp</strong>: Meta Graph API v22.0 webhook triggers n8n or Next.js.</li>
                    <li><strong className="text-cyan-500">LangChain AI Core</strong>: GPT-4o-mini parses patient intent and invokes 7 clinic tools.</li>
                    <li><strong className="text-blue-500">Google Calendar</strong>: Real-time IST slot availability checking and conflict prevention.</li>
                    <li><strong className="text-emerald-500">Google Sheets DB</strong>: Automatic logging of patient records into 9-column spreadsheet.</li>
                    <li><strong className="text-amber-500">Auto-Reminders & 8 PM Report</strong>: 15-minute cron templates and daily clinic owner summaries.</li>
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-emerald-500 font-semibold">
                    ✓ Interactive SVG animations: Click any node above to inspect phase specs
                  </span>
                  <button
                    onClick={() => setActiveTab('simulator')}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center space-x-1"
                  >
                    <span>Test In Live Simulator &gt;</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GOOGLE SHEETS LIVE VIEW */}
        {activeTab === 'sheet' && (
          <div className={`rounded-2xl border shadow-xl overflow-hidden ${
            isDarkMode ? 'bg-[#101726]/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h2 className={`text-base sm:text-lg font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Google Sheet: Clinic Appointments Log (Bookings)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Headers strictly match Phase 1.4: <span className="font-mono text-emerald-600 dark:text-emerald-400">Start_ISO | Date | Time | Patient_Name | Phone | Problem | Status | Event_ID | Reminder_Sent</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Search log..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={`text-xs rounded-xl px-3 py-2 border focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className={`text-xs rounded-xl px-3 py-2 border focus:outline-hidden ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'
                  }`}
                >
                  <option value="All">All Statuses</option>
                  <option value="Booked">Booked</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
                <button
                  onClick={exportCSV}
                  className={`text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition border ${
                    isDarkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={fetchData}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[950px]">
                <thead>
                  <tr className={`font-semibold border-b ${
                    isDarkMode 
                      ? 'bg-slate-900/80 text-slate-400 border-slate-800' 
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 w-10">#</th>
                    <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-mono">Start_ISO (Col A)</th>
                    <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-mono">Date (Col B)</th>
                    <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-mono">Time (Col C)</th>
                    <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-mono">Patient_Name (Col D)</th>
                    <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-mono">Phone (Col E)</th>
                    <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-mono">Problem (Col F)</th>
                    <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-mono">Status (Col G)</th>
                    <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-mono">Event_ID (Col H)</th>
                    <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-mono">Reminder_Sent (Col I)</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400 font-sans">
                        No appointments found matching your search. Book an appointment in the simulator!
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt, index) => (
                      <tr key={apt.id || index} className={`transition ${
                        isDarkMode ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50'
                      }`}>
                        <td className="p-3.5 text-slate-400 border-r border-slate-200 dark:border-slate-800 font-sans">{index + 1}</td>
                        <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">{apt.Start_ISO}</td>
                        <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">{apt.Date}</td>
                        <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{apt.Time}</td>
                        <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-sans font-medium whitespace-nowrap">{apt.Patient_Name}</td>
                        <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">{apt.Phone}</td>
                        <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-sans max-w-xs truncate">{apt.Problem}</td>
                        <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 font-sans">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              apt.Status === 'Booked'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/30'
                                : apt.Status === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-500/30'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {apt.Status}
                          </span>
                        </td>
                        <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold whitespace-nowrap">{apt.Event_ID}</td>
                        <td className="p-3.5 border-r border-slate-200 dark:border-slate-800 text-center font-sans">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              apt.Reminder_Sent === 'Yes'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                            }`}
                          >
                            {apt.Reminder_Sent}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap font-sans">
                          <div className="flex items-center justify-center space-x-2">
                            {apt.Status === 'Booked' && (
                              <>
                                <button
                                  onClick={() => handleUpdateAppointmentStatus(apt.Event_ID, 'Completed')}
                                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleUpdateAppointmentStatus(apt.Event_ID, 'Cancelled')}
                                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {apt.Status === 'Cancelled' && (
                              <button
                                onClick={() => handleUpdateAppointmentStatus(apt.Event_ID, 'Booked')}
                                className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
                              >
                                Reopen
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CALENDAR & SLOTS */}
        {activeTab === 'calendar' && (
          <div className="space-y-5 w-full min-w-0">
            <div className={`rounded-2xl border p-5 shadow-xl ${
              isDarkMode ? 'bg-[#101726]/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <CalendarCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <h2 className={`text-base sm:text-lg font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {settings?.clinicName} Live Slot Calendar
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Hours: Mon-Sat, 10:00 AM - 6:00 PM IST | Slot Duration: {settings?.slotDurationMinutes || 20} min | Lunch: 1:00 PM - 2:00 PM
                  </p>
                </div>
                <div className="shrink-0">
                  <button
                    onClick={() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      handleToggleClosedDate(todayStr);
                    }}
                    className={`text-xs px-4 py-2 rounded-xl font-bold border transition ${
                      closedDates.includes(new Date().toISOString().split('T')[0])
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-500 font-bold'
                        : isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {closedDates.includes(new Date().toISOString().split('T')[0])
                      ? '⚠️ CLINIC CLOSED (Holiday Active)'
                      : 'Mark Today CLINIC CLOSED (Phase 1.3)'}
                  </button>
                </div>
              </div>

              {/* 20-min Slot Timeline */}
              <div className="mt-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className={`font-bold text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Today's 20-Minute Slots Grid
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-emerald-500 mr-1.5 shrink-0"></span> Booked</span>
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-700 mr-1.5 shrink-0"></span> Free</span>
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-amber-400 mr-1.5 shrink-0"></span> Lunch (1-2 PM)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {[
                    "10:00 AM", "10:20 AM", "10:40 AM",
                    "11:00 AM", "11:20 AM", "11:40 AM",
                    "12:00 PM", "12:20 PM", "12:40 PM",
                    "01:00 PM (Lunch)", "01:20 PM (Lunch)", "01:40 PM (Lunch)",
                    "02:00 PM", "02:20 PM", "02:40 PM",
                    "03:00 PM", "03:20 PM", "03:40 PM",
                    "04:00 PM", "04:20 PM", "04:40 PM",
                    "05:00 PM", "05:20 PM", "05:40 PM",
                  ].map((timeLabel, idx) => {
                    const isLunch = timeLabel.includes('Lunch');
                    const cleanTime = timeLabel.split(' ')[0] + ' ' + timeLabel.split(' ')[1];
                    const bookedApt = appointments.find(
                      a => a.Status === 'Booked' && (a.Time === cleanTime || a.Time.startsWith(timeLabel.slice(0, 5)))
                    );

                    let cardClass = isDarkMode
                      ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800 shadow-2xs';

                    if (isLunch) {
                      cardClass = isDarkMode 
                        ? 'bg-amber-950/20 border-amber-900/40 text-amber-400' 
                        : 'bg-amber-50/70 border-amber-200 text-amber-800';
                    } else if (bookedApt) {
                      cardClass = isDarkMode 
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900';
                    }

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex flex-col justify-between text-xs min-h-[76px] transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer overflow-hidden min-w-0 ${cardClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs truncate">{cleanTime}</span>
                          {bookedApt ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping"></span>
                          ) : isLunch ? (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold shrink-0">Break</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 shrink-0">Free</span>
                          )}
                        </div>
                        {bookedApt ? (
                          <div className="mt-1 min-w-0">
                            <p className="font-semibold truncate">{bookedApt.Patient_Name}</p>
                            <p className="text-[10px] opacity-75 truncate">{bookedApt.Problem}</p>
                          </div>
                        ) : isLunch ? (
                          <p className="text-[10px] opacity-70 italic truncate">1-2 PM Pause</p>
                        ) : (
                          <p className="text-[10px] text-slate-400 truncate">20 min slot</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUTO-REMINDER & DAILY 8 PM REPORT */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            {/* Auto Reminder Card (Workflow 2) */}
            <div className={`rounded-2xl border p-5 shadow-xl flex flex-col min-w-0 ${
              isDarkMode ? 'bg-[#101726]/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Workflow 2: Auto Reminder Engine
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">15-minute scheduler (30-75 min window)</p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                  Active
                </span>
              </div>

              <div className="mt-3.5 text-xs text-slate-600 dark:text-slate-300 space-y-2.5 flex-1 min-w-0">
                <p className="break-words">
                  Scans Google Sheet Bookings for patients with <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">Status = Booked</span> and <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">Reminder_Sent = No</span>.
                </p>

                {/* WhatsApp Template Card Preview */}
                <div className={`p-3.5 rounded-xl border ${
                  isDarkMode ? 'bg-[#070b14] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 block mb-1">
                    Meta Utility Template: appointment_reminder
                  </span>
                  <div className={`p-2.5 rounded-lg border text-xs leading-relaxed break-words ${
                    isDarkMode ? 'bg-[#202c33] border-[#2a3942] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    Hello Rahul Sharma, this is a reminder from {settings?.clinicName}. Your appointment is today at 11:20 AM with {settings?.doctorName}. To reschedule or cancel, please reply to this message.
                  </div>
                </div>

                {reminderResult && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                    <p className="font-bold flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500 shrink-0" />
                      15-Min Scheduler Executed!
                    </p>
                    <p className="text-[11px] mt-0.5">
                      Checked: {reminderResult.processed} bookings | Reminders sent: {reminderResult.sentCount}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono truncate mr-2">/api/cron/reminders</span>
                <button
                  onClick={handleRunReminders}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition shadow-xs shrink-0"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Execute Scan</span>
                </button>
              </div>
            </div>

            {/* Daily Owner Report Card (Workflow 3) */}
            <div className={`rounded-2xl border p-5 shadow-xl flex flex-col min-w-0 ${
              isDarkMode ? 'bg-[#101726]/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Workflow 3: Daily Owner Report
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Scheduled daily at 8:00 PM IST</p>
                  </div>
                </div>
                <span className="text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-400 font-semibold px-2 py-0.5 rounded-full border border-cyan-500/30 shrink-0">
                  Ready
                </span>
              </div>

              <div className="mt-3.5 flex-1 flex flex-col min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                  Dispatched to: <span className="font-semibold text-cyan-600 dark:text-cyan-400">{settings?.ownerEmail}</span>
                </p>

                <div className={`p-3 rounded-xl font-mono text-[11px] flex-1 overflow-x-auto whitespace-pre-wrap break-words min-h-[170px] border leading-relaxed ${
                  isDarkMode ? 'bg-[#070b14] text-slate-200 border-slate-800' : 'bg-slate-900 text-slate-100 border-slate-800'
                }`}>
                  {dailyReport || `Click "Generate & Send Report" below to preview the Phase 7.2 formatted summary.`}
                </div>

                {emailStatus && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center truncate">
                    <CheckCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                    {emailStatus}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono truncate mr-2">/api/cron/daily-report</span>
                <button
                  onClick={handleRunDailyReport}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition shadow-xs shrink-0"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Generate Report</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CLIENT PRESENTATION & 5-MIN DEMO SUITE */}
        {activeTab === 'client-demo' && (
          <div className="space-y-5 w-full min-w-0">
            {/* 5-Minute Pitch Card */}
            <div className={`rounded-3xl border p-5 sm:p-7 shadow-xl ${
              isDarkMode ? 'bg-[#101726]/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Phase 9.2: Clinic Owner 5-Minute Demo
                  </span>
                  <h2 className={`text-xl sm:text-2xl font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    How to Win the Clinic Owner in 5 Minutes
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    Follow the exact 5-step demonstration script from the setup guide. Clinic owners immediately appreciate the automated daily email report and zero no-show reminders.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border w-full lg:w-96 shrink-0 ${
                  isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">Doctor Outreach Template</span>
                    <button
                      onClick={copyPitchText}
                      className="text-[10px] text-emerald-500 font-semibold flex items-center space-x-1"
                    >
                      {copiedPitch ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPitch ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 italic leading-relaxed break-words">
                    "Namaste Dr. {settings?.doctorName || '<Name>'}, main clinics ke liye WhatsApp appointment automation banata hoon. Patient WhatsApp par message kare to system khud naam, problem aur date puchkar Google Calendar me slot book kar deta hai, reminder bhejta hai aur aapko roz report deta hai. Kya main 5 minute ka live demo dikha sakta hoon? Koi cost nahi."
                  </p>
                </div>
              </div>

              {/* 5 Demo Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-6">
                {[
                  { step: "1", title: "Setup Demo Data", desc: "Have 2-3 sample booked slots on clinic calendar" },
                  { step: "2", title: "Live Patient Message", desc: "Message test number in front of owner to book a slot" },
                  { step: "3", title: "Show Calendar Event", desc: "Open Google Calendar on your phone to show instant event" },
                  { step: "4", title: "Show Google Sheet", desc: "Show 9-column log with Status = Booked" },
                  { step: "5", title: "Sample Daily Email", desc: "Show 8 PM summary email — owners love this most!" },
                ].map((s, idx) => (
                  <div key={idx} className={`p-3.5 rounded-xl border ${
                    isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                      Step {s.step}
                    </span>
                    <h4 className={`font-bold text-xs mt-1.5 truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing & Handover */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
              <div className={`lg:col-span-6 rounded-2xl border p-5 shadow-xl space-y-3.5 min-w-0 ${
                isDarkMode ? 'bg-[#101726]/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <h3 className={`font-bold text-xs sm:text-sm flex items-center space-x-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span>Phase 9.3: Clinic Quote Calculator</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Market Rates</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 block mb-1">One-Time Setup Fee (₹):</label>
                    <input
                      type="number"
                      value={quoteSetupFee}
                      onChange={e => setQuoteSetupFee(Number(e.target.value))}
                      className={`w-full border rounded-xl p-2.5 font-mono font-bold ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">Guide recommendation: ₹20,000 to ₹25,000</span>
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-slate-400 block mb-1">Monthly Maintenance Fee (₹/month):</label>
                    <input
                      type="number"
                      value={quoteMonthlyFee}
                      onChange={e => setQuoteMonthlyFee(Number(e.target.value))}
                      className={`w-full border rounded-xl p-2.5 font-mono font-bold ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-slate-400 block mb-1">Estimated Daily Patient Volume:</label>
                    <input
                      type="number"
                      value={quotePatientsPerDay}
                      onChange={e => setQuotePatientsPerDay(Number(e.target.value))}
                      className={`w-full border rounded-xl p-2.5 font-mono font-bold ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Client Handover Checklist */}
              <div className={`lg:col-span-6 rounded-2xl border p-5 shadow-xl space-y-3 min-w-0 ${
                isDarkMode ? 'bg-[#101726]/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <h3 className={`font-bold text-xs sm:text-sm flex items-center space-x-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Phase 9.4: Client Handover Checklist</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Delivery Gates</span>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { key: "accounts", label: "Meta, Google, OpenAI registered in clinic ownership" },
                    { key: "workflows", label: "Workflow JSON backups shared with clinic owner" },
                    { key: "receptionist", label: "Receptionist given 15-min training (when to take over)" },
                    { key: "emergency", label: "Emergency flow and support contact written down" },
                    { key: "privacy", label: "Privacy Policy live and consent line verified in bot greeting" },
                    { key: "terms", label: "Monthly maintenance scope and payment terms signed" },
                  ].map(item => (
                    <label
                      key={item.key}
                      onClick={() => setHandoverChecks(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`flex items-start space-x-2.5 p-2 rounded-xl border cursor-pointer transition-all duration-200 btn-interact ${
                        handoverChecks[item.key]
                          ? isDarkMode ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-emerald-50/60 border-emerald-300'
                          : isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={handoverChecks[item.key] || false}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-0 shrink-0 transition-transform active:scale-125"
                      />
                      <span className={`text-xs transition-colors duration-200 ${
                        handoverChecks[item.key] 
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold line-through opacity-90' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CLINIC BRANDING & SETTINGS */}
        {activeTab === 'branding' && (
          <div className={`rounded-3xl border p-5 sm:p-7 shadow-xl max-w-3xl mx-auto w-full ${
            isDarkMode ? 'bg-[#101726]/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="min-w-0 flex-1">
                <h2 className={`text-base sm:text-lg font-bold flex items-center space-x-2 truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Sliders className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Clinic Customizer & Rebranding Suite</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Instantly rebrand the AI receptionist, calendar, and reports for your client.
                </p>
              </div>
              {saveSuccess && (
                <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold flex items-center shrink-0">
                  <Check className="w-3 h-3 mr-1" /> Saved!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveBranding} className="mt-5 space-y-4 text-xs w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Clinic Name:</label>
                  <input
                    type="text"
                    value={editForm.clinicName || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, clinicName: e.target.value }))}
                    className={`w-full border rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Primary Doctor Name:</label>
                  <input
                    type="text"
                    value={editForm.doctorName || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, doctorName: e.target.value }))}
                    className={`w-full border rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Doctor Specialty:</label>
                  <input
                    type="text"
                    value={editForm.doctorSpecialty || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, doctorSpecialty: e.target.value }))}
                    placeholder="e.g. Dental Surgeon"
                    className={`w-full border rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Consultation Fee (₹):</label>
                  <input
                    type="number"
                    value={editForm.consultationFee || 500}
                    onChange={e => setEditForm(prev => ({ ...prev, consultationFee: Number(e.target.value) }))}
                    className={`w-full border rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Slot Duration (Mins):</label>
                  <select
                    value={editForm.slotDurationMinutes || 20}
                    onChange={e => setEditForm(prev => ({ ...prev, slotDurationMinutes: Number(e.target.value) }))}
                    className={`w-full border rounded-xl p-3 focus:outline-hidden ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes (Recommended)</option>
                    <option value={30}>30 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Clinic Phone (Emergency hotline):</label>
                  <input
                    type="text"
                    value={editForm.clinicPhone || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, clinicPhone: e.target.value }))}
                    className={`w-full border rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Owner Report Email:</label>
                  <input
                    type="email"
                    value={editForm.ownerEmail || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, ownerEmail: e.target.value }))}
                    className={`w-full border rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md shadow-emerald-600/30 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 7: PDF GUIDE & N8N WORKFLOWS */}
        {activeTab === 'guide' && (
          <div className="space-y-5 w-full min-w-0">
            <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-500/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">
                    ORVANTA PRACTICAL SETUP GUIDE
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black mt-1">Clinic WhatsApp Appointment Automation</h2>
                  <p className="text-xs text-emerald-100 mt-1.5 max-w-2xl leading-relaxed">
                    Zero-theory manual prepared by Sachin Prajapati. Complete workflows, 7 AI tools, 10 phases, and copy-paste JSON configurations.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 shrink-0">
                  <a
                    href="/workflows/1-clinic-ai-booking-agent.json"
                    download="1-clinic-ai-booking-agent.json"
                    className="text-xs bg-white text-emerald-950 hover:bg-emerald-50 font-bold px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Workflow 1 JSON</span>
                  </a>
                  <a
                    href="/workflows/2-clinic-auto-reminder.json"
                    download="2-clinic-auto-reminder.json"
                    className="text-xs bg-emerald-900/80 hover:bg-emerald-800 text-white font-bold px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition border border-emerald-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Workflow 2 JSON</span>
                  </a>
                  <a
                    href="/workflows/3-clinic-daily-report.json"
                    download="3-clinic-daily-report.json"
                    className="text-xs bg-emerald-900/80 hover:bg-emerald-800 text-white font-bold px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition border border-emerald-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Workflow 3 JSON</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Phases Checklist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[
                {
                  phase: "Phase 0",
                  title: "Ready Rakho + System Map",
                  desc: "Facebook Developer Account, Meta Business Portfolio, dedicated clinic number, Google Calendar + Sheets, OpenAI API key."
                },
                {
                  phase: "Phase 1",
                  title: "Google Calendar + Sheet",
                  desc: "Clinic calendar with India Standard Time (GMT+05:30), CLINIC CLOSED holiday events, Sheet 'Bookings' with 9 plain-text columns."
                },
                {
                  phase: "Phase 2",
                  title: "Meta WhatsApp Cloud API Setup",
                  desc: "Meta App 'Clinic Bot', Permanent System User Access Token with whatsapp_business_messaging, recipient number validation."
                },
                {
                  phase: "Phase 3 & 4",
                  title: "AI Booking Agent & 7 Tools",
                  desc: "WhatsApp Trigger, Only Text Messages IF filter, Clean Data mapping, LangChain AI Agent with 7 tools, Send WhatsApp Reply."
                },
                {
                  phase: "Phase 5",
                  title: "Test & Troubleshooting",
                  desc: "Meta WABA subscribed_apps check, Phase 5 eight-step verification pass, emergency keyword redirection, double-booking prevention."
                },
                {
                  phase: "Phase 6 & 7",
                  title: "Auto Reminder & Daily Owner Report",
                  desc: "Approved utility template appointment_reminder, 15-min scheduler checking 30-75 min window, 8:00 PM owner daily email report."
                }
              ].map((p, idx) => (
                <div key={idx} className={`rounded-2xl border p-4.5 shadow-xl ${
                  isDarkMode ? 'bg-[#101726]/80 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center space-x-2 text-emerald-500 font-bold text-xs">
                    <span>{p.phase}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{p.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-4 text-center text-xs transition-colors relative z-10 ${
        isDarkMode ? 'bg-[#0b101c] border-slate-800/80 text-slate-500' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 {settings?.clinicName || 'Sunrise Clinic'} • Built for Production & Client Delivery</p>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>WhatsApp Cloud API</span>
            <span>•</span>
            <span>Google Calendar & Sheets</span>
            <span>•</span>
            <span>Vercel Hosted</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
