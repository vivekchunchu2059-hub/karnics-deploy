import { DISTRIBUTION_BUILD_STAMP } from '../generated/buildStamp';
import log from './logger';

const STORAGE_KEY = '__jewellery_dist_build_stamp__';

/**
 * When the app is built for distribution (exe/zip), prebuild-dist sets a unique
 * DISTRIBUTION_BUILD_STAMP. If it changed since last visit, clear local + session
 * storage so the new package does not reuse old login/session from localhost.
 */
export function clearClientStorageIfNewDistributionBuild(): void {
  if (typeof window === 'undefined') return;

  const stamp = (DISTRIBUTION_BUILD_STAMP || '').trim();
  if (!stamp) return;

  try {
    const prev = localStorage.getItem(STORAGE_KEY);
    if (prev === stamp) return;

    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem(STORAGE_KEY, stamp);
  } catch (e) {
    log.error('Failed to reset client storage for new distribution build:', e);
    throw e;
  }
}
