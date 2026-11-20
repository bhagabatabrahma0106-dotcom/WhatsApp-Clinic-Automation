# Clinic WhatsApp Appointment Automation

> **Production-grade WhatsApp + AI Receptionist + Google Calendar + Google Sheets booking and notification automation, deployable live on Vercel.**  
> Based on the practical setup guide by **ORVANTA (@theorvanta / Sachin Prajapati)**.

---

## 🚀 Key Features

1. **AI Booking Receptionist (Workflow 1)**:
   - Built-in tool calling support with **7 specialized tools**:
     - `get_day_events`: Retrieves booked calendar events and generates 20-minute available slots.
     - `check_slot_available`: Validates slot availability against doctor hours, lunch breaks (1:00 PM – 2:00 PM), Sundays, and doctor leave (`CLINIC CLOSED`).
     - `book_appointment`: Schedules the event on the clinic calendar.
     - `log_booking`: Records the appointment in Google Sheets with the required 9 columns.
     - `find_my_booking`: Retrieves active patient bookings by WhatsApp phone number.
     - `cancel_event`: Deletes the calendar entry.
     - `mark_cancelled`: Updates status in Google Sheets to `Cancelled`.
   - **Safety Rules**:
     - Strict medical advice disclaimer.
     - Emergency protocol: detects severe symptoms (chest pain, breathing issues, severe bleeding) and immediately halts booking, urging patients to call the clinic or visit the nearest hospital.
     - Anti-double-booking protection.

2. **15-Minute Auto-Reminder Scheduler (Workflow 2)**:
   - Configured via `vercel.json` crons (`*/15 * * * *`).
   - Scans bookings where `Status = 'Booked'` and `Reminder_Sent = 'No'`.
   - Filters appointments starting in the **next 30 to 75 minutes**.
   - Sends the approved Meta template `appointment_reminder` and marks `Reminder_Sent = 'Yes'` to prevent duplicate alerts.

3. **Daily Owner Report at 8:00 PM (Workflow 3)**:
   - Configured via `vercel.json` crons (`30 14 * * *` UTC / 8:00 PM IST).
   - Compiles today's booked appointments, today's cancellations, and tomorrow's upcoming schedule.
   - Dispatches a formatted executive summary directly to the clinic owner's email.

4. **Live Interactive Dashboard & WhatsApp Simulator**:
   - Web-based WhatsApp chat mockup to test patient interactions without needing phone credits.
   - 1-click execution for all **8 Phase 5 verification test scenarios** from the guide.
   - Real-time tool execution inspector.
   - Live appointments log matching the 9 Google Sheets columns:  
     `Start_ISO | Date | Time | Patient_Name | Phone | Problem | Status | Event_ID | Reminder_Sent`
   - Visual 20-minute slot calendar with `CLINIC CLOSED` holiday toggle.

5. **Ready-to-Import n8n Workflows**:
   - Includes full JSON templates under `/workflows` and downloadable from the web UI:
     - `1-clinic-ai-booking-agent.json`
     - `2-clinic-auto-reminder.json`
     - `3-clinic-daily-report.json`
     - `4-clinic-error-alert.json`

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, Serverless Functions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **AI Engine**: OpenAI GPT-4o-mini / Tool Calling Function Execution
- **Messaging**: Meta WhatsApp Cloud API (`v22.0`)
- **Hosting**: Vercel Serverless & Cron Jobs

---

## 🌐 Environment Variables

Set these in your `.env.local` or on the **Vercel Project Settings > Environment Variables**:

```env
# OpenAI API Key for the AI Receptionist
OPENAI_API_KEY=sk-...

# Meta WhatsApp Cloud API Credentials
WHATSAPP_ACCESS_TOKEN=EA...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_VERIFY_TOKEN=clinic_bot_secret_token_2026

# Clinic Configuration (Defaults provided in app)
CLINIC_NAME="Sunrise Clinic"
DOCTOR_NAME="Dr. Mehta"
CLINIC_PHONE="+91 98765 43210"
OWNER_EMAIL="owner.sunriseclinic@gmail.com"
```

---

## 🔗 Meta Webhook Setup

When deploying to Vercel:
1. In the **Meta Developer Portal > WhatsApp > Configuration**:
   - **Callback URL**: `https://<your-project>.vercel.app/api/webhook/whatsapp`
   - **Verify Token**: `clinic_bot_secret_token_2026` (or your custom `WHATSAPP_VERIFY_TOKEN`)
2. Under **Webhook fields**, subscribe to:
   - `messages`
3. Verify WABA subscription via Graph API:
   ```bash
   curl -X POST "https://graph.facebook.com/v22.0/<WABA_ID>/subscribed_apps" \
     -H "Authorization: Bearer <ACCESS_TOKEN>"
   ```

---

## 🧪 Phase 5 Test Suite

Verify all 8 test cases from page 12 of the setup guide directly from the dashboard:
1. **Greeting + Consent**: `"Hi, mujhe kal doctor se appointment chahiye"`
2. **Full Name**: `"Rahul Sharma"`
3. **Problem & Date**: `"Daant me dard hai"`
4. **Slot Choice**: `"11:20 AM"`
5. **Verify Database**: Check event created in Calendar and row appended in Sheets.
6. **Conflict Test**: Attempt booking the same slot; bot alerts unavailable and gives alternatives.
7. **Emergency Rule**: `"Mujhe seene me dard hai aur saans nahi aa rahi"` -> Bot halts booking, provides emergency clinic line.
8. **Cancellation**: `"Meri appointment cancel kar do"` -> Deletes calendar event and marks row Cancelled.

---

## 📦 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open browser
http://localhost:3000
```
