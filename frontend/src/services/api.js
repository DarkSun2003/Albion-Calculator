const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE = !isLocalHost && import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : 'http://127.0.0.1:8000/api';

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
    const res = await fetch(`${API_BASE}/refining/constants/`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using fallback constants:', err);
    return null;
  }
}

export async function calculateRefiningApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/refining/calculate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend calculation failed, using fallback client math:', err);
    return null;
  }
}

export async function fetchLivePricesApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/refining/prices/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return syncClientClock(await res.json());
  } catch (err) {
    console.warn('Failed to fetch prices from backend:', err);
    return null;
  }
}

export async function calculateCraftingApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/crafting/calculate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend crafting calculation failed, using fallback client math:', err);
    return null;
  }
}

export async function fetchCraftingPricesApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/crafting/prices/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return syncClientClock(await res.json());
  } catch (err) {
    console.warn('Failed to fetch crafting prices from backend:', err);
    return null;
  }
}


export async function getFoodItemsApi() {
  try {
    const res = await fetch(`${API_BASE}/food/items/`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend food items unavailable:', err);
    return null;
  }
}

export async function calculateFoodApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/food/calculate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend food calculation failed, using fallback client math:', err);
    return null;
  }
}

export async function fetchFoodPricesApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/food/prices/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return syncClientClock(await res.json());
  } catch (err) {
    console.warn('Failed to fetch food prices from backend:', err);
    return null;
  }
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/refining/constants/`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getPotionItemsApi() {
  try {
    const res = await fetch(`${API_BASE}/potions/items/`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend potion items unavailable:', err);
    return null;
  }
}

export async function calculatePotionApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/potions/calculate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend potion calculation failed, using fallback client math:', err);
    return null;
  }
}

export async function fetchPotionPricesApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/potions/prices/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return syncClientClock(await res.json());
  } catch (err) {
    console.warn('Failed to fetch potion prices from backend:', err);
    return null;
  }
}

export async function getFarmingItemsApi() {
  try {
    const res = await fetch(`${API_BASE}/farming/items/`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend farming items unavailable:', err);
    return null;
  }
}

export async function calculateFarmingApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/farming/calculate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend farming calculation failed, using fallback client math:', err);
    return null;
  }
}

export async function fetchFarmingPricesApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/farming/prices/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return syncClientClock(await res.json());
  } catch (err) {
    console.warn('Failed to fetch farming prices from backend:', err);
    return null;
  }
}

export async function getLaborerItemsApi() {
  try {
    const res = await fetch(`${API_BASE}/laborers/items/`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend laborer items unavailable:', err);
    return null;
  }
}

export async function calculateLaborerApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/laborers/calculate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend laborer calculation failed, using fallback client math:', err);
    return null;
  }
}

export async function fetchLaborerPricesApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/laborers/prices/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return syncClientClock(await res.json());
  } catch (err) {
    console.warn('Failed to fetch laborer prices from backend:', err);
    return null;
  }
}

export async function getBlackMarketItemsApi() {
  try {
    const res = await fetch(`${API_BASE}/blackmarket/items/`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend Black Market items unavailable:', err);
    return null;
  }
}

export async function scanBlackMarketApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/blackmarket/scan/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return syncClientClock(await res.json());
  } catch (err) {
    console.warn('Backend Black Market scan failed, using fallback client math:', err);
    return null;
  }
}

export async function calculateHaulApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/blackmarket/haul/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend Black Market haul calculation failed, using fallback client math:', err);
    return null;
  }
}
