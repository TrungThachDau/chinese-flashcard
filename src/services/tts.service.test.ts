// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type TtsModule = typeof import('./tts.service');

interface FakeVoice {
  name: string;
  lang: string;
}

class FakeAudio {
  static instances: FakeAudio[] = [];
  static playResult: () => Promise<void> | undefined = () => Promise.resolve();
  static throwOnCreate = false;

  src: string;
  playbackRate = 1;
  currentTime = 5;
  onplay: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  pause = vi.fn();
  play = vi.fn(() => FakeAudio.playResult());

  constructor(src: string) {
    if (FakeAudio.throwOnCreate) throw new Error('no audio');
    this.src = src;
    FakeAudio.instances.push(this);
  }
}

class FakeUtterance {
  static instances: FakeUtterance[] = [];

  text: string;
  lang = '';
  rate = 1;
  pitch = 1;
  voice: FakeVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;

  constructor(text: string) {
    this.text = text;
    FakeUtterance.instances.push(this);
  }
}

function createSpeechSynthesis(voices: FakeVoice[] = []) {
  return {
    voices,
    paused: false,
    onvoiceschanged: null as null | (() => void),
    getVoices: vi.fn(function (this: { voices: FakeVoice[] }) {
      return this.voices;
    }),
    cancel: vi.fn(),
    resume: vi.fn(),
    speak: vi.fn(),
  };
}

type FakeSynth = ReturnType<typeof createSpeechSynthesis>;

async function loadWithWindow(
  synth: FakeSynth | null,
  storage?: Record<string, string>
): Promise<TtsModule> {
  const win: Record<string, unknown> = {};
  if (synth) win.speechSynthesis = synth;
  if (storage) {
    win.localStorage = { getItem: vi.fn((key: string) => storage[key] ?? null) };
  }
  vi.stubGlobal('window', win);
  return import('./tts.service');
}

async function flush() {
  await new Promise((r) => setTimeout(r, 0));
}

beforeEach(() => {
  vi.resetModules();
  FakeAudio.instances = [];
  FakeAudio.playResult = () => Promise.resolve();
  FakeAudio.throwOnCreate = false;
  FakeUtterance.instances = [];
  vi.stubGlobal('Audio', FakeAudio);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('module initialisation', () => {
  it('loads voices and registers onvoiceschanged when speechSynthesis exists', async () => {
    const synth = createSpeechSynthesis([]);
    const tts = await loadWithWindow(synth);

    expect(synth.getVoices).toHaveBeenCalledTimes(1);
    expect(typeof synth.onvoiceschanged).toBe('function');

    synth.voices = [{ name: 'Xiaoxiao', lang: 'zh-CN' }];
    synth.onvoiceschanged!();
    synth.getVoices.mockClear();
    expect(tts.getChineseVoice()).toEqual({ name: 'Xiaoxiao', lang: 'zh-CN' });
    expect(synth.getVoices).not.toHaveBeenCalled();
  });

  it('skips setup when window has no speechSynthesis', async () => {
    const tts = await loadWithWindow(null);
    expect(tts.getChineseVoice()).toBeNull();
  });
});

describe('getChineseVoice', () => {
  it('returns null without window', async () => {
    const tts = await import('./tts.service');
    expect(tts.getChineseVoice()).toBeNull();
  });

  it('queries voices lazily when cache is empty and returns null without zh voices', async () => {
    const synth = createSpeechSynthesis([{ name: 'English', lang: 'en-US' }]);
    const tts = await loadWithWindow(synth);
    expect(tts.getChineseVoice()).toBeNull();
  });

  it('falls back to the first zh voice', async () => {
    const synth = createSpeechSynthesis([]);
    const tts = await loadWithWindow(synth);
    synth.voices = [
      { name: 'Basic', lang: 'zh_CN' },
      { name: 'Other', lang: 'zh-TW' },
    ];
    expect(tts.getChineseVoice()).toEqual({ name: 'Basic', lang: 'zh_CN' });
  });

  it.each(['Microsoft Natural', 'Xiaoxiao', 'Google 普通话', 'Tingting', 'Chinese Voice'])(
    'prefers voice named %s',
    async (name) => {
      const synth = createSpeechSynthesis([]);
      const tts = await loadWithWindow(synth);
      synth.voices = [
        { name: 'Plain', lang: 'zh-CN' },
        { name, lang: 'zh-HK' },
      ];
      expect(tts.getChineseVoice()).toEqual({ name, lang: 'zh-HK' });
    }
  );
});

describe('playChineseAudio – online engine', () => {
  it('returns false for blank text', async () => {
    const tts = await import('./tts.service');
    await expect(tts.playChineseAudio('   ')).resolves.toBe(false);
    expect(FakeAudio.instances).toHaveLength(0);
  });

  it('plays via /api/tts and resolves true on end (no window)', async () => {
    const tts = await import('./tts.service');
    const onStart = vi.fn();
    const onEnd = vi.fn();

    const promise = tts.playChineseAudio(' 你好 ', { onStart, onEnd, rate: 1.1 });
    const audio = FakeAudio.instances[0];
    expect(audio.src).toBe(`/api/tts?text=${encodeURIComponent('你好')}`);
    expect(audio.playbackRate).toBe(1.1);

    audio.onplay!();
    audio.onended!();
    await expect(promise).resolves.toBe(true);
    expect(onStart).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
  });

  it('works without callbacks and with play returning undefined', async () => {
    FakeAudio.playResult = () => undefined;
    const tts = await loadWithWindow(createSpeechSynthesis(), {});

    const promise = tts.playChineseAudio('好');
    const audio = FakeAudio.instances[0];
    expect(audio.playbackRate).toBe(0.85);
    audio.onplay!();
    audio.onended!();
    await expect(promise).resolves.toBe(true);
  });

  it('stopChineseAudio pauses the current audio and cancels speech', async () => {
    const synth = createSpeechSynthesis();
    const tts = await loadWithWindow(synth, { hsk_tts_engine: 'online' });

    void tts.playChineseAudio('好');
    const audio = FakeAudio.instances[0];
    synth.cancel.mockClear();

    tts.stopChineseAudio();
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.currentTime).toBe(0);
    expect(synth.cancel).toHaveBeenCalledTimes(1);

    tts.stopChineseAudio();
    expect(audio.pause).toHaveBeenCalledTimes(1);
  });

  it('stopChineseAudio is safe without window or audio', async () => {
    const tts = await import('./tts.service');
    expect(() => tts.stopChineseAudio()).not.toThrow();
  });

  it('falls back to browser TTS on audio error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const synth = createSpeechSynthesis();
    const tts = await loadWithWindow(synth);

    const promise = tts.playChineseAudio('好');
    FakeAudio.instances[0].onerror!(new Error('404'));
    expect(warn).toHaveBeenCalled();
    expect(synth.speak).toHaveBeenCalledTimes(1);

    FakeUtterance.instances[0].onend!();
    await expect(promise).resolves.toBe(true);
  });

  it('falls back to browser TTS when play() rejects', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    FakeAudio.playResult = () => Promise.reject(new Error('autoplay'));
    const synth = createSpeechSynthesis();
    const tts = await loadWithWindow(synth);

    const promise = tts.playChineseAudio('好');
    await flush();
    expect(warn).toHaveBeenCalledWith(
      'Audio play was interrupted or blocked by browser autoplay policy:',
      expect.any(Error)
    );
    FakeUtterance.instances[0].onend!();
    await expect(promise).resolves.toBe(true);
  });

  it('falls back to browser TTS when Audio construction throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    FakeAudio.throwOnCreate = true;
    const onError = vi.fn();
    const tts = await import('./tts.service');

    await expect(tts.playChineseAudio('好', { onError })).resolves.toBe(false);
    expect(error).toHaveBeenCalledWith('Error creating audio element:', expect.any(Error));
    expect(onError).toHaveBeenCalled();
  });
});

