export interface UserSettings {
  user_name: string;
  daily_limit: number;
  speech_rate: number;
  audio_engine: 'online' | 'browser';
  auto_play_audio: boolean;
  has_onboarded: boolean;
  hsk_level: number;
  fsrs_retention?: number;
}

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  email?: string | null;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  user_name: 'Học viên',
  daily_limit: 15,
  speech_rate: 0.85,
  audio_engine: 'online',
  auto_play_audio: false,
  has_onboarded: false,
  hsk_level: 1,
  fsrs_retention: 0.9,
};

