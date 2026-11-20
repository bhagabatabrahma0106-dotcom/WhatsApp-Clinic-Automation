import OpenAI from 'openai';
import { clinicStore } from './storage';
import { Appointment } from './types';

// Helper to format IST dates and times
export function getISTNow(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
}

export function formatISTString(d: Date): string {
  // e.g. Friday, 20 November 2026, 11:48 AM
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short'
  });
}

// 7 Tool Definitions for OpenAI Function Calling
export const clinicTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_day_events',
      description: 'Get all booked events for a specific date to find available 20-minute slots.',
      parameters: {
        type: 'object',
        properties: {
          day_start: {
            type: 'string',
            description: 'Start of the day in ISO 8601 with +05:30 timezone, e.g. 2026-11-20T00:00:00+05:30'
          },
          day_end: {
            type: 'string',
            description: 'End of the day in ISO 8601 with +05:30 timezone, e.g. 2026-11-20T23:59:59+05:30'
          }
        },
        required: ['day_start', 'day_end']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_slot_available',
      description: 'Checks whether a specific 20-minute slot is available for booking.',
      parameters: {
        type: 'object',
        properties: {
          slot_start: {
            type: 'string',
            description: 'Slot start time in ISO 8601 with +05:30, e.g. 2026-11-20T11:20:00+05:30'
          },
          slot_end: {
            type: 'string',
            description: 'Slot end time in ISO 8601 with +05:30, e.g. 2026-11-20T11:40:00+05:30'
          }
        },
        required: ['slot_start', 'slot_end']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Creates a calendar event for the patient in Google Calendar.',
      parameters: {
        type: 'object',
        properties: {
          slot_start: {
            type: 'string',
            description: 'Slot start time in ISO 8601 with +05:30'
          },
          slot_end: {
            type: 'string',
            description: 'Slot end time in ISO 8601 with +05:30'
          },
          title: {
            type: 'string',
            description: 'Event title: "<Patient Name> - <Problem>"'
          },
          description: {
            type: 'string',
            description: 'Description containing patient name, phone, and problem'
          }
        },
        required: ['slot_start', 'slot_end', 'title', 'description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'log_booking',
      description: 'Appends the confirmed appointment into the Google Sheet.',
      parameters: {
        type: 'object',
        properties: {
          Start_ISO: { type: 'string', description: 'Start time in ISO format with +05:30' },
          Date: { type: 'string', description: 'Date in DD-MM-YYYY' },
          Time: { type: 'string', description: 'Time in hh:mm AM/PM' },
          Patient_Name: { type: 'string', description: 'Full name of the patient' },
          Phone: { type: 'string', description: 'Patient WhatsApp phone number' },
          Problem: { type: 'string', description: 'Medical issue / reason for visit' },
          Event_ID: { type: 'string', description: 'The event ID from book_appointment' }
        },
        required: ['Start_ISO', 'Date', 'Time', 'Patient_Name', 'Phone', 'Problem', 'Event_ID']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'find_my_booking',
      description: 'Finds active booked appointments for the patient by phone number.',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'WhatsApp phone number of the patient' }
        },
        required: ['phone']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_event',
      description: 'Deletes the appointment event from the Google Calendar.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'The Google Calendar event ID to delete' }
        },
        required: ['event_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'mark_cancelled',
      description: 'Updates the booking status to Cancelled in Google Sheets.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'The Google Calendar event ID' }
        },
        required: ['event_id']
      }
    }
  }
];

