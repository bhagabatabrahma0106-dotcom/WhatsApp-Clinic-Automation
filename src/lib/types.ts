export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  experience: string;
  fee: number;
  available: boolean;
}

export interface Appointment {
  id: string; // Event_ID
  Start_ISO: string; // e.g., 2026-11-20T11:20:00+05:30
  Date: string; // DD-MM-YYYY
  Time: string; // hh:mm a
  Patient_Name: string;
  Phone: string;
  Problem: string;
  Doctor_Name?: string;
  Status: 'Booked' | 'Cancelled' | 'Completed';
  Event_ID: string;
  Reminder_Sent: 'Yes' | 'No';
  createdAt?: string;
  fee?: number;
}

export interface ClinicSettings {
  clinicName: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorQualification: string;
  consultationFee: number;
  clinicPhone: string;
  emergencyPhone: string;
  clinicAddress: string;
  ownerEmail: string;
  slotDurationMinutes: number; // 15, 20, 30
  workStartTime: string; // '10:00'
  workEndTime: string; // '18:00'
  lunchStartTime: string; // '13:00'
  lunchEndTime: string; // '14:00'
  timezone: string; // 'Asia/Kolkata'
  closedDays: number[]; // 0 for Sunday
  languageMode: 'Hinglish' | 'Hindi' | 'English';
  openaiApiKey?: string;
  openaiModel?: string;
  metaPhoneNumberId?: string;
  metaAccessToken?: string;
  metaVerifyToken?: string;
  metaWabaId?: string;
  googleCalendarId?: string;
  googleSheetId?: string;
  doctors?: Doctor[];
}

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  toolsUsed?: string[];
  isVoiceNote?: boolean;
  audioDuration?: string;
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
  totalRevenue: number;
  todayBooked: Appointment[];
  todayCancelled: Appointment[];
  tomorrowUpcoming: Appointment[];
}
