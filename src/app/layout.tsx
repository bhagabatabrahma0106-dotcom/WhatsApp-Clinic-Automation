import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clinic WhatsApp Appointment Automation | Live Dashboard & AI Engine',
  description: 'Production-ready WhatsApp Cloud API, AI Booking Agent with 7 tools, Google Calendar & Sheets sync, 15-min auto reminders, and daily owner reports.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