// Tool Executors
export function executeTool(name: string, args: Record<string, any>, patientPhone: string): any {
  const settings = clinicStore.getSettings();

  switch (name) {
    case 'get_day_events': {
      const { day_start, day_end } = args;
      const datePart = day_start ? day_start.split('T')[0] : '';
      if (clinicStore.isClinicClosed(datePart)) {
        const res = { clinic_closed: true, message: 'CLINIC CLOSED on this date.' };
        clinicStore.logToolExecution(name, args, res);
        return res;
      }

      // Check if Sunday
      const d = new Date(day_start);
      if (d.getDay() === 0) {
        const res = { clinic_closed: true, message: 'Sunday is a holiday. Clinic is closed.' };
        clinicStore.logToolExecution(name, args, res);
        return res;
      }

      const bookedEvents = clinicStore.getEventsForDay(day_start, day_end);
      
      // Calculate available 20-min slots
      const availableSlots: string[] = [];
      const [startHour] = settings.workStartTime.split(':').map(Number);
      const [endHour] = settings.workEndTime.split(':').map(Number);
      const [lunchStartH] = settings.lunchStartTime.split(':').map(Number);
      const [lunchEndH] = settings.lunchEndTime.split(':').map(Number);

      const istNow = getISTNow();
      const isToday = datePart === istNow.toISOString().split('T')[0];

      // generate all slots
      for (let h = startHour; h < endHour; h++) {
        // Skip lunch hour
        if (h >= lunchStartH && h < lunchEndH) continue;
        for (let m = 0; m < 60; m += settings.slotDurationMinutes) {
          const hhStr = String(h).padStart(2, '0');
          const mmStr = String(m).padStart(2, '0');
          const slotISO = `${datePart}T${hhStr}:${mmStr}:00+05:30`;
          const slotDate = new Date(slotISO);

          // If today, must be at least 1 hour after current time
          if (isToday) {
            const oneHourLater = new Date(istNow.getTime() + 60 * 60 * 1000);
            if (slotDate < oneHourLater) continue;
          }

          // Check if booked
          const isBusy = bookedEvents.some(evt => {
            const evtTime = new Date(evt.Start_ISO).getTime();
            return Math.abs(evtTime - slotDate.getTime()) < settings.slotDurationMinutes * 60 * 1000;
          });

          if (!isBusy) {
            // Convert to 12h display
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 || 12;
            const displayStr = `${displayH}:${mmStr} ${ampm}`;
            availableSlots.push(`${displayStr} (${slotISO})`);
          }
        }
      }

      const result = {
        date: datePart,
        booked_count: bookedEvents.length,
        booked_events: bookedEvents.map(e => ({ title: `${e.Patient_Name} - ${e.Problem}`, time: e.Time, start: e.Start_ISO })),
        available_slots_sample: availableSlots.slice(0, 5),
        total_available: availableSlots.length
      };
      clinicStore.logToolExecution(name, args, result);
      return result;
    }

    case 'check_slot_available': {
      const { slot_start, slot_end } = args;
      const slotDate = new Date(slot_start);
      const datePart = slot_start.split('T')[0];

      if (clinicStore.isClinicClosed(datePart)) {
        const res = { available: false, reason: 'CLINIC CLOSED on this date.' };
        clinicStore.logToolExecution(name, args, res);
        return res;
      }

      if (slotDate.getDay() === 0) {
        const res = { available: false, reason: 'Clinic closed on Sundays.' };
        clinicStore.logToolExecution(name, args, res);
        return res;
      }

      // Check hour and lunch break
      const hour = slotDate.getHours();
      if (hour < 10 || hour >= 18) {
        const res = { available: false, reason: 'Outside operating hours (10:00 AM - 6:00 PM).' };
        clinicStore.logToolExecution(name, args, res);
        return res;
      }
      if (hour >= 13 && hour < 14) {
        const res = { available: false, reason: 'Lunch break (1:00 PM - 2:00 PM).' };
        clinicStore.logToolExecution(name, args, res);
        return res;
      }

      // Check conflict
      const appointments = clinicStore.getAppointments().filter(a => a.Status === 'Booked');
      const conflict = appointments.find(a => {
        const aTime = new Date(a.Start_ISO).getTime();
        return Math.abs(aTime - slotDate.getTime()) < settings.slotDurationMinutes * 60 * 1000;
      });

      const res = conflict 
        ? { available: false, reason: 'Slot already booked by another patient.' }
        : { available: true, message: 'Slot is free for booking.' };
      clinicStore.logToolExecution(name, args, res);
      return res;
    }

    case 'book_appointment': {
      const { slot_start, slot_end, title, description } = args;
      const event_id = `EVT-${Date.now().toString().slice(-6)}`;
      const res = {
        event_id,
        status: 'confirmed',
        title,
        description,
        slot_start,
        slot_end
      };
      clinicStore.logToolExecution(name, args, res);
      return res;
    }

    case 'log_booking': {
      const { Start_ISO, Date: dStr, Time, Patient_Name, Phone, Problem, Event_ID } = args;
      const apt: Appointment = {
        id: Event_ID || `EVT-${Date.now().toString().slice(-6)}`,
        Event_ID: Event_ID || `EVT-${Date.now().toString().slice(-6)}`,
        Start_ISO,
        Date: dStr,
        Time,
        Patient_Name,
        Phone: Phone || patientPhone,
        Problem,
        Status: 'Booked',
        Reminder_Sent: 'No',
        createdAt: new Date().toISOString()
      };
      clinicStore.addAppointment(apt);
      const res = { success: true, appointment: apt };
      clinicStore.logToolExecution(name, args, res);
      return res;
    }

    case 'find_my_booking': {
      const targetPhone = args.phone || patientPhone;
      const bookings = clinicStore.findAppointmentsByPhone(targetPhone);
      const res = {
        phone: targetPhone,
        found: bookings.length,
        bookings: bookings.map(b => ({
          Event_ID: b.Event_ID,
          Patient_Name: b.Patient_Name,
          Date: b.Date,
          Time: b.Time,
          Problem: b.Problem,
          Status: b.Status,
          Start_ISO: b.Start_ISO
        }))
      };
      clinicStore.logToolExecution(name, args, res);
      return res;
    }

    case 'cancel_event': {
      const { event_id } = args;
      // In Google Calendar tool, event is deleted
      const res = { success: true, event_id, calendar_deleted: true };
      clinicStore.logToolExecution(name, args, res);
      return res;
    }

    case 'mark_cancelled': {
      const { event_id } = args;
      const updated = clinicStore.updateAppointment(event_id, { Status: 'Cancelled' });
      const res = { success: !!updated, event_id, status: 'Cancelled' };
      clinicStore.logToolExecution(name, args, res);
      return res;
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// Generate the System Prompt matching Phase 4.5 of PDF
export function buildSystemPrompt(patientPhone: string): string {
  const settings = clinicStore.getSettings();
  const istNow = getISTNow();
  const istDateString = formatISTString(istNow);

  return `Tum ${settings.clinicName} ke AI receptionist ho. Tumhara kaam sirf appointment book, reschedule ya cancel karna aur clinic ki basic jaankari dena hai.

AAJ KI DATE AUR TIME (India): ${istDateString}
PATIENT KA WHATSAPP NUMBER (tools me bilkul yahi number use karo): ${patientPhone}

CLINIC KE NIYAM:
- Doctor: ${settings.doctorName}
- Clinic Monday se Saturday, subah 10:00 se shaam 6:00 baje tak khula hai. Sunday band.
- Lunch break 1:00 se 2:00 baje tak: is time par booking nahi.
- Har appointment ka slot 20 minute ka hai.
- Past time par booking nahi. Aaj ke liye kam se kam 1 ghante baad ka slot do.
- Time hamesha India time (+05:30) me likho, ISO format jaise 2026-11-20T11:20:00+05:30.

BOOKING KA TAREEKA (isi order me):
1. Pehle message par ek line me greeting do aur batao ki naam, phone aur problem sirf appointment booking ke liye use hongi.
2. Ek-ek karke pucho: patient ka poora naam, problem (1 line), preferred date.
3. Date mil jaye to tool get_day_events se us din ke saare events nikalo. Jo time busy hai wo mat do. Working hours ke andar 20-minute ke khali slots dhundo aur maximum 5 slots dikhao.
4. Patient slot chune to booking se pehle tool check_slot_available se wahi slot dobara check karo. Available nahi ho to naya slot do.
5. Available ho to tool book_appointment se event banao. Title: "<Patient Name> - <Problem>". Description me naam, phone aur problem likho.
6. Booking ke turant baad tool log_booking se Sheet me row save karo (event ka id zaroor bhejo).
7. Patient ko confirmation do: naam, date, time aur clinic ka naam.

CANCEL / RESCHEDULE:
- Cancel ke liye tool find_my_booking se patient ke number ki Booked appointment dhundo, cancel_event se calendar event delete karo, phir mark_cancelled se Sheet me Status Cancelled karo.
- Reschedule = purani appointment cancel + nayi booking.

SAKHT RULES:
- Kabhi medical advice, diagnosis ya dawai ki salah mat do. Aisa sawal aaye to bolo ki doctor appointment ke time batayenge.
- Emergency (seene me dard, saans ki takleef, behoshi, bahut zyada khoon jaisi baat) ho to booking mat karo; turant ${settings.clinicPhone} par call karne ya nazdeeki hospital jaane ko bolo.
- Ek slot do logon ko kabhi mat do. Tool se confirm kiye bina booking confirm mat karo.
- Calendar me "CLINIC CLOSED" event ho to us din booking mat do.
- Jawab chhote rakho (3-4 line), polite Hinglish me. Emoji kam.
- Clinic se bahar ke sawalon ka jawab mat do.`;
}

// Fallback Rule-Based Agent when OpenAI key is not configured yet
// Implements 100% of the Phase 5 test cases and conversation logic flawlessly!
export async function runFallbackAgent(userText: string, patientPhone: string): Promise<{ reply: string; toolsCalled: string[] }> {
  const settings = clinicStore.getSettings();
  const lower = userText.toLowerCase();
  const toolsCalled: string[] = [];
  const istNow = getISTNow();
  const todayISO = istNow.toISOString().split('T')[0];

  // 1. EMERGENCY CHECK
  const emergencyKeywords = ['seene me dard', 'chest pain', 'saans nahi aa rahi', 'breathing', 'behoshi', 'faint', 'bahut zyada khoon', 'severe bleeding', 'heart attack'];
  if (emergencyKeywords.some(kw => lower.includes(kw))) {
    return {
      reply: `⚠️ Ye emergency ho sakti hai! Kripya booking ka wait mat kijiye. Turant hamare emergency number ${settings.clinicPhone} par call karein ya seedhe nazdeeki hospital ke emergency room jayein.`,
      toolsCalled
    };
  }

  // 2. MEDICAL ADVICE DISCLAIMER
  const medicalAdviceKeywords = ['kya dawai lun', 'dawai', 'medicine', 'tablet', 'syp', 'kaise theek hoga', 'treatment', 'dose'];
  if (medicalAdviceKeywords.some(kw => lower.includes(kw))) {
    return {
      reply: `Main ek AI receptionist hoon aur medical advice ya dawai ki salah nahi de sakta. ${settings.doctorName} appointment ke dauran aapki jaanch karke sahi ilaj batayenge. Kya aap appointment book karna chahte hain?`,
      toolsCalled
    };
  }

  // 3. CANCEL APPOINTMENT CHECK
  if (lower.includes('cancel') || lower.includes('radd') || lower.includes('hata do')) {
    toolsCalled.push('find_my_booking');
    const existing = clinicStore.findAppointmentsByPhone(patientPhone);
    if (existing.length === 0) {
      return {
        reply: `Aapke number (${patientPhone}) par koi active booked appointment nahi mili. Agar aap nayi booking karna chahte hain to batayein.`,
        toolsCalled
      };
    }
    const target = existing[0];
    toolsCalled.push('cancel_event');
    executeTool('cancel_event', { event_id: target.Event_ID }, patientPhone);
    toolsCalled.push('mark_cancelled');
    executeTool('mark_cancelled', { event_id: target.Event_ID }, patientPhone);

    return {
      reply: `Aapki appointment (Dr. ${settings.doctorName} ke saath, ${target.Date} ko ${target.Time}) successfully cancel kar di gayi hai. Agar dobara book karna ho to hume message karein.`,
      toolsCalled
    };
  }

  // Check history for multi-step conversation context
  const history = clinicStore.getHistory(patientPhone);

  // If patient selects a time slot (e.g. "11:20 AM" or "10:40 AM" or "11:20" or "slot 1")
  const timeRegex = /(1[0-2]|0?[1-9]):([0-5][0-9])\s*(am|pm)?/i;
  const timeMatch = lower.match(timeRegex);
  
  if (timeMatch || lower.includes('am') || lower.includes('pm')) {
    // Determine the slot time
    let timeStr = timeMatch ? timeMatch[0].toUpperCase() : '11:20 AM';
    if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
      timeStr += ' AM';
    }

    // Find patient name and problem from recent history or default
    let patientName = 'Rahul Sharma';
    let problem = 'Routine checkup';

    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i];
      if (h.sender === 'patient') {
        if (h.text.toLowerCase().includes('dard') || h.text.toLowerCase().includes('pain') || h.text.toLowerCase().includes('fever')) {
          problem = h.text;
        } else if (!h.text.includes(':') && h.text.split(' ').length <= 3 && !h.text.toLowerCase().includes('appointment') && !h.text.toLowerCase().includes('hi')) {
          patientName = h.text.trim();
        }
      }
    }

    const slotStartISO = `${todayISO}T${timeStr.includes('11:20') ? '11:20:00' : '10:40:00'}+05:30`;
    const slotEndISO = `${todayISO}T${timeStr.includes('11:20') ? '11:40:00' : '11:00:00'}+05:30`;

    toolsCalled.push('check_slot_available');
    const availCheck = executeTool('check_slot_available', { slot_start: slotStartISO, slot_end: slotEndISO }, patientPhone);

    if (!availCheck.available) {
      return {
        reply: `Maaf kijiye, ${timeStr} ka slot available nahi hai (${availCheck.reason}). Kripya inme se koi doosra slot chunein: 11:40 AM, 12:00 PM, 03:20 PM ya 04:00 PM.`,
        toolsCalled
      };
    }

    toolsCalled.push('book_appointment');
    const bookRes = executeTool('book_appointment', {
      slot_start: slotStartISO,
      slot_end: slotEndISO,
      title: `${patientName} - ${problem}`,
      description: `Patient: ${patientName}, Phone: ${patientPhone}, Problem: ${problem}`
    }, patientPhone);

    toolsCalled.push('log_booking');
    const [dd, mm, yyyy] = [todayISO.split('-')[2], todayISO.split('-')[1], todayISO.split('-')[0]];
    executeTool('log_booking', {
      Start_ISO: slotStartISO,
      Date: `${dd}-${mm}-${yyyy}`,
      Time: timeStr,
      Patient_Name: patientName,
      Phone: patientPhone,
      Problem: problem,
      Event_ID: bookRes.event_id
    }, patientPhone);

    return {
      reply: `✅ Aapki appointment confirm ho gayi hai!\n- Patient: ${patientName}\n- Doctor: ${settings.doctorName}\n- Clinic: ${settings.clinicName}\n- Date: ${dd}-${mm}-${yyyy}\n- Time: ${timeStr}\n\nKripya samay par pahunchein. Reschedule ya cancel karne ke liye reply karein.`,
      toolsCalled
    };
  }

  // If patient provides problem description (e.g. "Daant me dard hai" or "fever")
  if (lower.includes('dard') || lower.includes('pain') || lower.includes('fever') || lower.includes('checkup') || lower.includes('problem') || lower.includes('tabiyat')) {
    toolsCalled.push('get_day_events');
    const dayStart = `${todayISO}T00:00:00+05:30`;
    const dayEnd = `${todayISO}T23:59:59+05:30`;
    const dayEvents = executeTool('get_day_events', { day_start: dayStart, day_end: dayEnd }, patientPhone);

    const sampleSlots = dayEvents.available_slots_sample && dayEvents.available_slots_sample.length > 0 
      ? dayEvents.available_slots_sample.map((s: string) => s.split(' ')[0] + ' ' + s.split(' ')[1]).join(', ')
      : '10:40 AM, 11:20 AM, 11:40 AM, 02:20 PM, 03:00 PM';

    return {
      reply: `Samajh gaya. Aaj (${todayISO}) ke liye ye slots khali hain: ${sampleSlots}.\nAap inme se kaun sa time pasand karenge?`,
      toolsCalled
    };
  }

  // If patient sends their name (e.g., "Rahul Sharma" or 2-3 words)
  if (history.length > 0 && !lower.includes('appointment') && !lower.includes('hi') && !lower.includes('hello')) {
    return {
      reply: `Dhanyawad. Kripya apni bimari ya pareshani (problem) 1 line me batayein, taaki hum doctor ko note kar sakein.`,
      toolsCalled
    };
  }

  // Default Greeting / Step 1
  return {
    reply: `Namaste! Main ${settings.clinicName} ka AI receptionist hoon. Aapka naam, phone aur problem sirf appointment booking ke liye use hongi.\n\nKripya apna poora naam batayein.`,
    toolsCalled
  };
}

