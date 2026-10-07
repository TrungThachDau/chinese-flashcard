'use client';

let currentAudio: HTMLAudioElement | null = null;
let voicesLoaded = false;
let availableVoices: SpeechSynthesisVoice[] = [];

// Initialize Web Speech API voices if in browser
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
      voicesLoaded = true;
    }
  };

  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function getChineseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
  const zhVoices = voices.filter(
    (v) => v.lang === 'zh-CN' || v.lang === 'zh_CN' || v.lang.startsWith('zh')
  );

  if (zhVoices.length === 0) return null;

  const preferred = zhVoices.find(
    (v) =>
      v.name.includes('Natural') ||
      v.name.includes('Xiaoxiao') ||
      v.name.includes('Google') ||
      v.name.includes('Tingting') ||
      v.name.includes('Chinese')
  );

  return preferred || zhVoices[0];
}

export interface PlayAudioOptions {
  rate?: number; // 0.7 - 1.2, default 0.85
  pitch?: number; // 0.9 - 1.1, default 1.0
  engine?: 'auto' | 'online' | 'browser';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

/**
 * Plays Chinese audio with automatic fallback:
 * 1. Primary: High-fidelity natural Mandarin pronunciation via cached /api/tts endpoint
 * 2. Secondary / Option: Browser Web Speech API SpeechSynthesis
 */
export function playChineseAudio(text: string, options: PlayAudioOptions = {}): Promise<boolean> {
  const cleanText = text.trim();
  if (!cleanText) return Promise.resolve(false);

  // Stop any currently playing audio
  stopChineseAudio();

  const engine =
    options.engine ||
    (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
      ? window.localStorage.getItem('hsk_tts_engine') || 'auto'
      : 'auto');
  const speechRate = options.rate ?? 0.85;

  // Function to play via Online Audio (HTML5 Audio)
  const playViaOnlineAudio = (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}`;
        const audio = new Audio(audioUrl);
        currentAudio = audio;
        audio.playbackRate = speechRate;

        audio.onplay = () => {
          options.onStart?.();
        };

        audio.onended = () => {
          currentAudio = null;
          options.onEnd?.();
          resolve(true);
        };

        audio.onerror = (e) => {
          console.warn('Online audio playback failed, attempting browser TTS fallback...', e);
          currentAudio = null;
          // Fallback to browser TTS if online audio fails
          playViaBrowserTTS().then(resolve);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio play was interrupted or blocked by browser autoplay policy:', err);
            // Fallback to browser TTS
            playViaBrowserTTS().then(resolve);
          });
        }
      } catch (err) {
        console.error('Error creating audio element:', err);
        playViaBrowserTTS().then(resolve);
      }
    });
  };

  // Function to play via Browser SpeechSynthesis
  const playViaBrowserTTS = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        options.onError?.();
        resolve(false);
        return;
      }

      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'zh-CN';
        utterance.rate = speechRate;
        utterance.pitch = options.pitch ?? 1.0;

        const voice = getChineseVoice();
        if (voice) {
          utterance.voice = voice;
        }

        utterance.onstart = () => {
          options.onStart?.();
        };

        utterance.onend = () => {
          options.onEnd?.();
          resolve(true);
        };

        utterance.onerror = (e) => {
          if (e.error !== 'canceled') {
            console.warn('SpeechSynthesis utterance error:', e);
            options.onError?.();
          }
          resolve(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Browser TTS failed:', err);
        options.onError?.();
        resolve(false);
      }
    });
  };

  if (engine === 'browser') {
    return playViaBrowserTTS();
  }

  // By default (auto / online): use natural high quality online Mandarin audio
  return playViaOnlineAudio();
}

export function stopChineseAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
