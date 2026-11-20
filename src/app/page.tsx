'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  MessageSquare,
  FileSpreadsheet,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle,
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
  CalendarCheck
} from 'lucide-react';
import { Appointment, ClinicSettings, ChatMessage, ToolExecutionRecord } from '@/lib/types';

export default function ClinicDashboard() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'sheet' | 'calendar' | 'reports' | 'guide'>('simulator');
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

  // Report state
  const [dailyReport, setDailyReport] = useState<string>('');
  const [reminderResult, setReminderResult] = useState<any>(null);

  // Load initial data
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
      if (setRes) setSettings(setRes);
      if (simRes.history) setMessages(simRes.history);
      if (simRes.toolLogs) setToolLogs(simRes.toolLogs);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isSimulating) return;

    setInputMessage('');
    setIsSimulating(true);

    // Optimistic UI for patient message
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'patient',
      text,
      timestamp: new Date().toISOString()
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
      const res = await fetch('/api/cron/daily-report');
      const data = await res.json();
      if (data.reportData) {
        setDailyReport(data.reportData.reportText);
      }
    } catch (err) {
      console.error('Report error:', err);
    }
  };

  const handleCancelAppointment = async (eventId: string) => {
    await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        updates: { Status: 'Cancelled' }
      })
    });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-rose-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight">
                  {settings?.clinicName || 'Sunrise Clinic'}
                </h1>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Live AI Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Doctor: <span className="font-medium text-slate-700">{settings?.doctorName || 'Dr. Mehta'}</span> | Timings: 10 AM - 6 PM IST
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunReminders}
              className="text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium shadow-sm transition"
              title="Runs 15-minute Auto-Reminder scan (Workflow 2)"
            >
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>Run Reminders</span>
            </button>
            <button
              onClick={handleRunDailyReport}
              className="text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium shadow-sm transition"
              title="Generate 8 PM Daily Summary (Workflow 3)"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>Owner Report</span>
            </button>
            <a
              href="#guide"
              onClick={() => setActiveTab('guide')}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium shadow-sm transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Guide</span>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'simulator', label: 'WhatsApp AI Simulator', icon: MessageSquare, badge: 'Phase 5' },
            { id: 'sheet', label: 'Google Sheets (Bookings Log)', icon: FileSpreadsheet, badge: '9 Columns' },
            { id: 'calendar', label: 'Calendar & Slots Grid', icon: Calendar, badge: '20-min' },
            { id: 'reports', label: 'Auto-Reminder & Reports', icon: Bell, badge: 'WF 2 & 3' },
            { id: 'guide', label: 'PDF Setup Guide (Phase 0-9)', icon: ShieldCheck, badge: 'Docs & JSON' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm transition whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                  isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* TAB 1: WHATSAPP AI SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Phone Mockup */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
                {/* Mock Phone Header */}
                <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-white border-2 border-emerald-400">
                        SC
                      </div>
                      <span className="w-3 h-3 bg-emerald-400 border-2 border-[#075e54] rounded-full absolute bottom-0 right-0"></span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm leading-tight">{settings?.clinicName}</h3>
                      <p className="text-xs text-emerald-200 flex items-center">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                        AI Receptionist (Online)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] bg-emerald-900/60 text-emerald-200 px-2 py-1 rounded">
                      Simulated: +{simPhone}
                    </span>
                    <button
                      onClick={handleResetChat}
                      className="p-1.5 rounded-lg hover:bg-emerald-800 text-emerald-100 transition"
                      title="Reset chat memory"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* WhatsApp Chat Body */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2] bg-opacity-70"
                  style={{
                    backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
                    backgroundSize: '16px 16px'
                  }}
                >
                  <div className="text-center my-2">
                    <span className="text-[11px] bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200 shadow-xs inline-block max-w-sm">
                      🔒 Messages are end-to-end simulated. AI Receptionist applies strict clinic rules & 7 tools.
                    </span>
                  </div>

                  {messages.length === 0 && (
                    <div className="text-center text-slate-500 py-10">
                      <p className="text-sm font-medium">No messages yet.</p>
                      <p className="text-xs mt-1">Try clicking one of the Phase 5 test scenarios below!</p>
                    </div>
                  )}

                  {messages.map((msg, idx) => {
                    const isPatient = msg.sender === 'patient';
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-xs ${
                            isPatient
                              ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-xs'
                              : 'bg-white text-slate-800 rounded-tl-xs border border-slate-100'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.text}</p>
                          <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-slate-400">
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isPatient && <span className="text-emerald-600 font-bold">✓✓</span>}
                          </div>
                        </div>
                        {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            {msg.toolsUsed.map((tool, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-[10px] bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded-full border border-indigo-200 flex items-center space-x-1"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-indigo-500 mr-1" />
                                {tool}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isSimulating && (
                    <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 w-32 shadow-xs">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></div>
                      <span className="text-xs text-slate-400 font-medium">Typing...</span>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div className="bg-[#f0f2f5] p-3 border-t border-slate-200 flex items-center space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type patient WhatsApp message (in Hindi or English)..."
                    className="flex-1 bg-white border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#075e54] focus:border-transparent"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isSimulating || !inputMessage.trim()}
                    className="bg-[#075e54] hover:bg-[#064e46] text-white p-2.5 rounded-full disabled:opacity-50 transition shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Phase 5 Test Suite & Tool Inspector */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              {/* Phase 5 Test Suite */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Phase 5: 1-Click Verification Script</span>
                  </h3>
                  <span className="text-xs text-slate-400">8 Tests from PDF</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Click each step to test the AI booking agent conversation flow as specified in page 12 of the setup guide:
                </p>

                <div className="mt-3 space-y-2">
                  {[
                    { num: 1, text: "Hi, mujhe kal doctor se appointment chahiye", label: "Step 1: Greeting + Consent", expected: "Greets + gives consent notice, asks name" },
                    { num: 2, text: "Rahul Sharma", label: "Step 2: Patient Full Name", expected: "Asks 1-line problem" },
                    { num: 3, text: "Daant me dard hai", label: "Step 3: Medical Problem", expected: "Calls get_day_events, presents 5 slots" },
                    { num: 4, text: "11:20 AM", label: "Step 4: Select Slot Time", expected: "Calls check_slot_available, books & logs" },
                    { num: 5, text: "Mujhe seene me dard hai aur saans nahi aa rahi", label: "Step 7: Emergency Safety", expected: "Blocks booking, urges immediate clinic call" },
                    { num: 6, text: "Meri appointment cancel kar do", label: "Step 8: Cancel Appointment", expected: "Deletes calendar event & marks Cancelled" },
                  ].map(test => (
                    <button
                      key={test.num}
                      onClick={() => handleSendMessage(test.text)}
                      disabled={isSimulating}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition group flex items-start space-x-2"
                    >
                      <span className="text-xs font-bold bg-slate-100 group-hover:bg-indigo-100 text-slate-700 group-hover:text-indigo-800 px-2 py-0.5 rounded-md mt-0.5">
                        #{test.num}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-slate-800 truncate">{test.label}</span>
                          <span className="text-[10px] text-indigo-600 font-semibold group-hover:underline">Send &gt;</span>
                        </div>
                        <p className="text-[11px] text-slate-500 italic truncate mt-0.5">"{test.text}"</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Tool Call Inspector */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Real-Time Tool Execution Log</span>
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
                    7 Tools Monitored
                  </span>
                </div>

                <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 max-h-56">
                  {toolLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                      No tool executions yet. Send a booking message to trigger tools!
                    </p>
                  ) : (
                    toolLogs.map((log, lIdx) => (
                      <div key={lIdx} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs font-mono">
                        <div className="flex items-center justify-between text-indigo-700 font-bold mb-1">
                          <span>{log.name}()</span>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 bg-white p-1.5 rounded border border-slate-100 overflow-x-auto">
                          <span className="text-slate-400 font-sans font-medium">Input: </span>
                          {JSON.stringify(log.params)}
                        </div>
                        <div className="text-[11px] text-emerald-800 bg-emerald-50/50 p-1.5 rounded border border-emerald-100 mt-1 overflow-x-auto">
                          <span className="text-slate-400 font-sans font-medium">Output: </span>
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-slate-900">Clinic Appointments Log (Sheet: Bookings)</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Row 1 Headers strictly match Phase 1.4: <span className="font-mono text-slate-700">Start_ISO | Date | Time | Patient_Name | Phone | Problem | Status | Event_ID | Reminder_Sent</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchData}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg flex items-center space-x-1 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Log</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-3 border-r border-slate-200">#</th>
                    <th className="p-3 border-r border-slate-200 font-mono">Start_ISO (Col A)</th>
                    <th className="p-3 border-r border-slate-200 font-mono">Date (Col B)</th>
                    <th className="p-3 border-r border-slate-200 font-mono">Time (Col C)</th>
                    <th className="p-3 border-r border-slate-200 font-mono">Patient_Name (Col D)</th>
                    <th className="p-3 border-r border-slate-200 font-mono">Phone (Col E)</th>
                    <th className="p-3 border-r border-slate-200 font-mono">Problem (Col F)</th>
                    <th className="p-3 border-r border-slate-200 font-mono">Status (Col G)</th>
                    <th className="p-3 border-r border-slate-200 font-mono">Event_ID (Col H)</th>
                    <th className="p-3 border-r border-slate-200 font-mono">Reminder_Sent (Col I)</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-6 text-center text-slate-400">
                        No appointments booked yet. Use the WhatsApp simulator to book!
                      </td>
                    </tr>
                  ) : (
                    appointments.map((apt, index) => (
                      <tr key={apt.id || index} className="hover:bg-slate-50/80 transition font-mono">
                        <td className="p-3 text-slate-400 border-r border-slate-100 font-sans">{index + 1}</td>
                        <td className="p-3 border-r border-slate-100 text-slate-700 whitespace-nowrap">{apt.Start_ISO}</td>
                        <td className="p-3 border-r border-slate-100 text-slate-700 whitespace-nowrap">{apt.Date}</td>
                        <td className="p-3 border-r border-slate-100 font-semibold text-slate-900 whitespace-nowrap">{apt.Time}</td>
                        <td className="p-3 border-r border-slate-100 font-sans font-medium text-slate-800 whitespace-nowrap">{apt.Patient_Name}</td>
                        <td className="p-3 border-r border-slate-100 text-slate-600 whitespace-nowrap">{apt.Phone}</td>
                        <td className="p-3 border-r border-slate-100 font-sans text-slate-600 max-w-xs truncate">{apt.Problem}</td>
                        <td className="p-3 border-r border-slate-100">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold ${
                              apt.Status === 'Booked'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : apt.Status === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {apt.Status}
                          </span>
                        </td>
                        <td className="p-3 border-r border-slate-100 text-indigo-600 font-semibold whitespace-nowrap">{apt.Event_ID}</td>
                        <td className="p-3 border-r border-slate-100 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-sans font-bold ${
                              apt.Reminder_Sent === 'Yes'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {apt.Reminder_Sent}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap font-sans">
                          {apt.Status === 'Booked' && (
                            <button
                              onClick={() => handleCancelAppointment(apt.Event_ID)}
                              className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-medium"
                            >
                              Cancel Slot
                            </button>
                          )}
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <CalendarCheck className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-bold text-slate-900">
                      {settings?.clinicName} Appointments Calendar
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Operating Hours: Mon-Sat, 10:00 AM - 6:00 PM IST | Slot Length: 20 mins | Lunch: 1:00 PM - 2:00 PM
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      handleToggleClosedDate(todayStr);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition ${
                      closedDates.includes(new Date().toISOString().split('T')[0])
                        ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {closedDates.includes(new Date().toISOString().split('T')[0])
                      ? '⚠️ CLINIC CLOSED (Active)'
                      : 'Mark Today CLINIC CLOSED (Phase 1.3)'}
                  </button>
                </div>
              </div>

              {/* Visual 20-min Slots Grid */}
              <div className="mt-6">
                <h3 className="font-semibold text-sm text-slate-800 mb-3 flex items-center justify-between">
                  <span>Today's 20-Minute Slots Timeline</span>
                  <div className="flex items-center space-x-3 text-xs font-normal">
                    <span className="flex items-center"><span className="w-3 h-3 rounded bg-emerald-500 mr-1"></span> Booked</span>
                    <span className="flex items-center"><span className="w-3 h-3 rounded bg-slate-200 mr-1"></span> Available</span>
                    <span className="flex items-center"><span className="w-3 h-3 rounded bg-amber-100 mr-1"></span> Lunch Break (1-2 PM)</span>
                  </div>
                </h3>

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

                    let bgColor = "bg-white border-slate-200 text-slate-800 hover:border-slate-300";
                    if (isLunch) bgColor = "bg-amber-50/60 border-amber-200 text-amber-800";
                    else if (bookedApt) bgColor = "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs";

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex flex-col justify-between text-xs min-h-[78px] transition ${bgColor}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{cleanTime}</span>
                          {bookedApt ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          ) : isLunch ? (
                            <span className="text-[10px] text-amber-600 font-semibold">Break</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Free</span>
                          )}
                        </div>
                        {bookedApt ? (
                          <div className="mt-1">
                            <p className="font-semibold text-slate-900 truncate">{bookedApt.Patient_Name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{bookedApt.Problem}</p>
                          </div>
                        ) : isLunch ? (
                          <p className="text-[10px] text-amber-700 italic">No bookings</p>
                        ) : (
                          <p className="text-[10px] text-slate-400">20 min slot</p>
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Workflow 2: Auto Reminder Engine</h3>
                    <p className="text-[11px] text-slate-500">15-minute cron scheduler (30-75 min window)</p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              <div className="mt-4 text-xs text-slate-600 space-y-2 flex-1">
                <p>
                  Scans Google Sheet Bookings for patients with <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">Status = Booked</span> and <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">Reminder_Sent = No</span>.
                </p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-1">Approved Template (English):</h4>
                  <p className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200">
                    Hello {"{{1}}"}, this is a reminder from {settings?.clinicName}. Your appointment is today at {"{{2}}"}. To reschedule or cancel, please reply to this message.
                  </p>
                </div>

                {reminderResult && (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900 mt-2">
                    <p className="font-bold flex items-center">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Scan executed successfully!
                    </p>
                    <p className="text-[11px] mt-1">
                      Processed: {reminderResult.processed} | Sent: {reminderResult.sentCount}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Endpoint: /api/cron/reminders</span>
                <button
                  onClick={handleRunReminders}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Execute 15-Min Scan Now</span>
                </button>
              </div>
            </div>

            {/* Daily Owner Report Card (Workflow 3) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Workflow 3: Daily Owner Report</h3>
                    <p className="text-[11px] text-slate-500">Scheduled daily at 8:00 PM IST</p>
                  </div>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              <div className="mt-4 flex-1 flex flex-col">
                <p className="text-xs text-slate-500 mb-2">
                  Summary email sent to owner: <span className="font-medium text-slate-800">{settings?.ownerEmail}</span>
                </p>

                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] flex-1 overflow-y-auto whitespace-pre-line min-h-[160px]">
                  {dailyReport || `Click "Generate & Send Report" below to preview the Phase 7.2 formatted daily summary.`}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Endpoint: /api/cron/daily-report</span>
                <button
                  onClick={handleRunDailyReport}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Generate & Send Report</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PDF GUIDE COMPANION & SETUP CHECKLIST */}
        {activeTab === 'guide' && (
          <div className="space-y-6" id="guide">
            {/* Guide Overview Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-indigo-300 font-bold">
                    Complete Implementation Manual
                  </span>
                  <h2 className="text-xl font-bold mt-1">Clinic WhatsApp Appointment Automation</h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    Following all 10 Phases of the ORVANTA Setup Guide (Prepared by Sachin Prajapati).
                    Contains AI Booking Agent with 7 tools, Meta Cloud API Webhook, 15-min Reminders, and Daily 8 PM Owner Report.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/workflows/1-clinic-ai-booking-agent.json"
                    download="1-clinic-ai-booking-agent.json"
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Workflow 1 JSON</span>
                  </a>
                  <a
                    href="/workflows/2-clinic-auto-reminder.json"
                    download="2-clinic-auto-reminder.json"
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Workflow 2 JSON</span>
                  </a>
                  <a
                    href="/workflows/3-clinic-daily-report.json"
                    download="3-clinic-daily-report.json"
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
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
                  items: [
                    "Facebook Developer Account & Meta Business Portfolio",
                    "WhatsApp Phone Number (Meta test or dedicated SIM)",
                    "Google Calendar & Google Sheets setup",
                    "OpenAI API Key (gpt-4o-mini tool calling)"
                  ]
                },
                {
                  phase: "Phase 1",
                  title: "Google Calendar + Sheet",
                  items: [
                    "Clinic Calendar created in Asia/Kolkata (+05:30) time",
                    "CLINIC CLOSED all-day event support for doctor leaves",
                    "Sheet 'Bookings' with exact 9 headers created",
                    "Columns A, B, C, E formatted as Plain Text"
                  ]
                },
                {
                  phase: "Phase 2",
                  title: "Meta WhatsApp Cloud API Setup",
                  items: [
                    "Meta Developer App 'Clinic Bot' created",
                    "WhatsApp Product added & recipient number verified",
                    "Permanent System User Access Token generated",
                    "App ID & App Secret noted"
                  ]
                },
                {
                  phase: "Phase 3 & 4",
                  title: "AI Booking Agent & 7 Tools",
                  items: [
                    "WhatsApp Trigger with Only Text Messages filter",
                    "Clean Data mapping (phone, name, text body)",
                    "AI Agent with exact Phase 4.5 System Prompt",
                    "All 7 Tools implemented & functioning"
                  ]
                },
                {
                  phase: "Phase 5",
                  title: "Test & Troubleshooting",
                  items: [
                    "Meta WABA subscribed_apps verified",
                    "Phase 5 test script executed with 8/8 pass",
                    "Emergency prompt safety validated",
                    "Conflict check & slot availability verified"
                  ]
                },
                {
                  phase: "Phase 6 & 7",
                  title: "Auto Reminder & Daily Owner Report",
                  items: [
                    "appointment_reminder template configured",
                    "15-minute scheduler checks 30-75 min window",
                    "Reminder_Sent set to Yes to prevent duplicate alerts",
                    "Daily 8 PM summary email sent to clinic owner"
                  ]
                }
              ].map((p, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs">
                    <span>{p.phase}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-900 text-sm font-semibold">{p.title}</span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                    {p.items.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start space-x-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Webhook Configuration for Meta */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-2">Meta WhatsApp Cloud API Webhook Details:</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">Callback URL (for your deployed Vercel URL):</label>
                  <code className="bg-slate-100 text-indigo-700 px-3 py-1.5 rounded-lg border border-slate-200 block font-mono">
                    https://&lt;your-vercel-domain&gt;.vercel.app/api/webhook/whatsapp
                  </code>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Verify Token:</label>
                  <code className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 block font-mono">
                    {settings?.metaVerifyToken || 'clinic_bot_secret_token_2026'}
                  </code>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Webhook Field Subscription:</label>
                  <span className="bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-200">
                    messages
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>Clinic WhatsApp Appointment Automation • Production Ready for Vercel • Based on ORVANTA Setup Guide</p>
      </footer>
    </div>
  );
}
