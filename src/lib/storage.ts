import { Appointment, ClinicSettings, ChatMessage, ToolExecutionRecord } from './types';

// Default initial settings matching the PDF guide
const defaultSettings: ClinicSettings = {
  clinicName: 'Sunrise Clinic',
  doctorName: 'Dr. Mehta',
  clinicPhone: '+91 98765 43210',
  ownerEmail: 'owner.sunriseclinic@gmail.com',
  slotDurationMinutes: 20,
  workStartTime: '10:00',
  workEndTime: '18:00',
  lunchStartTime: '13:00',
  lunchEndTime: '14:00',
  timezone: 'Asia/Kolkata',
  closedDays: [0], // Sunday
  openaiModel: 'gpt-4o-mini',
  metaVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'clinic_bot_secret_token_2026',
};

// Global in-memory storage (singleton across serverless invokes in same container)
class ClinicStore {
  private appointments: Appointment[] = [];
  private settings: ClinicSettings = { ...defaultSettings };
  private conversationHistory: Map<string, ChatMessage[]> = new Map();
  private toolLogs: ToolExecutionRecord[] = [];
  private clinicClosedDates: Set<string> = new Set(); // YYYY-MM-DD

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData() {
    // Current IST date
    const now = new Date();
    // Offset for IST (+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
    const yyyy = istNow.getFullYear();
    const mm = String(istNow.getMonth() + 1).padStart(2, '0');
    const dd = String(istNow.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const dateFormatted = `${dd}-${mm}-${yyyy}`;

    this.appointments = [
      {
        id: 'EVT-1001',
        Event_ID: 'EVT-1001',
        Start_ISO: `${todayStr}T10:20:00+05:30`,
        Date: dateFormatted,
        Time: '10:20 AM',
        Patient_Name: 'Amit Verma',
        Phone: '919811122233',
        Problem: 'Fever and cold since 2 days',
        Status: 'Booked',
        Reminder_Sent: 'Yes',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'EVT-1002',
        Event_ID: 'EVT-1002',
        Start_ISO: `${todayStr}T11:40:00+05:30`,
        Date: dateFormatted,
        Time: '11:40 AM',
        Patient_Name: 'Pooja Singh',
        Phone: '919822233344',
        Problem: 'Routine dental checkup',
        Status: 'Booked',
        Reminder_Sent: 'No',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'EVT-1003',
        Event_ID: 'EVT-1003',
        Start_ISO: `${todayStr}T12:20:00+05:30`,
        Date: dateFormatted,
        Time: '12:20 PM',
        Patient_Name: 'Vikram Joshi',
        Phone: '919833344455',
        Problem: 'Sprained wrist',
        Status: 'Cancelled',
        Reminder_Sent: 'No',
        createdAt: new Date().toISOString(),
      }
    ];
  }

  public getSettings(): ClinicSettings {
    return {
      ...this.settings,
      openaiApiKey: process.env.OPENAI_API_KEY || this.settings.openaiApiKey,
      metaAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || this.settings.metaAccessToken,
      metaPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || this.settings.metaPhoneNumberId,
      metaVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || this.settings.metaVerifyToken,
      metaWabaId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || this.settings.metaWabaId,
    };
  }

  public updateSettings(newSettings: Partial<ClinicSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }

  public getAppointments(): Appointment[] {
    return [...this.appointments];
  }

  public setAppointments(appointments: Appointment[]) {
    this.appointments = [...appointments];
  }

  public addAppointment(apt: Appointment): Appointment {
    this.appointments.unshift(apt);
    return apt;
  }

  public updateAppointment(eventId: string, updates: Partial<Appointment>): Appointment | null {
    const idx = this.appointments.findIndex(a => a.Event_ID === eventId || a.id === eventId);
    if (idx === -1) return null;
    this.appointments[idx] = { ...this.appointments[idx], ...updates };
    return this.appointments[idx];
  }

  public deleteAppointment(eventId: string): boolean {
    const initialLen = this.appointments.length;
    this.appointments = this.appointments.filter(a => a.Event_ID !== eventId && a.id !== eventId);
    return this.appointments.length < initialLen;
  }

  public findAppointmentsByPhone(phone: string): Appointment[] {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return this.appointments.filter(a => {
      const p = a.Phone.replace(/[^0-9]/g, '');
      return (p === cleanPhone || p.endsWith(cleanPhone) || cleanPhone.endsWith(p)) && a.Status === 'Booked';
    });
  }

  public getEventsForDay(dayStartISO: string, dayEndISO: string): Appointment[] {
    const dayStart = new Date(dayStartISO).getTime();
    const dayEnd = new Date(dayEndISO).getTime();

    return this.appointments.filter(a => {
      if (a.Status === 'Cancelled') return false;
      const aptTime = new Date(a.Start_ISO).getTime();
      return aptTime >= dayStart && aptTime <= dayEnd;
    });
  }

  public isClinicClosed(dateStrYYYYMMDD: string): boolean {
    return this.clinicClosedDates.has(dateStrYYYYMMDD);
  }

  public setClinicClosed(dateStrYYYYMMDD: string, closed: boolean) {
    if (closed) {
      this.clinicClosedDates.add(dateStrYYYYMMDD);
    } else {
      this.clinicClosedDates.delete(dateStrYYYYMMDD);
    }
  }

  public getClosedDates(): string[] {
    return Array.from(this.clinicClosedDates);
  }

  // Conversation history per patient phone number
  public getHistory(phone: string): ChatMessage[] {
    const clean = phone.replace(/[^0-9]/g, '');
    return this.conversationHistory.get(clean) || [];
  }

  public addMessage(phone: string, msg: ChatMessage) {
    const clean = phone.replace(/[^0-9]/g, '');
    const hist = this.conversationHistory.get(clean) || [];
    hist.push(msg);
    // Keep last 15 messages (context window)
    if (hist.length > 15) {
      hist.shift();
    }
    this.conversationHistory.set(clean, hist);
  }

  public clearHistory(phone: string) {
    const clean = phone.replace(/[^0-9]/g, '');
    this.conversationHistory.delete(clean);
  }

  // Tool audit logs
  public logToolExecution(name: string, params: Record<string, unknown>, result: unknown) {
    this.toolLogs.unshift({
      name,
      params,
      result,
      timestamp: new Date().toISOString()
    });
    if (this.toolLogs.length > 50) {
      this.toolLogs.pop();
    }
  }

  public getToolLogs(): ToolExecutionRecord[] {
    return [...this.toolLogs];
  }
}

// Global singleton for Next.js hot reload safety
const globalForStore = global as unknown as { clinicStore: ClinicStore };
export const clinicStore = globalForStore.clinicStore || new ClinicStore();
if (process.env.NODE_ENV !== 'production') globalForStore.clinicStore = clinicStore;
