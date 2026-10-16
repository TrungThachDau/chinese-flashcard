import { StudyStats } from '@/models';
import { computeSqliteStudyStats } from '@/repositories/sqlite/stats.repository';
import { isSupabaseConfigured } from '@/repositories/supabase/server.client';
import { loadSupabaseAppData } from './app-data.service';

export function getStudyStats(tzOffsetMinutes?: number): StudyStats {
  return computeSqliteStudyStats(tzOffsetMinutes);
}

export async function fetchStudyStats(tzOffsetMinutes?: number): Promise<StudyStats> {
  if (isSupabaseConfigured()) {
    try {
      const sbData = await loadSupabaseAppData();
      if (sbData?.studyStats) {
        return sbData.studyStats;
      }
    } catch (err) {
      console.warn('Supabase stats fetch error, falling back to SQLite:', err);
    }
  }

  return computeSqliteStudyStats(tzOffsetMinutes);
}