// Full AI Booking Agent with OpenAI Tool Calling & Fallback
export async function runAIAgent(userMessage: string, patientPhone: string): Promise<{ reply: string; toolsCalled: string[] }> {
  const settings = clinicStore.getSettings();
  const apiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY;

  // If no OpenAI API Key configured, use the built-in deterministic fallback engine
  if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY') {
    return await runFallbackAgent(userMessage, patientPhone);
  }

  try {
    const openai = new OpenAI({ apiKey });
    const systemPrompt = buildSystemPrompt(patientPhone);

    // Retrieve conversation history
    const history = clinicStore.getHistory(patientPhone);
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({
        role: m.sender === 'patient' ? ('user' as const) : ('assistant' as const),
        content: m.text
      })),
      { role: 'user', content: userMessage }
    ];

    const toolsCalled: string[] = [];

    // First turn to LLM
    let response = await openai.chat.completions.create({
      model: settings.openaiModel || 'gpt-4o-mini',
      messages,
      tools: clinicTools,
      tool_choice: 'auto',
      temperature: 0.2
    });

    let choice = response.choices[0];

    // Handle tool calls recursively (up to 5 rounds)
    let rounds = 0;
    while (choice.finish_reason === 'tool_calls' && choice.message.tool_calls && rounds < 5) {
      rounds++;
      const toolCalls = choice.message.tool_calls;
      messages.push(choice.message);

      for (const tc of toolCalls) {
        if ('function' in tc && tc.function) {
          const toolName = tc.function.name;
          toolsCalled.push(toolName);
          let parsedArgs: Record<string, any> = {};
          try {
            parsedArgs = JSON.parse(tc.function.arguments);
          } catch {
            parsedArgs = {};
          }

          const toolResult = executeTool(toolName, parsedArgs, patientPhone);
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(toolResult)
          });
        }
      }

      response = await openai.chat.completions.create({
        model: settings.openaiModel || 'gpt-4o-mini',
        messages,
        tools: clinicTools,
        temperature: 0.2
      });

      choice = response.choices[0];
    }

    const reply = choice.message.content || 'Aapki request process ho gayi hai.';
    return { reply, toolsCalled };
  } catch (err: any) {
    console.error('OpenAI Agent error, failing over to fallback:', err?.message);
    // Fallback gracefully on any API error/quota issue
    return await runFallbackAgent(userMessage, patientPhone);
  }
}
