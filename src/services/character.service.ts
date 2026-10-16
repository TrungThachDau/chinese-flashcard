import { CharDetail } from '@/models';
import {
  findCharDetail,
  findAllCharDetails,
} from '@/repositories/sqlite/character.repository';

export function getCharDetail(char: string): CharDetail | null {
  return findCharDetail(char);
}

export function getAllCharDetails(): Record<string, CharDetail> {
  return findAllCharDetails();
}

