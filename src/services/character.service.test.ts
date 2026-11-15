// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import { cacheLife } from 'next/cache';
import { getAllCharDetails, getCharDetail } from '@/services/character.service';
import {
  findAllCharDetails,
  findCharDetail,
} from '@/repositories/sqlite/character.repository';

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
}));

vi.mock('@/repositories/sqlite/character.repository', () => ({
  findCharDetail: vi.fn(),
  findAllCharDetails: vi.fn(),
}));

describe('character service', () => {
  it('returns a character detail and sets cache life', async () => {
    const detail = { char: '你' } as never;
    vi.mocked(findCharDetail).mockReturnValue(detail);
    await expect(getCharDetail('你')).resolves.toBe(detail);
    expect(findCharDetail).toHaveBeenCalledWith('你');
    expect(cacheLife).toHaveBeenCalledWith('max');
  });

  it('returns null when a character is not found', async () => {
    vi.mocked(findCharDetail).mockReturnValue(null);
    await expect(getCharDetail('x')).resolves.toBeNull();
  });

  it('returns all character details', () => {
    const all = { 你: { char: '你' } } as never;
    vi.mocked(findAllCharDetails).mockReturnValue(all);
    expect(getAllCharDetails()).toBe(all);
  });
});
