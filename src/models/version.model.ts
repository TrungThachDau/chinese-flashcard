export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';
export const COMMIT_HASH = process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || '';
export const COMMIT_DATE = process.env.NEXT_PUBLIC_GIT_COMMIT_DATE || '';
export const GITHUB_REPO = 'TrungThachDau/chinese-flashcard';
export const COMMIT_URL = COMMIT_HASH
  ? `https://github.com/${GITHUB_REPO}/commit/${COMMIT_HASH}`
  : `https://github.com/${GITHUB_REPO}`;

