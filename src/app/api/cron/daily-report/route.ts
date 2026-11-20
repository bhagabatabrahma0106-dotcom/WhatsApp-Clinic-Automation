import { NextRequest, NextResponse } from 'next/server';
import { generateDailyReport, sendDailyReportEmail } from '@/lib/reports';

export async function GET(req: NextRequest) {
  try {
    const reportData = generateDailyReport();
    const emailResult = await sendDailyReportEmail(reportData);

    return NextResponse.json({
      success: true,
      reportData,
      emailResult,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error generating daily report' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
