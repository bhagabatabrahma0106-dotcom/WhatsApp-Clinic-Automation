import { NextRequest, NextResponse } from 'next/server';
import { clinicStore } from '@/lib/storage';
import { sendWhatsAppTemplateMessage, sendWhatsAppTextMessage } from '@/lib/whatsapp';
import { getISTNow } from '@/lib/ai-agent';

export async function GET(req: NextRequest) {
  try {
    const settings = clinicStore.getSettings();
    const appointments = clinicStore.getAppointments();

    // 1. Filter: Status = Booked and Reminder_Sent = No
    const eligible = appointments.filter(a => a.Status === 'Booked' && a.Reminder_Sent === 'No');

    const istNow = getISTNow();
    const nowMs = istNow.getTime();

    const remindersSent: Array<{ eventId: string; patient: string; phone: string; slotTime: string }> = [];

    for (const apt of eligible) {
      const aptTime = new Date(apt.Start_ISO).getTime();
      const diffMinutes = Math.floor((aptTime - nowMs) / (60 * 1000));

      // Condition: within next 30 to 75 minutes
      if (diffMinutes > 30 && diffMinutes <= 75) {
        // Send WhatsApp Reminder Template
        await sendWhatsAppTemplateMessage({
          to: apt.Phone,
          templateName: 'appointment_reminder',
          languageCode: 'en',
          parameters: [apt.Patient_Name, apt.Time]
        });

        // Also record a fallback text notification
        await sendWhatsAppTextMessage({
          to: apt.Phone,
          body: `Hello ${apt.Patient_Name}, this is a reminder from ${settings.clinicName}. Your appointment is today at ${apt.Time}. To reschedule or cancel, please reply to this message.`
        });

        // Mark Reminder_Sent = Yes in Sheet
        clinicStore.updateAppointment(apt.Event_ID, { Reminder_Sent: 'Yes' });

        remindersSent.push({
          eventId: apt.Event_ID,
          patient: apt.Patient_Name,
          phone: apt.Phone,
          slotTime: apt.Time
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: eligible.length,
      sentCount: remindersSent.length,
      remindersSent,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error processing reminders' }, { status: 500 });
  }
}
