import { NextRequest, NextResponse } from 'next/server';
import { clinicStore } from '@/lib/storage';
import { Appointment } from '@/lib/types';

export async function GET() {
  const appointments = clinicStore.getAppointments();
  const closedDates = clinicStore.getClosedDates();
  return NextResponse.json({ appointments, closedDates });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if it's a closed date toggle
    if (body.action === 'toggle_closed_date') {
      const { date, closed } = body;
      clinicStore.setClinicClosed(date, closed);
      return NextResponse.json({ success: true, closedDates: clinicStore.getClosedDates() });
    }

    const apt: Appointment = {
      id: body.Event_ID || `EVT-${Date.now().toString().slice(-6)}`,
      Event_ID: body.Event_ID || `EVT-${Date.now().toString().slice(-6)}`,
      Start_ISO: body.Start_ISO,
      Date: body.Date,
      Time: body.Time,
      Patient_Name: body.Patient_Name,
      Phone: body.Phone,
      Problem: body.Problem,
      Status: body.Status || 'Booked',
      Reminder_Sent: body.Reminder_Sent || 'No',
      createdAt: new Date().toISOString()
    };

    clinicStore.addAppointment(apt);
    return NextResponse.json({ success: true, appointment: apt }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error creating appointment' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { event_id, updates } = await req.json();
    if (!event_id) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 });
    }

    const updated = clinicStore.updateAppointment(event_id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error updating appointment' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const event_id = searchParams.get('event_id');
    if (!event_id) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 });
    }

    const deleted = clinicStore.deleteAppointment(event_id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error deleting appointment' }, { status: 500 });
  }
}
