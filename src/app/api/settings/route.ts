import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getUserSettings, updateUserSettings } from '@/lib/db';
import { getSupabaseServerClient } from '@/lib/supabaseAppData';

export async function GET() {
  await connection();
  try {
    const ctx = await getSupabaseServerClient();
    if (ctx) {
      const { client, userId, username, displayName } = ctx;
      const { data } = await client
        .from('user_settings')
        .select('settings')
        .eq('user_id', userId)
        .maybeSingle();

      const saved = data?.settings;
      const defaultName = displayName || username || 'Học viên';
      const userSettings = {
        user_name: saved?.user_name || defaultName,
        daily_limit: saved?.daily_limit ?? 15,
        speech_rate: saved?.speech_rate ?? 0.85,
        audio_engine: saved?.audio_engine || 'online',
        auto_play_audio: Boolean(saved?.auto_play_audio),
        has_onboarded: Boolean(saved?.has_onboarded ?? false),
        hsk_level: saved?.hsk_level ?? 1,
        fsrs_retention: saved?.fsrs_retention ?? 0.9,
      };

      return NextResponse.json(
        { ok: true, settings: userSettings },
        { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
      );
    }

    const settings = getUserSettings();
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
    const ctx = await getSupabaseServerClient();

    if (ctx) {
      const { client, userId, username, displayName } = ctx;

      // 1. Fetch current settings from Supabase to prevent losing existing fields on Serverless
      const { data: existingRow } = await client
        .from('user_settings')
        .select('settings')
        .eq('user_id', userId)
        .maybeSingle();

      const defaultName = displayName || username || 'Học viên';
      const baseSettings = existingRow?.settings || {
        user_name: defaultName,
        daily_limit: 15,
        speech_rate: 0.85,
        audio_engine: 'online',
        auto_play_audio: false,
        has_onboarded: false,
        hsk_level: 1,
        fsrs_retention: 0.9,
      };
      const mergedSettings = {
        ...baseSettings,
        ...body,
        has_onboarded: true,
      };

      // 2. Immediately upsert into Supabase
      const { error: upsertErr } = await client.from('user_settings').upsert({
        user_id: userId,
        settings: mergedSettings,
        updated_at: new Date().toISOString(),
      });

      if (upsertErr) {
        console.error('Supabase settings upsert error:', upsertErr);
      }

      return NextResponse.json({ ok: true, settings: mergedSettings });
    }

    const updated = updateUserSettings(body);
    return NextResponse.json({ ok: true, settings: updated });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
