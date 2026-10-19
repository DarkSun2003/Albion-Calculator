import { getItemIdentifier } from '../utils/albionMath';
import { CRAFTABLE_ITEMS } from '../utils/craftingMath';

const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const hasRemoteBackendUrl = Boolean(import.meta.env.VITE_API_URL);

const API_BASE = !isLocalHost && hasRemoteBackendUrl
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : 'http://127.0.0.1:8000/api';

// If running on a remote HTTPS live server (e.g. Vercel) without VITE_API_URL configured,
// skip attempting http://127.0.0.1:8000 (which would fail due to mixed content / no local server)
// and go straight to the Direct-to-AODP HTTPS Browser Engine.
const shouldSkipLocalBackendOnHttps =
  typeof window !== 'undefined' &&
  !isLocalHost &&
  !hasRemoteBackendUrl &&
  window.location.protocol === 'https:';

let _backendOfflineUntil = 0;
let _originClockSyncPromise = null;

const AODP_PRICE_SERVERS = {
  west: 'https://west.albion-online-data.com/api/v2/stats/prices/',
  americas: 'https://west.albion-online-data.com/api/v2/stats/prices/',
  east: 'https://east.albion-online-data.com/api/v2/stats/prices/',
  asia: 'https://east.albion-online-data.com/api/v2/stats/prices/',
  europe: 'https://europe.albion-online-data.com/api/v2/stats/prices/',
};

const AODP_HISTORY_SERVERS = {
  west: 'https://west.albion-online-data.com/api/v2/stats/history/',
  americas: 'https://west.albion-online-data.com/api/v2/stats/history/',
  east: 'https://east.albion-online-data.com/api/v2/stats/history/',
  asia: 'https://east.albion-online-data.com/api/v2/stats/history/',
  europe: 'https://europe.albion-online-data.com/api/v2/stats/history/',
};

const ROYAL_CITIES = ['Martlock', 'Fort Sterling', 'Thetford', 'Lymhurst', 'Bridgewatch', 'Caerleon'];

const ITEM_QUALITIES_META = {
  1: { name: 'Normal', color: 'slate', label: 'Normal (Q1)' },
  2: { name: 'Good', color: 'emerald', label: 'Good (Q2)' },
  3: { name: 'Outstanding', color: 'sky', label: 'Outstanding (Q3)' },
  4: { name: 'Excellent', color: 'purple', label: 'Excellent (Q4)' },
  5: { name: 'Masterpiece', color: 'amber', label: 'Masterpiece (Q5)' },
};

const ELIGIBLE_BM_ITEMS = (CRAFTABLE_ITEMS || []).filter(
  (it) =>
    !String(it.category || '').includes('tool') &&
    !String(it.category || '').includes('furniture') &&
    !String(it.category || '').includes('mount') &&
    !String(it.id || '').includes('bed') &&
    !String(it.id || '').includes('chest') &&
    !String(it.id || '').includes('table')
);

export function syncClientClock(data) {
  if (typeof window !== 'undefined' && data?.server_utc_now) {
    const serverMs = new Date(data.server_utc_now).getTime();
    if (!isNaN(serverMs)) {
      window.__INTERNET_CLOCK_OFFSET_MS__ = serverMs - Date.now();
    }
  }
  return data;
}

export function getCalibratedNowMs() {
  if (typeof window !== 'undefined' && typeof window.__INTERNET_CLOCK_OFFSET_MS__ === 'number') {
    return Date.now() + window.__INTERNET_CLOCK_OFFSET_MS__;
  }
  return Date.now();
}

/**
 * Calibrates the browser clock on the live server using the same-origin HTTP Date header
 * (e.g. from Vercel/Cloudflare edge servers) and/or newest valid AODP record timestamps.
 */
async function ensureBrowserClockCalibrated(aodpRecords = null) {
  if (typeof window === 'undefined') return;

  // 1. Try same-origin HEAD request once to read the server's atomic UTC Date header
  if (typeof window.__INTERNET_CLOCK_OFFSET_MS__ !== 'number' && !_originClockSyncPromise) {
    _originClockSyncPromise = (async () => {
      try {
        const res = await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
        const dateHeader = res.headers.get('date') || res.headers.get('Date');
        if (dateHeader) {
          const serverMs = new Date(dateHeader).getTime();
          if (!isNaN(serverMs) && serverMs > 1700000000000) {
            window.__INTERNET_CLOCK_OFFSET_MS__ = serverMs - Date.now();
          }
        }
      } catch {
        // Ignore if offline or blocked
      }
    })();
    await _originClockSyncPromise;
  }

  // 2. Fallback / sanity check against newest AODP market timestamp in case local PC clock is months ahead
  if (Array.isArray(aodpRecords) && aodpRecords.length > 0) {
    let newestMs = 0;
    for (const r of aodpRecords) {
      for (const field of ['sell_price_min_date', 'buy_price_max_date']) {
        const raw = r?.[field];
        if (!raw || String(raw).startsWith('0001-01-01')) continue;
        const clean = String(raw).endsWith('Z') ? String(raw) : `${raw}Z`;
        const ms = new Date(clean).getTime();
        if (!isNaN(ms) && ms > newestMs && ms < Date.now() + 86400000) {
          newestMs = ms;
        }
      }
    }
    if (newestMs > 1700000000000) {
      const currentCalibrated = getCalibratedNowMs();
      // If calibrated clock is still > 6 hours ahead of the freshest market order in a live batch,
      // or if calibrated clock is behind the freshest timestamp, anchor to newestMs + 2 mins
      if (currentCalibrated - newestMs > 6 * 3600 * 1000 || currentCalibrated < newestMs) {
        window.__INTERNET_CLOCK_OFFSET_MS__ = (newestMs + 2 * 60 * 1000) - Date.now();
      }
    }
  }
}

function parseAodpDateBrowser(dateStr) {
  if (!dateStr || String(dateStr).startsWith('0001-01-01')) {
    return { formatted: null, ageHours: 999999.0 };
  }
  const clean = String(dateStr).endsWith('Z') ? String(dateStr) : `${dateStr}Z`;
  const dtMs = new Date(clean).getTime();
  if (isNaN(dtMs)) {
    return { formatted: null, ageHours: 999999.0 };
  }
  const nowMs = getCalibratedNowMs();
  const ageHours = Math.max(0, (nowMs - dtMs) / (1000 * 3600));
  return {
    formatted: clean,
    ageHours: Math.round(ageHours * 100) / 100,
  };
}

