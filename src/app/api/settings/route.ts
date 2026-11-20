import { NextRequest, NextResponse } from 'next/server';
import { clinicStore } from '@/lib/storage';

export async function GET() {
  const settings = clinicStore.getSettings();
  // Mask sensitive keys for security in UI responses
  const safeSettings = {
    ...settings,
    openaiApiKey: settings.openaiApiKey ? `sk-...${settings.openaiApiKey.slice(-4)}` : '',
    metaAccessToken: settings.metaAccessToken ? `EA...${settings.metaAccessToken.slice(-6)}` : '',
  };
  return NextResponse.json(safeSettings);
}

export async function POST(req: NextRequest) {
  try {
    const updates = await req.json();
    const updated = clinicStore.updateSettings(updates);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error updating settings' }, { status: 500 });
  }
}
