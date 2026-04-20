/**
 * CacheService.gs — Server-side sheet data caching via CacheService
 *
 * Wraps raw sheet reads with a 6-hour CacheService layer (chunked at 90 KB
 * to stay within the 100 KB per-entry limit).  Every write operation must
 * call clearSheetCache() for the affected sheet so stale data is never served.
 */

const SHEET_CACHE_TTL = 21600; // 6 hours in seconds
const CACHE_CHUNK_SIZE = 90000; // 90 KB — safely under the 100 KB limit

/**
 * Return raw sheet values, reading from CacheService when possible.
 * @param {string} sheetName
 * @returns {Array[][]}
 */
function getCachedSheetData(sheetName) {
  const cache = CacheService.getScriptCache();
  const key = 'hs_sheet_' + sheetName;
  const chunksKey = key + '_chunks';

  const numChunksStr = cache.get(chunksKey);
  if (numChunksStr) {
    const numChunks = parseInt(numChunksStr, 10);
    let dataStr = '';
    let invalid = false;
    for (let i = 0; i < numChunks; i++) {
      const chunk = cache.get(key + '_' + i);
      if (!chunk) { invalid = true; break; }
      dataStr += chunk;
    }
    if (!invalid) {
      try { return JSON.parse(dataStr); } catch (e) {}
    }
  }

  // Cache miss — read from sheet and populate cache
  const sheet = getSS().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();

  try {
    const dataStr = JSON.stringify(data);
    const numChunks = Math.ceil(dataStr.length / CACHE_CHUNK_SIZE);
    cache.put(chunksKey, numChunks.toString(), SHEET_CACHE_TTL);
    for (let i = 0; i < numChunks; i++) {
      cache.put(
        key + '_' + i,
        dataStr.substring(i * CACHE_CHUNK_SIZE, (i + 1) * CACHE_CHUNK_SIZE),
        SHEET_CACHE_TTL
      );
    }
  } catch (e) {
    Logger.log('CacheService write error: ' + e.message);
  }

  return data;
}

/**
 * Invalidate the cache for a given sheet.
 * Call this after any write (append, setValue, etc.) to that sheet.
 * @param {string} sheetName
 */
function clearSheetCache(sheetName) {
  try {
    CacheService.getScriptCache().remove('hs_sheet_' + sheetName + '_chunks');
  } catch (e) {
    Logger.log('CacheService clear error: ' + e.message);
  }
}
