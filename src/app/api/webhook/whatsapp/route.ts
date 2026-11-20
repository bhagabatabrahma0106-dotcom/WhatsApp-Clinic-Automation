import { NextRequest, NextResponse } from 'next/server';
import { clinicStore } from '@/lib/storage';
import { runAIAgent } from '@/lib/ai-agent';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp';

// GET: Meta Webhook Verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const settings = clinicStore.getSettings();
  const verifyToken = settings.metaVerifyToken || process.env.WHATSAPP_VERIFY_TOKEN || 'clinic_bot_secret_token_2026';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Meta Webhook Verified Successfully]');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST: Meta WhatsApp Cloud API Message Receiver
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Check entry structure from Meta Cloud API
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0]?.value;

    // Filter out status updates (sent, delivered, read) - Phase 4.3 rule
    if (change?.statuses && !change?.messages) {
      return NextResponse.json({ status: 'ignored_status_update' }, { status: 200 });
    }

    const messages = change?.messages;
    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'no_messages' }, { status: 200 });
    }

    const message = messages[0];
    const contact = change?.contacts?.[0];
    const phone = contact?.wa_id || message.from;
    const patientWaName = contact?.profile?.name || 'Patient';

    // Phase 4.3 / 9.1: Only Text Messages filter
    if (message.type !== 'text') {
      await sendWhatsAppTextMessage({
        to: phone,
        body: 'Kripya text me likhkar bhejein.'
      });
      return NextResponse.json({ status: 'non_text_message_handled' }, { status: 200 });
    }

    const textBody = message.text?.body?.trim();
    if (!textBody) {
      return NextResponse.json({ status: 'empty_text' }, { status: 200 });
    }

    // Save incoming message in patient's conversation history
    clinicStore.addMessage(phone, {
      id: `msg-${Date.now()}-in`,
      sender: 'patient',
      text: textBody,
      timestamp: new Date().toISOString()
    });

    // Run AI receptionist with tools
    const { reply, toolsCalled } = await runAIAgent(textBody, phone);

    // Save assistant reply in history
    clinicStore.addMessage(phone, {
      id: `msg-${Date.now()}-out`,
      sender: 'assistant',
      text: reply,
      timestamp: new Date().toISOString(),
      toolsUsed: toolsCalled
    });

    // Send reply back to patient via WhatsApp Cloud API
    await sendWhatsAppTextMessage({
      to: phone,
      body: reply
    });

    return NextResponse.json({
      status: 'success',
      reply,
      toolsCalled,
      recipient: phone
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Webhook Error]', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
