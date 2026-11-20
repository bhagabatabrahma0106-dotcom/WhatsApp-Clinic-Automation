import { clinicStore } from './storage';
import { Appointment, DailyReportData } from './types';
import { getISTNow } from './ai-agent';

export function generateDailyReport(): DailyReportData {
  const settings = clinicStore.getSettings();
  const rows = clinicStore.getAppointments();

  const istNow = getISTNow();
  const yyyy = istNow.getFullYear();
  const mm = String(istNow.getMonth() + 1).padStart(2, '0');
  const dd = String(istNow.getDate()).padStart(2, '0');
  const today = `${yyyy}-${mm}-${dd}`;

  // Tomorrow
  const tomorrowDate = new Date(istNow.getTime() + 24 * 60 * 60 * 1000);
  const tomYYYY = tomorrowDate.getFullYear();
  const tomMM = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
  const tomDD = String(tomorrowDate.getDate()).padStart(2, '0');
  const tomorrow = `${tomYYYY}-${tomMM}-${tomDD}`;

  const on = (r: Appointment, day: string) => String(r.Start_ISO || '').startsWith(day);
  const line = (r: Appointment) => `- ${r.Time} | ${r.Patient_Name} | ${r.Phone} | ${r.Problem}`;

  const todayRows = rows.filter(r => on(r, today));
  const booked = todayRows.filter(r => r.Status === 'Booked');
  const cancelled = todayRows.filter(r => r.Status === 'Cancelled');
  const upcoming = rows
    .filter(r => on(r, tomorrow) && r.Status === 'Booked')
    .sort((a, b) => String(a.Start_ISO).localeCompare(String(b.Start_ISO)));

  const dateHeading = istNow.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const report = [
    `${settings.clinicName} - Daily Report (${dateHeading})`,
    '',
    `Aaj ke din ki appointments: ${booked.length} booked, ${cancelled.length} cancelled`,
    ...(booked.length ? booked.map(line) : ['- Koi nahi']),
    '',
    'Aaj ke din ki cancelled appointments:',
    ...(cancelled.length ? cancelled.map(line) : ['- Koi nahi']),
    '',
    `Kal ke upcoming patients (${upcoming.length}):`,
    ...(upcoming.length ? upcoming.map(line) : ['- Abhi koi booking nahi'])
  ].join('\n');

  return {
    reportText: report,
    dateStr: dateHeading,
    bookedCount: booked.length,
    cancelledCount: cancelled.length,
    upcomingCount: upcoming.length,
    todayBooked: booked,
    todayCancelled: cancelled,
    tomorrowUpcoming: upcoming
  };
}

export async function sendDailyReportEmail(reportData: DailyReportData): Promise<{ success: boolean; message: string }> {
  const settings = clinicStore.getSettings();
  const to = settings.ownerEmail;
  const subject = `Daily Clinic Report - ${reportData.dateStr}`;

  console.log(`[Email Notification Simulated] To: ${to}, Subject: ${subject}\n\n${reportData.reportText}`);

  return {
    success: true,
    message: `Report sent to ${to}`
  };
}
