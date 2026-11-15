import { CharDetail } from '@/models';
import {
  findCharDetail,
  findAllCharDetails,
} from '@/repositories/sqlite/character.repository';
import { cacheLife } from 'next/cache';

export async function getCharDetail(char: string): Promise<CharDetail | null> {
  'use cache';
  cacheLife('max');

  return findCharDetail(char);
}

export function getAllCharDetails(): Record<string, CharDetail> {
  return findAllCharDetails();
}

