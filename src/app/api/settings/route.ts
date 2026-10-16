import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import {
  fetchCurrentUserSettings,
  saveCurrentUserSettings,
} from '@/services/settings.service';

export async function GET() {
  await connection();
  try {
    const settings = await fetchCurrentUserSettings();
    return NextResponse.json(
      { ok: true, settings },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await connection();
  try {
    const body = await request.json();
    const settings = await saveCurrentUserSettings(body);
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