async function fetchBackendJson(path, options = {}, timeoutMs = 2800) {
  if (shouldSkipLocalBackendOnHttps) {
    throw new Error('Skipping local HTTP backend on HTTPS live deployment');
  }
  if (!isLocalHost && Date.now() < _backendOfflineUntil) {
    throw new Error('Remote backend temporarily marked offline');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    if (!isLocalHost) {
      _backendOfflineUntil = Date.now() + 45000;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchAodpHistoryBrowser(itemIds, server = 'europe', locations = null, qualities = '1') {
  const validIds = (itemIds || []).filter(Boolean);
  if (!validIds.length) return {};

  const serverKey = String(server || 'europe').toLowerCase();
  const baseUrl = AODP_HISTORY_SERVERS[serverKey] || AODP_HISTORY_SERVERS.europe;
  const locList = locations && locations.length ? locations : ROYAL_CITIES;
  const params = new URLSearchParams({
    locations: locList.join(','),
    'time-scale': '24',
  });
  if (qualities) params.set('qualities', String(qualities));

  const url = `${baseUrl}${validIds.join(',')}.json?${params.toString()}`;
  const historyMap = {};

  try {
    const res = await fetch(url);
    if (!res.ok) return historyMap;
    const records = await res.json();
    if (!Array.isArray(records)) return historyMap;

    for (const entry of records) {
      const iid = entry.item_id;
      const loc = entry.location;
      const qual = Number(entry.quality || 1);
      const dataPoints = entry.data || [];
      if (!iid || !loc || !dataPoints.length) continue;

      const recent = dataPoints.slice(-3);
      const totalItems = recent.reduce((acc, p) => acc + Number(p.item_count || 0), 0);
      if (totalItems > 0) {
        const weightedSum = recent.reduce(
          (acc, p) => acc + Number(p.avg_price || 0) * Number(p.item_count || 0),
          0
        );
        const avgPrice = Math.round(weightedSum / totalItems);
        const dailyVol = Math.round(totalItems / recent.length);
        historyMap[`${iid}:${loc}:${qual}`] = {
          avg_price_24h: avgPrice,
          daily_volume: dailyVol,
        };
        if (qual === 1 || !historyMap[`${iid}:${loc}`]) {
          historyMap[`${iid}:${loc}`] = {
            avg_price_24h: avgPrice,
            daily_volume: dailyVol,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Browser AODP history fetch warning:', err);
  }

  return historyMap;
}

async function fetchAodpPricesBrowser(
  itemIds,
  {
    server = 'europe',
    locations = null,
    qualities = '1',
    maxAgeHours = 48.0,
    includeHistory = true,
  } = {}
) {
  const validIds = Array.from(new Set((itemIds || []).filter(Boolean)));
  if (!validIds.length) return {};

  const serverKey = String(server || 'europe').toLowerCase();
  const baseUrl = AODP_PRICE_SERVERS[serverKey] || AODP_PRICE_SERVERS.europe;

  const baseLocs = [...ROYAL_CITIES, 'Brecilien', 'Black Market'];
  if (Array.isArray(locations)) {
    for (const loc of locations) {
      if (loc && !baseLocs.includes(loc)) baseLocs.push(loc);
    }
  }

  const params = new URLSearchParams({
    locations: baseLocs.join(','),
  });
  if (qualities) params.set('qualities', String(qualities));

  const url = `${baseUrl}${validIds.join(',')}.json?${params.toString()}`;
  const results = {};

  const [priceRes, historyData] = await Promise.all([
    fetch(url).catch(() => null),
    includeHistory
      ? fetchAodpHistoryBrowser(validIds, serverKey, baseLocs, qualities)
      : Promise.resolve({}),
  ]);

  let data = [];
  if (priceRes && priceRes.ok) {
    try {
      data = await priceRes.json();
    } catch {
      data = [];
    }
  }

  await ensureBrowserClockCalibrated(data);

  for (const record of data) {
    const itemId = record.item_id;
    const city = record.city;
    if (!itemId || !city) continue;

    let sellMin = Number(record.sell_price_min || 0);
    let buyMax = Number(record.buy_price_max || 0);
    const { formatted: sellDate, ageHours: sellAge } = parseAodpDateBrowser(record.sell_price_min_date);
    const { formatted: buyDate, ageHours: buyAge } = parseAodpDateBrowser(record.buy_price_max_date);

    if (!sellDate || sellAge > maxAgeHours) sellMin = 0;
    if (!buyDate || buyAge > maxAgeHours) buyMax = 0;

    if (sellMin === 0 && buyMax === 0) continue;

    const key = `${itemId}:${city}`;
    const existing = results[key];

    if (!existing) {
      results[key] = {
        item_id: itemId,
        city,
        quality: Number(record.quality || 1),
        sell_price_min: sellMin,
        sell_price_max: sellMin > 0 ? Number(record.sell_price_max || 0) : 0,
        buy_price_min: buyMax > 0 ? Number(record.buy_price_min || 0) : 0,
        buy_price_max: buyMax,
        updated_at: sellDate || buyDate,
        age_hours: sellMin > 0 ? sellAge : buyAge,
        buy_updated_at: buyDate,
        buy_age_hours: buyAge,
        source: 'aodp_live',
      };
    } else {
      if (sellMin > 0) {
        const existingAge = existing.age_hours ?? 999999.0;
        const isSignificantlyFresher = sellAge + 3.0 < existingAge;
        const isSimilarAgeAndCheaper =
          Math.abs(sellAge - existingAge) <= 3.0 &&
          (existing.sell_price_min === 0 || sellMin < existing.sell_price_min);

        if (existing.sell_price_min === 0 || isSignificantlyFresher || isSimilarAgeAndCheaper) {
          existing.sell_price_min = sellMin;
          existing.sell_price_max = Number(record.sell_price_max || 0);
          existing.updated_at = sellDate;
          existing.age_hours = sellAge;
          existing.quality = Number(record.quality || 1);
        }
      }
      if (buyMax > 0) {
        const existingBuyAge = existing.buy_age_hours ?? 999999.0;
        const isBuyFresher = buyAge + 3.0 < existingBuyAge;
        const isBuySimilarAndHigher =
          Math.abs(buyAge - existingBuyAge) <= 3.0 && buyMax > existing.buy_price_max;

        if (existing.buy_price_max === 0 || isBuyFresher || isBuySimilarAndHigher) {
          existing.buy_price_max = buyMax;
          existing.buy_price_min = Number(record.buy_price_min || 0);
          existing.buy_updated_at = buyDate;
          existing.buy_age_hours = buyAge;
        }
      }
    }
  }

  // Cross-verify against 24h historical averages
  if (includeHistory && historyData) {
    for (const [histKey, histVal] of Object.entries(historyData)) {
      if (histKey.split(':').length !== 2) continue;
      const avg24h = histVal.avg_price_24h || 0;
      const vol24h = histVal.daily_volume || 0;
      if (avg24h <= 0) continue;

      const rec = results[histKey];
      if (rec) {
        rec.avg_price_24h = avg24h;
        rec.daily_volume = vol24h;
        const sellMin = rec.sell_price_min || 0;
        if (sellMin > 0 && (sellMin > avg24h * 3.0 || sellMin < avg24h * 0.25)) {
          rec.outlier_filtered = sellMin;
          rec.sell_price_min = avg24h;
          rec.source = 'aodp_24h_avg_outlier_guard';
        } else if (sellMin === 0) {
          rec.sell_price_min = avg24h;
          rec.source = 'aodp_24h_avg_fallback';
        }
      } else {
        const [iid, loc] = histKey.split(':');
        results[histKey] = {
          item_id: iid,
          city: loc,
          quality: 1,
          sell_price_min: avg24h,
          sell_price_max: avg24h,
          buy_price_min: 0,
          buy_price_max: 0,
          avg_price_24h: avg24h,
          daily_volume: vol24h,
          updated_at: null,
          age_hours: 12.0,
          source: 'aodp_24h_avg_fallback',
        };
      }
    }
  }

  return results;
}

export function formatCalibratedStatusAge(ageHours) {
  if (ageHours === null || ageHours === undefined || Number.isNaN(Number(ageHours)) || Number(ageHours) >= 9000) {
    return '';
  }
  const hrs = Math.max(0, Number(ageHours));
  if (hrs <= 0.04) return ' • 🟢 Updated just now';
  if (hrs < 1) {
    const mins = Math.max(1, Math.round(hrs * 60));
    return ` • 🟢 Updated ${mins}m ago`;
  }
  if (hrs < 24) {
    const cleanHrs = (Math.round(hrs * 10) / 10).toString();
    return ` • 🟡 Updated ${cleanHrs}h ago`;
  }
  const days = Math.round(hrs / 24);
  return ` • 🔴 Updated ${days}d ago`;
}

export async function getRefiningConstants() {
  try {
    return await fetchBackendJson('/refining/constants/');
  } catch (err) {
    console.warn('Backend unavailable, using fallback constants:', err);
    return null;
  }
}

export async function calculateRefiningApi(payload) {
  try {
    return await fetchBackendJson('/refining/calculate/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return null;
  }
}

export async function fetchLivePricesApi(payload) {
  try {
    const data = await fetchBackendJson('/refining/prices/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return syncClientClock(data);
  } catch {
    // Direct-to-AODP HTTPS Browser Fallback for Live Server
    try {
      const resourceType = payload?.resource_type || 'hide';
      const tier = Number(payload?.tier || 4);
      const enchantment = Number(payload?.enchantment || 0);
      const server = payload?.server || 'europe';
      const selectedCity = payload?.city || 'Martlock';

      const rawId = getItemIdentifier(resourceType, tier, enchantment, false);
      const refinedId = getItemIdentifier(resourceType, tier, enchantment, true);
      const prevEnch = tier - 1 >= 4 ? enchantment : 0;
      const prevRefinedId =
        tier > 2 ? getItemIdentifier(resourceType, tier - 1, prevEnch, true) : null;

      const itemsToFetch = [rawId, refinedId, prevRefinedId].filter(Boolean);
      const priceData = await fetchAodpPricesBrowser(itemsToFetch, {
        server,
        locations: ROYAL_CITIES,
        qualities: '1',
        includeHistory: true,
      });

      const extractPrices = (itemId) => {
        if (!itemId) return null;
        const cityKey = `${itemId}:${selectedCity}`;
        const record = priceData[cityKey];
        if (record) {
          return {
            item_id: itemId,
            sell_min: record.sell_price_min || 0,
            sell_max: record.sell_price_max || 0,
            buy_min: record.buy_price_min || 0,
            buy_max: record.buy_price_max || 0,
            avg_price_24h: record.avg_price_24h || 0,
            daily_volume: record.daily_volume || 0,
            updated_at: record.updated_at || null,
            age_hours: record.age_hours ?? null,
            source: record.source || 'aodp_live',
            city: selectedCity,
          };
        }
        for (const [k, rec] of Object.entries(priceData)) {
          if (k.startsWith(`${itemId}:`) && (rec.sell_price_min || 0) > 0) {
            return {
              item_id: itemId,
              sell_min: rec.sell_price_min || 0,
              sell_max: rec.sell_price_max || 0,
              buy_min: rec.buy_price_min || 0,
              buy_max: rec.buy_price_max || 0,
              avg_price_24h: rec.avg_price_24h || 0,
              daily_volume: rec.daily_volume || 0,
              updated_at: rec.updated_at || null,
              age_hours: rec.age_hours ?? null,
              source: rec.source || 'aodp_live',
              city: rec.city,
            };
          }
        }
        return {
          item_id: itemId,
          sell_min: 0,
          sell_max: 0,
          buy_min: 0,
          buy_max: 0,
          updated_at: null,
          age_hours: null,
          city: selectedCity,
        };
      };

      const citiesData = {};
      for (const c of ROYAL_CITIES) {
        const rawRec = priceData[`${rawId}:${c}`];
        const refinedRec = priceData[`${refinedId}:${c}`];
        const prevRec = prevRefinedId ? priceData[`${prevRefinedId}:${c}`] : null;
        citiesData[c] = {
          raw_sell_min: rawRec?.sell_price_min || 0,
          raw_buy_max: rawRec?.buy_price_max || 0,
          raw_updated_at: rawRec?.updated_at || null,
          raw_age_hours: rawRec?.age_hours ?? null,
          refined_sell_min: refinedRec?.sell_price_min || 0,
          refined_buy_max: refinedRec?.buy_price_max || 0,
          refined_updated_at: refinedRec?.updated_at || null,
          refined_age_hours: refinedRec?.age_hours ?? null,
          prev_refined_sell_min: prevRec?.sell_price_min || 0,
          prev_refined_updated_at: prevRec?.updated_at || null,
          prev_refined_age_hours: prevRec?.age_hours ?? null,
        };
      }

      return {
        raw: extractPrices(rawId),
        refined: extractPrices(refinedId),
        prev_refined: extractPrices(prevRefinedId),
        raw_id: rawId,
        refined_id: refinedId,
        prev_refined_id: prevRefinedId,
        cities: citiesData,
        server,
        city: selectedCity,
        server_utc_now: new Date(getCalibratedNowMs()).toISOString(),
      };
    } catch (fallbackErr) {
      console.warn('Direct browser AODP fallback failed for refining:', fallbackErr);
      return null;
    }
  }
}

export async function calculateCraftingApi(payload) {
  try {
    return await fetchBackendJson('/crafting/calculate/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return null;
  }
}

export async function fetchCraftingPricesApi(payload) {
  try {
    const data = await fetchBackendJson('/crafting/prices/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return syncClientClock(data);
  } catch {
    // Direct-to-AODP HTTPS Browser Fallback for Crafting
    try {
      const itemId = payload?.item_id || 'bag';
      const tier = Number(payload?.tier || 4);
      const enchantment = Number(payload?.enchantment || 0);
      const server = payload?.server || 'europe';
      const selectedCity = payload?.city || 'Lymhurst';

      const itemDef =
        (CRAFTABLE_ITEMS || []).find((it) => it.id === itemId) || (CRAFTABLE_ITEMS || [])[0];
      if (!itemDef) return null;

      const baseItemId = itemDef.template.replace('{tier}', String(tier));
      const craftedAodpId =
        enchantment > 0 && tier >= 4 ? `${baseItemId}@${enchantment}` : baseItemId;

      let primaryMatId = (itemDef.primaryMatIcon || '').replace('{tier}', String(tier));
      if (enchantment > 0 && !primaryMatId.includes('STONE') && primaryMatId) {
        primaryMatId = `${primaryMatId}_LEVEL${enchantment}@${enchantment}`;
      }

      let secondaryMatId = null;
      if (itemDef.secondaryMatIcon) {
        const secId = itemDef.secondaryMatIcon.replace('{tier}', String(tier));
        secondaryMatId =
          enchantment > 0 && !secId.includes('STONE')
            ? `${secId}_LEVEL${enchantment}@${enchantment}`
            : secId;
      }

      let artifactId = null;
      if (itemDef.isArtifact && itemDef.artifactTemplate) {
        artifactId = itemDef.artifactTemplate.replace('{tier}', String(tier));
      }

      let journalEmptyId = null;
      let journalFullId = null;
      if (tier >= 4 && itemDef.journalTemplate) {
        journalEmptyId = itemDef.journalTemplate.replace('{tier}', String(tier));
        journalFullId = `${journalEmptyId}_FULL`;
      }

      const matIds = [
        primaryMatId,
        secondaryMatId,
        artifactId,
        journalEmptyId,
        journalFullId,
      ].filter(Boolean);

      const locList = [
        'Black Market',
        'Caerleon',
        'Martlock',
        'Lymhurst',
        'Fort Sterling',
        'Thetford',
        'Bridgewatch',
      ];
      const serverKey = String(server).toLowerCase();
      const baseApi = AODP_PRICE_SERVERS[serverKey] || AODP_PRICE_SERVERS.europe;
      const gearUrl = `${baseApi}${craftedAodpId}.json?locations=${locList.join(',')}&qualities=1,2,3,4,5`;

      const [matPriceData, gearRes, gearHistory] = await Promise.all([
        fetchAodpPricesBrowser(matIds, {
          server,
          locations: locList,
          qualities: '1',
          includeHistory: true,
        }),
        fetch(gearUrl).catch(() => null),
        fetchAodpHistoryBrowser([craftedAodpId], serverKey, locList, '1,2,3,4,5'),
      ]);

      let records = [];
      if (gearRes && gearRes.ok) {
        try {
          records = await gearRes.json();
        } catch {
          records = [];
        }
      }
      await ensureBrowserClockCalibrated(records);

      const getMatPrice = (matId) => {
        if (!matId) {
          return { sell_min: 0, updated_at: null, age_hours: null, city: selectedCity };
        }
        const rec = matPriceData[`${matId}:${selectedCity}`];
        if (rec && (rec.sell_price_min || 0) > 0) {
          return {
            sell_min: rec.sell_price_min,
            buy_max: rec.buy_price_max || 0,
            avg_price_24h: rec.avg_price_24h || 0,
            updated_at: rec.updated_at || null,
            age_hours: rec.age_hours ?? null,
            city: selectedCity,
            source: rec.source || 'aodp_live',
          };
        }
        for (const [k, fallbackRec] of Object.entries(matPriceData)) {
          if (k.startsWith(`${matId}:`) && (fallbackRec.sell_price_min || 0) > 0) {
            return {
              sell_min: fallbackRec.sell_price_min,
              buy_max: fallbackRec.buy_price_max || 0,
              avg_price_24h: fallbackRec.avg_price_24h || 0,
              updated_at: fallbackRec.updated_at || null,
              age_hours: fallbackRec.age_hours ?? null,
              city: fallbackRec.city || selectedCity,
              source: fallbackRec.source || 'aodp_live',
            };
          }
        }
        return { sell_min: 0, updated_at: null, age_hours: null, city: selectedCity };
      };

      const qualitiesDict = {
        1: { id: 1, name: 'Normal', label: 'Normal (Q1)', sell_min: 0, buy_max: 0, avg_price_24h: 0, daily_volume: 0, updated_at: null, age_hours: 999999.0, city: selectedCity },
        2: { id: 2, name: 'Good', label: 'Good (Q2)', sell_min: 0, buy_max: 0, avg_price_24h: 0, daily_volume: 0, updated_at: null, age_hours: 999999.0, city: selectedCity },
        3: { id: 3, name: 'Outstanding', label: 'Outstanding (Q3)', sell_min: 0, buy_max: 0, avg_price_24h: 0, daily_volume: 0, updated_at: null, age_hours: 999999.0, city: selectedCity },
        4: { id: 4, name: 'Excellent', label: 'Excellent (Q4)', sell_min: 0, buy_max: 0, avg_price_24h: 0, daily_volume: 0, updated_at: null, age_hours: 999999.0, city: selectedCity },
        5: { id: 5, name: 'Masterpiece', label: 'Masterpiece (Q5)', sell_min: 0, buy_max: 0, avg_price_24h: 0, daily_volume: 0, updated_at: null, age_hours: 999999.0, city: selectedCity },
      };

      for (const r of records) {
        if (r.item_id === craftedAodpId && r.city === selectedCity) {
          const q = Number(r.quality || 1);
          if (!qualitiesDict[q]) continue;

          let sellMin = Number(r.sell_price_min || 0);
          let buyMax = Number(r.buy_price_max || 0);
          const { formatted: uDate, ageHours: ageH } = parseAodpDateBrowser(r.sell_price_min_date);
          const { formatted: bDate, ageHours: bAgeH } = parseAodpDateBrowser(r.buy_price_max_date);

          if (!uDate) sellMin = 0;
          if (!bDate || bAgeH > 48.0) buyMax = 0;

          const hist = gearHistory[`${craftedAodpId}:${selectedCity}:${q}`] || {};
          const avg24h = hist.avg_price_24h || 0;
          const vol24h = hist.daily_volume || 0;

          if (avg24h > 0) {
            qualitiesDict[q].avg_price_24h = avg24h;
            qualitiesDict[q].daily_volume = vol24h;
            if (sellMin === 0 || ageH > 24.0 || sellMin > avg24h * 3.0 || sellMin < avg24h * 0.25) {
              sellMin = avg24h;
            }
          }

          if (sellMin > 0) {
            const existingAge = qualitiesDict[q].age_hours;
            const isFresher = ageH + 3.0 < existingAge;
            const isSimilarAndCheaper =
              Math.abs(ageH - existingAge) <= 3.0 &&
              (qualitiesDict[q].sell_min === 0 || sellMin < qualitiesDict[q].sell_min);
            if (qualitiesDict[q].sell_min === 0 || isFresher || isSimilarAndCheaper) {
              qualitiesDict[q].sell_min = sellMin;
              qualitiesDict[q].updated_at = uDate;
              qualitiesDict[q].age_hours = ageH;
              qualitiesDict[q].city = selectedCity;
            }
          }

          if (buyMax > qualitiesDict[q].buy_max) {
            qualitiesDict[q].buy_max = buyMax;
          }
        }
      }

      for (const r of records) {
        if (r.item_id === craftedAodpId) {
          const q = Number(r.quality || 1);
          if (!qualitiesDict[q]) continue;
          let sellMin = Number(r.sell_price_min || 0);
          const { formatted: uDate, ageHours: ageH } = parseAodpDateBrowser(r.sell_price_min_date);
          if (!uDate || ageH > 48.0) sellMin = 0;

          if (qualitiesDict[q].sell_min === 0 && sellMin > 0) {
            qualitiesDict[q].sell_min = sellMin;
            qualitiesDict[q].updated_at = uDate;
            qualitiesDict[q].age_hours = ageH;
            qualitiesDict[q].city = r.city;
          }
          if (qualitiesDict[q].buy_max === 0 && Number(r.buy_price_max || 0) > 0) {
            const { formatted: bDate, ageHours: bAgeH } = parseAodpDateBrowser(r.buy_price_max_date);
            if (bDate && bAgeH <= 48.0) {
              qualitiesDict[q].buy_max = Number(r.buy_price_max || 0);
            }
          }
        }
      }

      let defaultQ = 1;
      for (const candQ of [1, 2, 3, 4, 5]) {
        if (qualitiesDict[candQ].sell_min > 0) {
          defaultQ = candQ;
          break;
        }
      }

      return {
        crafted_item: {
          id: craftedAodpId,
          qualities: qualitiesDict,
          default_quality: defaultQ,
          sell_min: qualitiesDict[defaultQ].sell_min,
          avg_price_24h: qualitiesDict[defaultQ].avg_price_24h,
          updated_at: qualitiesDict[defaultQ].updated_at,
          age_hours: qualitiesDict[defaultQ].age_hours,
          city: qualitiesDict[defaultQ].city,
        },
        primary_mat: getMatPrice(primaryMatId),
        secondary_mat: secondaryMatId ? getMatPrice(secondaryMatId) : null,
        artifact: artifactId ? getMatPrice(artifactId) : null,
        journal_empty: journalEmptyId ? getMatPrice(journalEmptyId) : null,
        journal_full: journalFullId ? getMatPrice(journalFullId) : null,
        server,
        city: selectedCity,
        server_utc_now: new Date(getCalibratedNowMs()).toISOString(),
      };
    } catch (fallbackErr) {
      console.warn('Direct browser AODP fallback failed for crafting:', fallbackErr);
      return null;
    }
  }
}

export async function getFoodItemsApi() {
  try {
    return await fetchBackendJson('/food/items/');
  } catch {
    return null;
  }
}

export async function calculateFoodApi(payload) {
  try {
    return await fetchBackendJson('/food/calculate/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return null;
  }
}

export async function fetchFoodPricesApi(payload) {
  try {
    const data = await fetchBackendJson('/food/prices/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return syncClientClock(data);
  } catch {
    try {
      const itemId = payload?.item_id;
      const enchantment = Number(payload?.enchantment || 0);
      const ingredientIds = payload?.ingredient_ids || [];
      const server = payload?.server || 'europe';
      const selectedCity = payload?.city || 'Caerleon';
      if (!itemId) return null;

      const targetFoodId = enchantment > 0 ? `${itemId}@${enchantment}` : itemId;
      const itemsToFetch = [targetFoodId, ...ingredientIds];
      const priceData = await fetchAodpPricesBrowser(itemsToFetch, {
        server,
        locations: [selectedCity],
        qualities: '1',
        includeHistory: true,
      });

      const extractPrices = (iid) => {
        const rec = priceData[`${iid}:${selectedCity}`];
        if (rec) {
          return {
            item_id: iid,
            sell_min: rec.sell_price_min || 0,
            buy_max: rec.buy_price_max || 0,
            updated_at: rec.updated_at || null,
            age_hours: rec.age_hours ?? null,
            city: selectedCity,
          };
        }
        for (const [k, r] of Object.entries(priceData)) {
          if (k.startsWith(`${iid}:`) && (r.sell_price_min || 0) > 0) {
            return {
              item_id: iid,
              sell_min: r.sell_price_min || 0,
              buy_max: r.buy_price_max || 0,
              updated_at: r.updated_at || null,
              age_hours: r.age_hours ?? null,
              city: r.city,
            };
          }
        }
        return { item_id: iid, sell_min: 0, buy_max: 0, city: selectedCity };
      };

      const ingredientsRes = {};
      for (const ingId of ingredientIds) {
        ingredientsRes[ingId] = extractPrices(ingId);
      }

      return {
        food: extractPrices(targetFoodId),
        ingredients: ingredientsRes,
        server,
        city: selectedCity,
        server_utc_now: new Date(getCalibratedNowMs()).toISOString(),
      };
    } catch (fallbackErr) {
      console.warn('Direct browser AODP fallback failed for food:', fallbackErr);
      return null;
    }
  }
}

export async function checkBackendHealth() {
  try {
    await fetchBackendJson('/refining/constants/', { method: 'GET' }, 2000);
    return true;
  } catch {
    return false;
  }
}

export async function getPotionItemsApi() {
  try {
    return await fetchBackendJson('/potions/items/');
  } catch {
    return null;
  }
}

export async function calculatePotionApi(payload) {
  try {
    return await fetchBackendJson('/potions/calculate/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return null;
  }
}

export async function fetchPotionPricesApi(payload) {
  try {
    const data = await fetchBackendJson('/potions/prices/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return syncClientClock(data);
  } catch {
    try {
      const itemId = payload?.item_id;
      const enchantment = Number(payload?.enchantment || 0);
      const ingredientIds = payload?.ingredient_ids || [];
      const server = payload?.server || 'europe';
      const selectedCity = payload?.city || 'Brecilien';
      if (!itemId) return null;

      const targetPotionId = enchantment > 0 ? `${itemId}@${enchantment}` : itemId;
      const itemsToFetch = [targetPotionId, ...ingredientIds];
      const priceData = await fetchAodpPricesBrowser(itemsToFetch, {
        server,
        locations: [selectedCity],
        qualities: '1',
        includeHistory: true,
      });

      const extractPrices = (iid) => {
        const rec = priceData[`${iid}:${selectedCity}`];
        if (rec) {
          return {
            item_id: iid,
            sell_min: rec.sell_price_min || 0,
            buy_max: rec.buy_price_max || 0,
            updated_at: rec.updated_at || null,
            age_hours: rec.age_hours ?? null,
            city: selectedCity,
          };
        }
        for (const [k, r] of Object.entries(priceData)) {
          if (k.startsWith(`${iid}:`) && (r.sell_price_min || 0) > 0) {
            return {
              item_id: iid,
              sell_min: r.sell_price_min || 0,
              buy_max: r.buy_price_max || 0,
              updated_at: r.updated_at || null,
              age_hours: r.age_hours ?? null,
              city: r.city,
            };
          }
        }
        return { item_id: iid, sell_min: 0, buy_max: 0, city: selectedCity };
      };

      const ingredientsRes = {};
      for (const ingId of ingredientIds) {
        ingredientsRes[ingId] = extractPrices(ingId);
      }

      return {
        potion: extractPrices(targetPotionId),
        ingredients: ingredientsRes,
        server,
        city: selectedCity,
        server_utc_now: new Date(getCalibratedNowMs()).toISOString(),
      };
    } catch (fallbackErr) {
      console.warn('Direct browser AODP fallback failed for potions:', fallbackErr);
      return null;
    }
  }
}

export async function getFarmingItemsApi() {
  try {
    return await fetchBackendJson('/farming/items/');
  } catch {
    return null;
  }
}

export async function calculateFarmingApi(payload) {
  try {
    return await fetchBackendJson('/farming/calculate/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return null;
  }
}

export async function fetchFarmingPricesApi(payload) {
  try {
    const data = await fetchBackendJson('/farming/prices/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return syncClientClock(data);
  } catch {
    try {
      const itemId = payload?.item_id;
      const relatedIds = payload?.related_ids || [];
      const server = payload?.server || 'europe';
      const selectedCity = payload?.city || 'Martlock';
      if (!itemId) return null;

      const itemsToFetch = Array.from(new Set([itemId, ...relatedIds].filter(Boolean)));
      const priceData = await fetchAodpPricesBrowser(itemsToFetch, {
        server,
        locations: [selectedCity],
        qualities: '1',
        includeHistory: true,
      });

      const extractPrices = (iid) => {
        const rec = priceData[`${iid}:${selectedCity}`];
        if (rec) {
          return {
            item_id: iid,
            sell_min: rec.sell_price_min || 0,
            buy_max: rec.buy_price_max || 0,
            updated_at: rec.updated_at || null,
            age_hours: rec.age_hours ?? null,
            city: selectedCity,
          };
        }
        for (const [k, r] of Object.entries(priceData)) {
          if (k.startsWith(`${iid}:`) && (r.sell_price_min || 0) > 0) {
            return {
              item_id: iid,
              sell_min: r.sell_price_min || 0,
              buy_max: r.buy_price_max || 0,
              updated_at: r.updated_at || null,
              age_hours: r.age_hours ?? null,
              city: r.city,
            };
          }
        }
        return { item_id: iid, sell_min: 0, buy_max: 0, city: selectedCity };
      };

      const prices = {};
      for (const iid of itemsToFetch) {
        prices[iid] = extractPrices(iid);
      }

      return {
        prices,
        server,
        city: selectedCity,
        server_utc_now: new Date(getCalibratedNowMs()).toISOString(),
      };
    } catch (fallbackErr) {
      console.warn('Direct browser AODP fallback failed for farming:', fallbackErr);
      return null;
    }
  }
}

export async function getLaborerItemsApi() {
  try {
    return await fetchBackendJson('/laborers/items/');
  } catch {
    return null;
  }
}

export async function calculateLaborerApi(payload) {
  try {
    return await fetchBackendJson('/laborers/calculate/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return null;
  }
}

export async function fetchLaborerPricesApi(payload) {
  try {
    const data = await fetchBackendJson('/laborers/prices/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return syncClientClock(data);
  } catch {
    try {
      const fullJournalId = payload?.full_journal_id;
      const emptyJournalId = payload?.empty_journal_id;
      const materialIds = payload?.material_ids || [];
      const server = payload?.server || 'europe';
      const selectedCity = payload?.city || 'Martlock';

      const itemsToFetch = [fullJournalId, emptyJournalId, ...materialIds].filter(
        (iid) => iid && iid !== 'SILVER'
      );
      const priceData = await fetchAodpPricesBrowser(itemsToFetch, {
        server,
        locations: [selectedCity],
        qualities: '1',
        includeHistory: true,
      });

      const extractPrices = (iid) => {
        const rec = priceData[`${iid}:${selectedCity}`];
        if (rec) {
          return {
            item_id: iid,
            sell_min: rec.sell_price_min || 0,
            buy_max: rec.buy_price_max || 0,
            updated_at: rec.updated_at || null,
            age_hours: rec.age_hours ?? null,
            city: selectedCity,
          };
        }
        for (const [k, r] of Object.entries(priceData)) {
          if (k.startsWith(`${iid}:`) && (r.sell_price_min || 0) > 0) {
            return {
              item_id: iid,
              sell_min: r.sell_price_min || 0,
              buy_max: r.buy_price_max || 0,
              updated_at: r.updated_at || null,
              age_hours: r.age_hours ?? null,
              city: r.city,
            };
          }
        }
        return { item_id: iid, sell_min: 0, buy_max: 0, city: selectedCity };
      };

      const prices = {};
      for (const iid of itemsToFetch) {
        prices[iid] = extractPrices(iid);
      }

      return {
        prices,
        server,
        city: selectedCity,
        server_utc_now: new Date(getCalibratedNowMs()).toISOString(),
      };
    } catch (fallbackErr) {
      console.warn('Direct browser AODP fallback failed for laborers:', fallbackErr);
      return null;
    }
  }
}

export async function getBlackMarketItemsApi() {
  try {
    return await fetchBackendJson('/blackmarket/items/');
  } catch {
    return {
      items: ELIGIBLE_BM_ITEMS,
      categories: [
        { id: 'all', label: 'All Equipment' },
        { id: 'warrior', label: 'Warrior (Forgemaster)' },
        { id: 'hunter', label: 'Hunter (Bowyer)' },
        { id: 'mage', label: 'Mage (Arcanist)' },
        { id: 'accessories', label: 'Bags & Capes' },
        { id: 'gathering', label: 'Gathering Garb' },
      ],
      tiers: [4, 5, 6, 7, 8],
      enchantments: [0, 1, 2, 3, 4],
    };
  }
}

export async function scanBlackMarketApi(payload) {
  try {
    const data = await fetchBackendJson(
      '/blackmarket/scan/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      4500
    );
    return syncClientClock(data);
  } catch {
    // Direct-to-AODP HTTPS Browser Scanner for Black Market
    try {
      const server = payload?.server || 'europe';
      const tier = Number(payload?.tier || 5);
      const enchantment = Number(payload?.enchantment || 0);
      const category = payload?.category || 'all';
      const minProfit = Number(payload?.min_profit || 0);
      const minMargin = Number(payload?.min_margin || 0);
      const sortBy = payload?.sort_by || 'profit';
      const limit = Math.max(1, Math.min(100, Number(payload?.limit || 50)));

      let targetQuality = payload?.quality;
      if (targetQuality !== undefined && targetQuality !== null && targetQuality !== '' && targetQuality !== 'all') {
        targetQuality = Number(targetQuality) || null;
      } else {
        targetQuality = null;
      }

      const targets = ELIGIBLE_BM_ITEMS.filter((it) => {
        if (category !== 'all' && it.category !== category) return false;
        if (tier < (it.minTier || 4) || tier > (it.maxTier || 8)) return false;
        if (enchantment > 0 && it.allowEnchantment === false) return false;
        return true;
      });

      if (!targets.length) {
        return { results: [], totalScanned: 0 };
      }

      const itemIdMap = {};
      const aodpIds = [];
      for (const it of targets) {
        const baseId = it.template.replace('{tier}', String(tier));
        const fullAodpId = enchantment > 0 && tier >= 4 ? `${baseId}@${enchantment}` : baseId;
        itemIdMap[fullAodpId] = it;
        aodpIds.push(fullAodpId);
      }

      const chunkSize = 60;
      const locations = 'Black Market,Caerleon,Martlock,Lymhurst,Fort Sterling,Thetford,Bridgewatch';
      const serverKey = String(server).toLowerCase();
      const baseApi = AODP_PRICE_SERVERS[serverKey] || AODP_PRICE_SERVERS.europe;

      const chunkPromises = [];
      for (let i = 0; i < Math.min(aodpIds.length, 120); i += chunkSize) {
        const chunk = aodpIds.slice(i, i + chunkSize);
        const url = `${baseApi}${chunk.join(',')}.json?locations=${locations}`;
        chunkPromises.push(
          fetch(url)
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => [])
        );
      }

      const chunkArrays = await Promise.all(chunkPromises);
      const priceRecords = chunkArrays.flat();
      await ensureBrowserClockCalibrated(priceRecords);

      const pricesByQuality = {};
      for (const r of priceRecords) {
        const iid = r.item_id;
        const city = r.city;
        if (!iid || !city) continue;
        const qual = Number(r.quality || 1);
        let sellMin = Number(r.sell_price_min || 0);
        let buyMax = Number(r.buy_price_max || 0);

        const { formatted: sDate, ageHours: sAge } = parseAodpDateBrowser(r.sell_price_min_date);
        const { formatted: bDate, ageHours: bAge } = parseAodpDateBrowser(r.buy_price_max_date);
        if (!sDate || sAge > 72.0) sellMin = 0;
        if (!bDate || bAge > 72.0) buyMax = 0;

        if (!pricesByQuality[iid]) pricesByQuality[iid] = {};
        if (!pricesByQuality[iid][city]) pricesByQuality[iid][city] = {};

        const existing = pricesByQuality[iid][city][qual] || {
          sell_min: 0,
          buy_max: 0,
          sell_age: 999999.0,
          buy_age: 999999.0,
          sell_date: null,
          buy_date: null,
        };

        if (sellMin > 0) {
          const isFresher = sAge + 3.0 < existing.sell_age;
          const isSimilarAndCheaper =
            Math.abs(sAge - existing.sell_age) <= 3.0 &&
            (existing.sell_min === 0 || sellMin < existing.sell_min);
          if (existing.sell_min === 0 || isFresher || isSimilarAndCheaper) {
            existing.sell_min = sellMin;
            existing.sell_age = sAge;
            existing.sell_date = sDate;
          }
        }
        if (buyMax > 0) {
          const isBFresher = bAge + 3.0 < existing.buy_age;
          const isBSimilarAndHigher =
            Math.abs(bAge - existing.buy_age) <= 3.0 &&
            (existing.buy_max === 0 || buyMax > existing.buy_max);
          if (existing.buy_max === 0 || isBFresher || isBSimilarAndHigher) {
            existing.buy_max = buyMax;
            existing.buy_age = bAge;
            existing.buy_date = bDate;
          }
        }
        pricesByQuality[iid][city][qual] = existing;
      }

      const results = [];
      const qualitiesToEval = [1, 2, 3, 4, 5].includes(targetQuality)
        ? [targetQuality]
        : [1, 2, 3, 4, 5];

      for (const [aodpId, it] of Object.entries(itemIdMap)) {
        const itemCities = pricesByQuality[aodpId] || {};

        const baseItemVal = it.baseItemValue || 100;
        const primaryQty = it.primaryQty || 16;
        const secondaryQty = it.secondaryQty || 8;
        const matTierMult = Math.pow(2, tier - 4) * Math.pow(2, enchantment);
        const estPrimaryCost = primaryQty * 350 * matTierMult * 0.75;
        const estSecondaryCost = secondaryQty * 350 * matTierMult * 0.75;
        const baseCraftCostEst = Math.round(estPrimaryCost + estSecondaryCost + baseItemVal * 2);

        let bestItemOpportunity = null;

        for (const q of qualitiesToEval) {
          const bmData = itemCities['Black Market']?.[q] || {
            sell_min: 0,
            buy_max: 0,
            sell_age: 999999.0,
            buy_age: 999999.0,
            sell_date: null,
            buy_date: null,
          };
          const bmBuyMax = bmData.buy_max;
          const bmSellMin = bmData.sell_min;
          const bmBuyAge = bmData.buy_age ?? 999999.0;
          const bmSellAge = bmData.sell_age ?? 999999.0;
          const bmBuyDate = bmData.buy_date;
          const bmSellDate = bmData.sell_date;

          let royalBestPrice = 0;
          let royalBestCity = 'Martlock';
          let royalBestAge = null;
          let royalBestDate = null;

          for (const rc of ROYAL_CITIES) {
            const qRec = itemCities[rc]?.[q];
            if (qRec && qRec.sell_min > 0) {
              if (royalBestPrice === 0 || qRec.sell_min < royalBestPrice) {
                royalBestPrice = qRec.sell_min;
                royalBestCity = rc;
                royalBestAge = qRec.sell_age;
                royalBestDate = qRec.sell_date;
              }
            }
          }

          const qualityCraftMult = q <= 2 ? 1.0 : q === 3 ? 1.3 : q === 4 ? 1.8 : 3.5;
          const craftCostEst = Math.round(baseCraftCostEst * qualityCraftMult);

          const effectiveCost = royalBestPrice > 0 ? royalBestPrice : craftCostEst;
          const acquisitionMethod =
            royalBestPrice > 0
              ? `Buy in ${royalBestCity}`
              : `Craft in ${it.bonusCity || 'Royal City'}`;

          const taxMultiplier = 0.935;

          const instantPayout = bmBuyMax > 0 ? Math.round(bmBuyMax * taxMultiplier) : 0;
          const instantProfit = instantPayout > 0 ? Math.round(instantPayout - effectiveCost) : 0;
          const instantMargin =
            instantPayout > 0 && effectiveCost > 0
              ? Math.round((instantProfit / effectiveCost) * 1000) / 10
              : 0;

          const listedPayout = bmSellMin > 0 ? Math.round(bmSellMin * taxMultiplier) : 0;
          const listedProfit = listedPayout > 0 ? Math.round(listedPayout - effectiveCost) : 0;
          const listedMargin =
            listedPayout > 0 && effectiveCost > 0
              ? Math.round((listedProfit / effectiveCost) * 1000) / 10
              : 0;

          const bestProfit = Math.max(instantProfit, listedProfit);
          const bestMargin = instantProfit >= listedProfit ? instantMargin : listedMargin;
          const bestMode =
            instantProfit >= listedProfit && instantProfit > 0
              ? 'Instant Buy Order'
              : listedProfit > 0
                ? 'Listed Order'
                : 'None';

          if (bestProfit < minProfit || bestMargin < minMargin) continue;

          const unitWeight = Math.round((primaryQty + secondaryQty) * 0.15 * 100) / 100;
          const silverPerKg =
            unitWeight > 0 && bestProfit > 0 ? Math.round(bestProfit / unitWeight) : 0;

          const qualMeta = ITEM_QUALITIES_META[q] || {
            name: 'Normal',
            color: 'slate',
            label: `Quality ${q}`,
          };

          const activeBmAge = bestMode === 'Instant Buy Order' ? bmBuyAge : bmSellAge;
          const activeBmDate = bestMode === 'Instant Buy Order' ? bmBuyDate : bmSellDate;

          const opp = {
            id: it.id,
            aodpId,
            name: it.name,
            tier,
            enchantment,
            quality: q,
            qualityName: qualMeta.name,
            qualityLabel: qualMeta.label,
            qualityColor: qualMeta.color,
            category: it.category,
            subcategory: it.subcategory,
            icon: `${it.template.replace('{tier}', String(tier))}.png`,
            weightKg: unitWeight,
            bonusCity: it.bonusCity,
            acquisition: {
              method: acquisitionMethod,
              city: royalBestPrice > 0 ? royalBestCity : it.bonusCity,
              cost: effectiveCost,
              quality: q,
              qualityName: qualMeta.name,
              isMarketListing: royalBestPrice > 0,
              updatedAt: royalBestPrice > 0 ? royalBestDate : null,
              ageHours:
                royalBestPrice > 0 && royalBestAge !== null && royalBestAge < 9999
                  ? Math.round(royalBestAge * 100) / 100
                  : null,
            },
            blackMarket: {
              buyOrderMax: bmBuyMax,
              sellOrderMin: bmSellMin,
              quality: q,
              qualityName: qualMeta.name,
              instantPayout,
              listedPayout,
              buyOrderUpdatedAt: bmBuyMax > 0 ? bmBuyDate : null,
              buyOrderAgeHours:
                bmBuyMax > 0 && bmBuyAge < 9999 ? Math.round(bmBuyAge * 100) / 100 : null,
              sellOrderUpdatedAt: bmSellMin > 0 ? bmSellDate : null,
              sellOrderAgeHours:
                bmSellMin > 0 && bmSellAge < 9999 ? Math.round(bmSellAge * 100) / 100 : null,
              activeUpdatedAt: activeBmDate,
              activeAgeHours:
                activeBmAge !== null && activeBmAge < 9999
                  ? Math.round(activeBmAge * 100) / 100
                  : null,
            },
            spread: {
              instantProfit,
              instantMarginPct: instantMargin,
              listedProfit,
              listedMarginPct: listedMargin,
              bestProfit,
              bestMarginPct: bestMargin,
              bestMode,
              silverPerKg,
            },
          };

          if (!bestItemOpportunity || bestProfit > bestItemOpportunity.spread.bestProfit) {
            bestItemOpportunity = opp;
          }
        }

        if (bestItemOpportunity) {
          results.push(bestItemOpportunity);
        }
      }

      if (sortBy === 'margin') {
        results.sort((a, b) => b.spread.bestMarginPct - a.spread.bestMarginPct);
      } else if (sortBy === 'density') {
        results.sort((a, b) => b.spread.silverPerKg - a.spread.silverPerKg);
      } else if (sortBy === 'cost') {
        results.sort((a, b) => a.acquisition.cost - b.acquisition.cost);
      } else if (sortBy === 'freshness') {
        results.sort((a, b) => {
          const ageA = a.blackMarket.activeAgeHours ?? 9999;
          const ageB = b.blackMarket.activeAgeHours ?? 9999;
          if (ageA !== ageB) return ageA - ageB;
          return b.spread.bestProfit - a.spread.bestProfit;
        });
      } else {
        results.sort((a, b) => b.spread.bestProfit - a.spread.bestProfit);
      }

      return {
        results: results.slice(0, limit),
        totalScanned: targets.length,
        server,
        tier,
        enchantment,
        server_utc_now: new Date(getCalibratedNowMs()).toISOString(),
      };
    } catch (fallbackErr) {
      console.warn('Direct browser AODP fallback failed for Black Market scan:', fallbackErr);
      return null;
    }
  }
}

export async function calculateHaulApi(payload) {
  try {
    return await fetchBackendJson('/blackmarket/haul/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return null;
  }
}
