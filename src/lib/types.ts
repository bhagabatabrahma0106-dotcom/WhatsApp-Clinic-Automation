export interface Appointment {
  id: string; // Event_ID
  Start_ISO: string; // e.g., 2026-11-20T11:20:00+05:30
  Date: string; // DD-MM-YYYY
  Time: string; // hh:mm a
  Patient_Name: string;
  Phone: string;
  Problem: string;
  Status: 'Booked' | 'Cancelled' | 'Completed';
  Event_ID: string;
  Reminder_Sent: 'Yes' | 'No';
  createdAt?: string;
}

export interface ClinicSettings {
  clinicName: string;
  doctorName: string;
  clinicPhone: string;
  ownerEmail: string;
  slotDurationMinutes: number; // 20
  workStartTime: string; // '10:00'
  workEndTime: string; // '18:00'
  lunchStartTime: string; // '13:00'
  lunchEndTime: string; // '14:00'
  timezone: string; // 'Asia/Kolkata'
  closedDays: number[]; // 0 for Sunday
  openaiApiKey?: string;
  openaiModel?: string;
  metaPhoneNumberId?: string;
  metaAccessToken?: string;
  metaVerifyToken?: string;
  metaWabaId?: string;
  googleCalendarId?: string;
  googleSheetId?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  toolsUsed?: string[];
}

export interface ToolExecutionRecord {
  name: string;
  params: Record<string, unknown>;
  result: unknown;
  timestamp: string;
}

export interface DailyReportData {
  reportText: string;
  dateStr: string;
  bookedCount: number;
  cancelledCount: number;
  upcomingCount: number;
  todayBooked: Appointment[];
  todayCancelled: Appointment[];
  tomorrowUpcoming: Appointment[];
}
