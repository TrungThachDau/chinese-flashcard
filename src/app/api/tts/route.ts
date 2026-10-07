import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';

export async function GET(request: NextRequest) {
  await connection();

  try {
    const text = request.nextUrl.searchParams.get('text');

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    const cleanText = text.trim();
    // Google Translate TTS endpoint for standard Mandarin (zh-CN)
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-CN&q=${encodeURIComponent(
      cleanText
    )}`;

    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch TTS audio' }, { status: 502 });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error in TTS route:', error);
    return NextResponse.json({ error: 'Internal TTS error' }, { status: 500 });
  }
}

