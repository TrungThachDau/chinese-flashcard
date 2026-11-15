import { NextRequest, NextResponse } from 'next/server';
import { getCharDetail } from '@/services/character.service';

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<'/api/characters/[char]'>
) {
  try {
    const { char } = await params;
    const decodedChar = decodeURIComponent(char);
    const detail = await getCharDetail(decodedChar);

    if (!detail) {
      return NextResponse.json({ ok: false, error: 'Character not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, detail });
  } catch (error) {
    console.error('Error fetching char detail:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch character detail' }, { status: 500 });
  }
}
