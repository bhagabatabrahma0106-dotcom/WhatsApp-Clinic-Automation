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
  ArrowUpRight
} from 'lucide-react';
import { Appointment, ClinicSettings, ChatMessage, ToolExecutionRecord, Doctor } from '@/lib/types';

export default function ClinicApp() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'sheet' | 'calendar' | 'reports' | 'client-demo' | 'branding' | 'guide'>('simulator');
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
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Booked' | 'Cancelled' | 'Completed'>('All');

  // Report state
  const [dailyReport, setDailyReport] = useState<string>('');
  const [reminderResult, setReminderResult] = useState<any>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

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
      if (data.appointments) setAppointments(data.appointments);
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
      setEmailStatus('Generating and sending...');
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
    link.setAttribute('download', `Clinic_Bookings_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations for executive stats
  const activeBookings = appointments.filter(a => a.Status === 'Booked' || a.Status === 'Completed');
  const cancelledBookings = appointments.filter(a => a.Status === 'Cancelled');
  const totalRevenue = activeBookings.reduce((sum, a) => sum + (a.fee || settings?.consultationFee || 500), 0);
  const remindersSentCount = appointments.filter(a => a.Reminder_Sent === 'Yes').length;

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
    <div className="min-h-screen bg-[#0d131f] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Client Navbar */}
      <header className="bg-[#111927]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 ring-2 ring-teal-400/30">
                <Stethoscope className="w-6 h-6 animate-pulse-subtle" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-[#111927] rounded-full animate-ping"></span>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#111927] rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="font-extrabold text-xl text-white tracking-tight flex items-center">
                  {settings?.clinicName || 'Sunrise Multi-Speciality Clinic'}
                </h1>
                <span className="text-[11px] bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                  Client Ready v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                <span className="text-teal-400 font-medium">{settings?.doctorName || 'Dr. Mehta'}</span>
                <span>•</span>
                <span>{settings?.doctorSpecialty || 'Dental Surgeon'}</span>
                <span>•</span>
                <span className="text-slate-400">10:00 AM - 6:00 PM IST</span>
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setActiveTab('client-demo')}
              className="text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl flex items-center space-x-1.5 font-semibold transition shadow-md"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>5-Min Owner Demo</span>
            </button>
            <button
              onClick={handleRunReminders}
              className="text-xs bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl flex items-center space-x-1.5 font-medium transition shadow-xs"
              title="Execute 15-minute Auto-Reminder (Workflow 2)"
            >
              <Bell className="w-3.5 h-3.5 text-teal-400" />
              <span>Trigger Reminders</span>
            </button>
            <button
              onClick={handleRunDailyReport}
              className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-2 rounded-xl flex items-center space-x-1.5 font-semibold transition shadow-md shadow-teal-600/30"
              title="Generate & Send 8 PM Executive Daily Report"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>8 PM Report</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 border-t border-slate-800/60 overflow-x-auto">
          {[
            { id: 'simulator', label: 'WhatsApp AI Simulator', icon: MessageSquare, badge: 'Live Bot' },
            { id: 'sheet', label: 'Google Sheets (Bookings Log)', icon: FileSpreadsheet, badge: `${appointments.length} Rows` },
            { id: 'calendar', label: 'Calendar & 20-Min Slots', icon: Calendar, badge: 'IST Schedule' },
            { id: 'reports', label: 'Auto-Reminders & 8 PM Report', icon: Bell, badge: 'Cron Tasks' },
            { id: 'client-demo', label: 'Client Pitch & ROI Calculator', icon: TrendingUp, badge: 'Phase 9' },
            { id: 'branding', label: 'Clinic Customizer & Settings', icon: Sliders, badge: 'Rebrand' },
            { id: 'guide', label: 'PDF Guide & n8n Workflows', icon: ShieldCheck, badge: 'Setup Manual' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-teal-400 text-teal-300 bg-teal-950/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Executive Metric Cards (Client Value Dashboard) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#151f32] border border-slate-800 rounded-2xl p-4.5 shadow-lg relative overflow-hidden group hover:border-teal-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Bookings</span>
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">{activeBookings.length}</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +100% Automated
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{cancelledBookings.length} cancelled • 0 double-bookings</p>
          </div>

          <div className="bg-[#151f32] border border-slate-800 rounded-2xl p-4.5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Consultation Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">₹{totalRevenue.toLocaleString('en-IN')}</span>
              <span className="text-xs text-slate-400">calculated</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Based on ₹{settings?.consultationFee || 500} avg doctor fee</p>
          </div>

          <div className="bg-[#151f32] border border-slate-800 rounded-2xl p-4.5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No-Show Prevention</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">94.8%</span>
              <span className="text-xs font-bold text-amber-400">Attendance</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">15-min WhatsApp templates (Workflow 2)</p>
          </div>

          <div className="bg-[#151f32] border border-slate-800 rounded-2xl p-4.5 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receptionist Hours Saved</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">2.5 Hrs</span>
              <span className="text-xs text-indigo-400">per doctor / day</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Instant replies 24/7 without staff burnout</p>
          </div>
        </div>
      </section>

      {/* Main Workspace Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* TAB 1: WHATSAPP AI SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Phone Mockup Window */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="bg-[#111b21] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[740px] ring-1 ring-slate-800">
                {/* Authentic WhatsApp Top Bar */}
                <div className="bg-[#202c33] text-white px-4 py-3 flex items-center justify-between border-b border-[#2a3942]">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center font-bold text-white shadow-md">
                        {settings?.doctorName?.slice(0, 2) || 'SC'}
                      </div>
                      <span className="w-3 h-3 bg-emerald-400 border-2 border-[#202c33] rounded-full absolute bottom-0 right-0"></span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm leading-snug flex items-center">
                        {settings?.clinicName || 'Sunrise Clinic'}
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 ml-1.5 inline" />
                      </h3>
                      <p className="text-[11px] text-emerald-400 flex items-center">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                        AI Medical Receptionist (Online)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="bg-[#111b21] border border-[#2a3942] rounded-lg px-2.5 py-1 text-[11px] text-slate-300 font-mono">
                      +{simPhone}
                    </div>
                    <button
                      onClick={handleResetChat}
                      className="p-1.5 rounded-lg bg-[#2a3942] hover:bg-[#374248] text-slate-300 transition"
                      title="Clear chat context memory"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* WhatsApp Chat Canvas */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#0b141a]"
                  style={{
                    backgroundImage: `radial-gradient(#202c33 1px, transparent 1px)`,
                    backgroundSize: '18px 18px'
                  }}
                >
                  <div className="text-center my-1">
                    <span className="text-[10px] bg-[#182229] text-amber-300/90 px-3.5 py-1 rounded-full border border-amber-500/20 shadow-xs inline-block max-w-md">
                      🔒 End-to-end encrypted • AI operates under strict clinic rules, zero medical advice & emergency redirects.
                    </span>
                  </div>

                  {messages.length === 0 && (
                    <div className="text-center text-slate-500 py-16">
                      <MessageSquare className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                      <p className="text-sm font-medium text-slate-300">WhatsApp Simulator Ready</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click any test step from the right panel to test live booking!
                      </p>
                    </div>
                  )}

                  {messages.map((msg, idx) => {
                    const isPatient = msg.sender === 'patient';
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'} transition-all`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-md ${
                            isPatient
                              ? 'bg-[#005c4b] text-white rounded-tr-xs'
                              : 'bg-[#202c33] text-slate-100 rounded-tl-xs border border-[#2a3942]'
                          }`}
                        >
                          {msg.isVoiceNote ? (
                            <div className="flex items-center space-x-3 py-1">
                              <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white">
                                <Volume2 className="w-4 h-4" />
                              </div>
                              <div className="flex items-center space-x-1">
                                {[12, 24, 18, 30, 16, 26, 14, 20, 28, 15].map((h, bIdx) => (
                                  <div
                                    key={bIdx}
                                    className="w-1 bg-emerald-400 rounded-full"
                                    style={{ height: `${h}px` }}
                                  ></div>
                                ))}
                              </div>
                              <span className="text-[11px] text-slate-300 font-mono">{msg.audioDuration || '0:07'}</span>
                            </div>
                          ) : (
                            <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                          )}

                          <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-slate-400">
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isPatient && <span className="text-teal-400 font-bold ml-1">✓✓</span>}
                          </div>
                        </div>

                        {/* Tool Execution Tagging */}
                        {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {msg.toolsUsed.map((tool, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-[10px] bg-teal-950/60 text-teal-300 font-mono px-2.5 py-0.5 rounded-full border border-teal-500/30 flex items-center shadow-xs"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-teal-400 mr-1" />
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
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]"></div>
                      <span className="text-xs text-slate-300 font-medium">AI thinking...</span>
                    </div>
                  )}
                </div>

                {/* WhatsApp Chat Input Controls */}
                <div className="bg-[#202c33] p-3 border-t border-[#2a3942] flex items-center space-x-2">
                  <button
                    onClick={() => handleSendMessage("Audio note: Mujhe emergency appointment chahiye", true)}
                    className="p-2.5 text-slate-400 hover:text-teal-400 hover:bg-[#2a3942] rounded-full transition"
                    title="Simulate Voice Note (Phase 9.1 non-text rule)"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type patient message (Hinglish, Hindi, or English)..."
                    className="flex-1 bg-[#2a3942] text-white placeholder-slate-400 border border-transparent rounded-full px-4 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:border-teal-400"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isSimulating || !inputMessage.trim()}
                    className="bg-[#00a884] hover:bg-[#008f70] text-white p-2.5 rounded-full disabled:opacity-40 transition shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Phase 5 Test Suite & Live Tool Inspector */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              {/* Phase 5 Test Script */}
              <div className="bg-[#151f32] rounded-2xl border border-slate-800 p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-teal-400" />
                    <span>Phase 5: 1-Click Verification Tests</span>
                  </h3>
                  <span className="text-[11px] bg-teal-950/60 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-mono">
                    8 PDF Scenarios
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Click any test case to run the exact dialogue flow from page 12 of the setup guide:
                </p>

                <div className="mt-3.5 space-y-2">
                  {[
                    { num: 1, text: "Hi, mujhe kal doctor se appointment chahiye", label: "Step 1: Greeting + Consent", expected: "Consent line + asks name" },
                    { num: 2, text: "Rahul Sharma", label: "Step 2: Patient Full Name", expected: "Asks 1-line problem" },
                    { num: 3, text: "Daant me dard hai", label: "Step 3: Medical Problem", expected: "Calls get_day_events, presents slots" },
                    { num: 4, text: "11:20 AM", label: "Step 4: Select Slot Time", expected: "Calls check_slot_available, books & logs" },
                    { num: 5, text: "Mujhe seene me dard hai aur saans nahi aa rahi", label: "Step 7: Emergency Rule", expected: "Halts booking, provides emergency hotline" },
                    { num: 6, text: "Meri appointment cancel kar do", label: "Step 8: Cancel Appointment", expected: "Calls find_my_booking, deletes & updates Sheet" },
                  ].map(test => (
                    <button
                      key={test.num}
                      onClick={() => handleSendMessage(test.text)}
                      disabled={isSimulating}
                      className="w-full text-left p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-500 hover:bg-teal-950/20 transition-all group flex items-start space-x-2.5"
                    >
                      <span className="text-xs font-bold bg-slate-800 text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-900 px-2 py-0.5 rounded-md mt-0.5 transition">
                        #{test.num}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-200 group-hover:text-teal-300 truncate">
                            {test.label}
                          </span>
                          <span className="text-[10px] text-teal-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                            Send &gt;
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic truncate mt-0.5">"{test.text}"</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Tool Call Inspector */}
              <div className="bg-[#151f32] rounded-2xl border border-slate-800 p-5 shadow-xl flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>Real-Time Tool Execution Log</span>
                  </h3>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                    7 Tools Monitored
                  </span>
                </div>

                <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-56">
                  {toolLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-8">
                      No tool executions logged yet. Send a booking message in chat!
                    </p>
                  ) : (
                    toolLogs.map((log, lIdx) => (
                      <div key={lIdx} className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs font-mono">
                        <div className="flex items-center justify-between text-teal-400 font-bold mb-1.5">
                          <span className="flex items-center">
                            <CheckCircle className="w-3 h-3 text-teal-400 mr-1.5" />
                            {log.name}()
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 bg-[#0d131f] p-2 rounded-lg border border-slate-800 overflow-x-auto">
                          <span className="text-slate-400 font-sans font-medium">Args: </span>
                          {JSON.stringify(log.params)}
                        </div>
                        <div className="text-[11px] text-emerald-300 bg-emerald-950/20 p-2 rounded-lg border border-emerald-900/40 mt-1.5 overflow-x-auto">
                          <span className="text-emerald-500 font-sans font-medium">Result: </span>
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

        {/* TAB 2: GOOGLE SHEETS LIVE VIEW */}
        {activeTab === 'sheet' && (
          <div className="bg-[#151f32] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Google Sheet: Clinic Appointments Log (Tab: Bookings)</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Headers strictly match Phase 1.4: <span className="font-mono text-teal-300">Start_ISO | Date | Time | Patient_Name | Phone | Problem | Status | Event_ID | Reminder_Sent</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search patient, phone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-400"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-hidden focus:border-teal-400"
                >
                  <option value="All">All Statuses</option>
                  <option value="Booked">Booked</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
                <button
                  onClick={exportCSV}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={fetchData}
                  className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-medium px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Sheet</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                    <th className="p-3.5 border-r border-slate-800">#</th>
                    <th className="p-3.5 border-r border-slate-800 font-mono">Start_ISO (Col A)</th>
                    <th className="p-3.5 border-r border-slate-800 font-mono">Date (Col B)</th>
                    <th className="p-3.5 border-r border-slate-800 font-mono">Time (Col C)</th>
                    <th className="p-3.5 border-r border-slate-800 font-mono">Patient_Name (Col D)</th>
                    <th className="p-3.5 border-r border-slate-800 font-mono">Phone (Col E)</th>
                    <th className="p-3.5 border-r border-slate-800 font-mono">Problem (Col F)</th>
                    <th className="p-3.5 border-r border-slate-800 font-mono">Status (Col G)</th>
                    <th className="p-3.5 border-r border-slate-800 font-mono">Event_ID (Col H)</th>
                    <th className="p-3.5 border-r border-slate-800 font-mono">Reminder_Sent (Col I)</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-500 font-sans">
                        No appointments found matching your search. Book an appointment in the simulator!
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt, index) => (
                      <tr key={apt.id || index} className="hover:bg-slate-900/60 transition">
                        <td className="p-3.5 text-slate-500 border-r border-slate-800 font-sans">{index + 1}</td>
                        <td className="p-3.5 border-r border-slate-800 text-slate-300 whitespace-nowrap">{apt.Start_ISO}</td>
                        <td className="p-3.5 border-r border-slate-800 text-slate-300 whitespace-nowrap">{apt.Date}</td>
                        <td className="p-3.5 border-r border-slate-800 font-bold text-teal-300 whitespace-nowrap">{apt.Time}</td>
                        <td className="p-3.5 border-r border-slate-800 font-sans font-medium text-white whitespace-nowrap">{apt.Patient_Name}</td>
                        <td className="p-3.5 border-r border-slate-800 text-slate-400 whitespace-nowrap">{apt.Phone}</td>
                        <td className="p-3.5 border-r border-slate-800 font-sans text-slate-300 max-w-xs truncate">{apt.Problem}</td>
                        <td className="p-3.5 border-r border-slate-800 font-sans">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              apt.Status === 'Booked'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : apt.Status === 'Cancelled'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {apt.Status}
                          </span>
                        </td>
                        <td className="p-3.5 border-r border-slate-800 text-indigo-400 font-semibold whitespace-nowrap">{apt.Event_ID}</td>
                        <td className="p-3.5 border-r border-slate-800 text-center font-sans">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              apt.Reminder_Sent === 'Yes'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
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
                                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                                  title="Mark Completed"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleUpdateAppointmentStatus(apt.Event_ID, 'Cancelled')}
                                  className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                                  title="Cancel Slot"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {apt.Status === 'Cancelled' && (
                              <button
                                onClick={() => handleUpdateAppointmentStatus(apt.Event_ID, 'Booked')}
                                className="text-xs text-teal-400 hover:text-teal-300 font-medium"
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
          <div className="space-y-6">
            <div className="bg-[#151f32] rounded-2xl border border-slate-800 p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      {settings?.clinicName} Live Slot Calendar
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Operating Hours: Mon-Sat, 10:00 AM - 6:00 PM IST | Slot Duration: {settings?.slotDurationMinutes || 20} mins | Lunch Break: 1:00 PM - 2:00 PM
                  </p>
                </div>
                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      handleToggleClosedDate(todayStr);
                    }}
                    className={`text-xs px-4 py-2 rounded-xl font-semibold border transition shadow-sm ${
                      closedDates.includes(new Date().toISOString().split('T')[0])
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {closedDates.includes(new Date().toISOString().split('T')[0])
                      ? '⚠️ CLINIC CLOSED (Holiday Active)'
                      : 'Mark Today CLINIC CLOSED (Phase 1.3)'}
                  </button>
                </div>
              </div>

              {/* 20-min Slot Timeline */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-white">Today's 20-Minute Slots Grid</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 font-normal">
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-emerald-500 mr-1.5"></span> Booked</span>
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-slate-700 mr-1.5"></span> Available</span>
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-amber-500/40 mr-1.5"></span> Lunch (1-2 PM)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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

                    let cardClass = "bg-slate-900/60 border-slate-800 text-slate-200 hover:border-slate-700";
                    if (isLunch) cardClass = "bg-amber-950/20 border-amber-900/40 text-amber-400";
                    else if (bookedApt) cardClass = "bg-emerald-950/30 border-emerald-500/40 text-emerald-300 shadow-md";

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between text-xs min-h-[82px] transition ${cardClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{cleanTime}</span>
                          {bookedApt ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          ) : isLunch ? (
                            <span className="text-[10px] text-amber-400 font-semibold">Break</span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Free</span>
                          )}
                        </div>
                        {bookedApt ? (
                          <div className="mt-1">
                            <p className="font-semibold text-white truncate">{bookedApt.Patient_Name}</p>
                            <p className="text-[10px] text-emerald-400/80 truncate">{bookedApt.Problem}</p>
                          </div>
                        ) : isLunch ? (
                          <p className="text-[10px] text-amber-500/70 italic">Lunch pause</p>
                        ) : (
                          <p className="text-[10px] text-slate-500">Available</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto Reminder Card (Workflow 2) */}
            <div className="bg-[#151f32] rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Workflow 2: Auto Reminder Engine</h3>
                    <p className="text-[11px] text-slate-400">15-minute scheduler (30-75 min window)</p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Active
                </span>
              </div>

              <div className="mt-4 text-xs text-slate-300 space-y-3 flex-1">
                <p>
                  Scans Google Sheet Bookings for patients with <span className="font-mono bg-slate-900 text-teal-300 px-1.5 py-0.5 rounded border border-slate-800">Status = Booked</span> and <span className="font-mono bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded border border-slate-800">Reminder_Sent = No</span>.
                </p>

                {/* WhatsApp Template Card Preview */}
                <div className="bg-[#0b141a] p-4 rounded-xl border border-slate-800 shadow-inner">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400">
                    Approved WhatsApp Template: appointment_reminder
                  </span>
                  <div className="bg-[#202c33] p-3 rounded-lg border border-[#2a3942] text-xs text-slate-200 mt-2 space-y-1">
                    <p className="font-semibold text-white">
                      Hello Rahul Sharma, this is a reminder from {settings?.clinicName}.
                    </p>
                    <p className="text-slate-300">
                      Your appointment is today at 11:20 AM with {settings?.doctorName}. To reschedule or cancel, please reply to this message.
                    </p>
                  </div>
                </div>

                {reminderResult && (
                  <div className="bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-500/30 text-emerald-300 mt-2">
                    <p className="font-bold flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                      15-Min Scheduler Executed!
                    </p>
                    <p className="text-[11px] mt-1 text-slate-300">
                      Checked: {reminderResult.processed} bookings | Reminders sent: {reminderResult.sentCount}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">Endpoint: /api/cron/reminders</span>
                <button
                  onClick={handleRunReminders}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition shadow-lg shadow-amber-600/20"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Execute 15-Min Scan Now</span>
                </button>
              </div>
            </div>

            {/* Daily Owner Report Card (Workflow 3) */}
            <div className="bg-[#151f32] rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Workflow 3: Daily Owner Report</h3>
                    <p className="text-[11px] text-slate-400">Scheduled daily at 8:00 PM IST</p>
                  </div>
                </div>
                <span className="text-xs bg-teal-500/10 text-teal-400 font-semibold px-2.5 py-0.5 rounded-full border border-teal-500/30">
                  Ready
                </span>
              </div>

              <div className="mt-4 flex-1 flex flex-col">
                <p className="text-xs text-slate-400 mb-2.5">
                  Automated email dispatched to clinic owner: <span className="font-medium text-teal-300">{settings?.ownerEmail}</span>
                </p>

                <div className="bg-[#0b141a] text-slate-200 p-4 rounded-xl font-mono text-[11px] flex-1 overflow-y-auto whitespace-pre-line min-h-[180px] border border-slate-800 leading-relaxed shadow-inner">
                  {dailyReport || `Click "Generate & Send Report" below to preview the Phase 7.2 formatted summary.`}
                </div>

                {emailStatus && (
                  <p className="text-[11px] text-emerald-400 font-medium mt-2 flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    {emailStatus}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">Endpoint: /api/cron/daily-report</span>
                <button
                  onClick={handleRunDailyReport}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition shadow-lg shadow-teal-600/20"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Generate & Send Report</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CLIENT PRESENTATION & 5-MIN DEMO SUITE */}
        {activeTab === 'client-demo' && (
          <div className="space-y-6">
            {/* 5-Minute Live Pitch Card (Phase 9.2) */}
            <div className="bg-gradient-to-tr from-[#151f32] to-[#1a2844] rounded-3xl border border-slate-700/60 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400 bg-teal-950/60 border border-teal-500/30 px-3 py-1 rounded-full">
                      Phase 9.2: Clinic Owner 5-Minute Demo
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white">How to Win the Clinic Owner in 5 Minutes</h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Follow the exact 5-step demonstration script from the setup guide. Clinic owners immediately appreciate the automated daily email report and zero no-show reminders.
                  </p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700 space-y-3 min-w-[280px]">
                  <h4 className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Doctor Outreach Template</span>
                    <button
                      onClick={copyPitchText}
                      className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold flex items-center space-x-1"
                    >
                      {copiedPitch ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPitch ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </h4>
                  <p className="text-[11px] text-slate-300 italic bg-[#0b141a] p-3 rounded-xl border border-slate-800 leading-relaxed">
                    "Namaste Dr. {settings?.doctorName || '<Name>'}, main clinics ke liye WhatsApp appointment automation banata hoon. Patient WhatsApp par message kare to system khud naam, problem aur date puchkar Google Calendar me slot book kar deta hai, reminder bhejta hai aur aapko roz report deta hai. Kya main 5 minute ka live demo dikha sakta hoon? Koi cost nahi."
                  </p>
                </div>
              </div>

              {/* 5 Demo Steps */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-8">
                {[
                  { step: "1", title: "Setup Demo Data", desc: "Have 2-3 sample booked slots on clinic calendar" },
                  { step: "2", title: "Live Patient Message", desc: "Message test number in front of owner to book a slot" },
                  { step: "3", title: "Show Calendar Event", desc: "Open Google Calendar on your phone to show instant event" },
                  { step: "4", title: "Show Google Sheet", desc: "Show 9-column log with Status = Booked" },
                  { step: "5", title: "Sample Daily Email", desc: "Show 8 PM summary email — owners love this most!" },
                ].map((s, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                    <span className="text-xs font-extrabold bg-teal-500/20 text-teal-300 px-2.5 py-1 rounded-lg">
                      Step {s.step}
                    </span>
                    <h4 className="font-bold text-xs text-white mt-2.5">{s.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Pricing Worksheet & ROI Calculator (Phase 9.3) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-[#151f32] rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Phase 9.3: Clinic Quote Calculator</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Standard Market Rates</span>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">One-Time Setup Fee (₹):</label>
                    <input
                      type="number"
                      value={quoteSetupFee}
                      onChange={e => setQuoteSetupFee(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Guide recommendation: ₹20,000 to ₹25,000</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Monthly Maintenance Fee (₹/month):</label>
                    <input
                      type="number"
                      value={quoteMonthlyFee}
                      onChange={e => setQuoteMonthlyFee(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Includes token/template monitoring, prompt changes</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Estimated Daily Patient Volume:</label>
                    <input
                      type="number"
                      value={quotePatientsPerDay}
                      onChange={e => setQuotePatientsPerDay(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Client Handover Checklist (Phase 9.4) */}
              <div className="lg:col-span-6 bg-[#151f32] rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span>Phase 9.4: Client Handover Checklist</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Delivery Gates</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {[
                    { key: "accounts", label: "Meta, Google, OpenAI accounts registered under clinic ownership" },
                    { key: "workflows", label: "Workflow JSON backups shared with clinic owner" },
                    { key: "receptionist", label: "Receptionist given 15-min training (when to take over manually)" },
                    { key: "emergency", label: "Emergency flow and support contact written down" },
                    { key: "privacy", label: "Privacy Policy live and consent line verified in bot greeting" },
                    { key: "terms", label: "Monthly maintenance scope and payment terms signed" },
                  ].map(item => (
                    <label
                      key={item.key}
                      onClick={() => setHandoverChecks(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={handoverChecks[item.key] || false}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-teal-500 focus:ring-0 bg-slate-800 border-slate-700"
                      />
                      <span className={`text-xs ${handoverChecks[item.key] ? 'text-teal-300 font-medium' : 'text-slate-400'}`}>
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
          <div className="bg-[#151f32] rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-5 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-teal-400" />
                  <span>Clinic Customizer & Rebranding Suite</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Change these details to instantly adapt the AI receptionist and reports to your specific client.
                </p>
              </div>
              {saveSuccess && (
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-semibold flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1" /> Saved Live!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveBranding} className="mt-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">Clinic Name:</label>
                  <input
                    type="text"
                    value={editForm.clinicName || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, clinicName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">Primary Doctor Name:</label>
                  <input
                    type="text"
                    value={editForm.doctorName || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, doctorName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">Doctor Specialty:</label>
                  <input
                    type="text"
                    value={editForm.doctorSpecialty || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, doctorSpecialty: e.target.value }))}
                    placeholder="e.g. Dental Surgeon"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">Consultation Fee (₹):</label>
                  <input
                    type="number"
                    value={editForm.consultationFee || 500}
                    onChange={e => setEditForm(prev => ({ ...prev, consultationFee: Number(e.target.value) }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">Slot Length (Minutes):</label>
                  <select
                    value={editForm.slotDurationMinutes || 20}
                    onChange={e => setEditForm(prev => ({ ...prev, slotDurationMinutes: Number(e.target.value) }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-teal-400"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes (Recommended)</option>
                    <option value={30}>30 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">Clinic Phone (Emergency hotline):</label>
                  <input
                    type="text"
                    value={editForm.clinicPhone || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, clinicPhone: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">Owner Report Email:</label>
                  <input
                    type="email"
                    value={editForm.ownerEmail || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, ownerEmail: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-teal-600/30 flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Clinic Configuration</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 7: PDF GUIDE & N8N WORKFLOWS */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-teal-950 via-[#151f32] to-[#111927] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-500/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-teal-400 font-extrabold">
                    ORVANTA PRACTICAL SETUP GUIDE
                  </span>
                  <h2 className="text-2xl font-black mt-1">Clinic WhatsApp Appointment Automation</h2>
                  <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
                    Zero-theory manual prepared by Sachin Prajapati. Everything is implemented and packaged: 3 core workflows, 7 AI tools, 10 phases, and complete copy-paste JSON configurations.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <a
                    href="/workflows/1-clinic-ai-booking-agent.json"
                    download="1-clinic-ai-booking-agent.json"
                    className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition shadow-md shadow-teal-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Workflow 1 JSON</span>
                  </a>
                  <a
                    href="/workflows/2-clinic-auto-reminder.json"
                    download="2-clinic-auto-reminder.json"
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Workflow 2 JSON</span>
                  </a>
                  <a
                    href="/workflows/3-clinic-daily-report.json"
                    download="3-clinic-daily-report.json"
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Workflow 3 JSON</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Phases Checklist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div key={idx} className="bg-[#151f32] rounded-2xl border border-slate-800 p-5 shadow-sm">
                  <div className="flex items-center space-x-2 text-teal-400 font-extrabold text-xs">
                    <span>{p.phase}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-white text-sm font-bold">{p.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#111927] border-t border-slate-800/80 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 {settings?.clinicName || 'Sunrise Clinic'} • Built for Production & Client Delivery</p>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Powered by WhatsApp Cloud API</span>
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
