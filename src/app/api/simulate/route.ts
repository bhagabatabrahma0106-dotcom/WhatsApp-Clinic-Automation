import { NextRequest, NextResponse } from 'next/server';
import { clinicStore } from '@/lib/storage';
import { runAIAgent } from '@/lib/ai-agent';

export async function POST(req: NextRequest) {
  try {
    const { message, phone = '919876543210', reset = false } = await req.json();

    if (reset) {
      clinicStore.clearHistory(phone);
      return NextResponse.json({ success: true, message: 'Conversation reset.' });
    }

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Save patient message
    clinicStore.addMessage(phone, {
      id: `sim-${Date.now()}-in`,
      sender: 'patient',
      text: message,
      timestamp: new Date().toISOString()
    });

    // Run AI Agent
    const { reply, toolsCalled } = await runAIAgent(message, phone);

    // Save assistant reply
    clinicStore.addMessage(phone, {
      id: `sim-${Date.now()}-out`,
      sender: 'assistant',
      text: reply,
      timestamp: new Date().toISOString(),
      toolsUsed: toolsCalled
    });

    const appointments = clinicStore.getAppointments();
    const history = clinicStore.getHistory(phone);
    const toolLogs = clinicStore.getToolLogs().slice(0, 10);

    return NextResponse.json({
      reply,
      toolsCalled,
      history,
      appointments,
      toolLogs
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Simulation error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone') || '919876543210';
  const history = clinicStore.getHistory(phone);
  const toolLogs = clinicStore.getToolLogs().slice(0, 10);
  return NextResponse.json({ history, toolLogs });
}