describe('playChineseAudio – browser engine', () => {
  it('returns false and calls onError without window', async () => {
    const tts = await import('./tts.service');
    const onError = vi.fn();
    await expect(tts.playChineseAudio('好', { engine: 'browser', onError })).resolves.toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  it('returns false without speechSynthesis and no onError callback', async () => {
    const tts = await loadWithWindow(null);
    await expect(tts.playChineseAudio('好', { engine: 'browser' })).resolves.toBe(false);
  });

  it('speaks with chosen voice, resumes when paused, and resolves on end', async () => {
    const synth = createSpeechSynthesis([{ name: 'Tingting', lang: 'zh-CN' }]);
    synth.paused = true;
    const tts = await loadWithWindow(synth, { hsk_tts_engine: 'browser' });
    const onStart = vi.fn();
    const onEnd = vi.fn();

    const promise = tts.playChineseAudio('你好', { onStart, onEnd, pitch: 1.1, rate: 0.9 });
    expect(FakeAudio.instances).toHaveLength(0);
    expect(synth.resume).toHaveBeenCalled();
    const utterance = FakeUtterance.instances[0];
    expect(utterance).toMatchObject({
      text: '你好',
      lang: 'zh-CN',
      rate: 0.9,
      pitch: 1.1,
      voice: { name: 'Tingting', lang: 'zh-CN' },
    });
    expect(synth.speak).toHaveBeenCalledWith(utterance);

    utterance.onstart!();
    utterance.onend!();
    await expect(promise).resolves.toBe(true);
    expect(onStart).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
  });

  it('works without voice and without callbacks', async () => {
    const synth = createSpeechSynthesis([]);
    const tts = await loadWithWindow(synth);

    const promise = tts.playChineseAudio('好', { engine: 'browser' });
    const utterance = FakeUtterance.instances[0];
    expect(utterance.voice).toBeNull();
    expect(utterance.pitch).toBe(1);
    expect(synth.resume).not.toHaveBeenCalled();
    utterance.onstart!();
    utterance.onend!();
    await expect(promise).resolves.toBe(true);
  });

  it('resolves false silently on canceled error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const synth = createSpeechSynthesis();
    const tts = await loadWithWindow(synth);
    const onError = vi.fn();

    const promise = tts.playChineseAudio('好', { engine: 'browser', onError });
    FakeUtterance.instances[0].onerror!({ error: 'canceled' });
    await expect(promise).resolves.toBe(false);
    expect(onError).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('reports non-cancel utterance errors', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const synth = createSpeechSynthesis();
    const tts = await loadWithWindow(synth);
    const onError = vi.fn();

    const promise = tts.playChineseAudio('好', { engine: 'browser', onError });
    FakeUtterance.instances[0].onerror!({ error: 'network' });
    await expect(promise).resolves.toBe(false);
    expect(onError).toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();

    const second = tts.playChineseAudio('好', { engine: 'browser' });
    FakeUtterance.instances[1].onerror!({ error: 'network' });
    await expect(second).resolves.toBe(false);
  });

  it('handles exceptions thrown by speechSynthesis', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const synth = createSpeechSynthesis();
    synth.speak.mockImplementation(() => {
      throw new Error('speak failed');
    });
    const tts = await loadWithWindow(synth);
    const onError = vi.fn();

    await expect(tts.playChineseAudio('好', { engine: 'browser', onError })).resolves.toBe(false);
    expect(onError).toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('Browser TTS failed:', expect.any(Error));

    await expect(tts.playChineseAudio('好', { engine: 'browser' })).resolves.toBe(false);
  });
});
