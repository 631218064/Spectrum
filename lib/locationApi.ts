// lib/locationApi.ts
// 封装本地地理位置 API 调用，包含缓存机制减少请求

interface Country {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
}

interface State {
  id: number;
  name: string;
  country_id: number;
}

interface City {
  id: number;
  name: string;
  state_id: number;
}

// 简单内存缓存（避免重复请求）
const cache: Record<string, any> = {};

/**
 * 获取所有国家列表（通过本地 API 代理）
 */
export async function fetchCountries(): Promise<Country[]> {
  const cacheKey = 'countries';
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const response = await fetch('/api/location/countries');
    if (!response.ok) throw new Error('Failed to fetch countries');
    const data = await response.json();
    cache[cacheKey] = data;
    return data;
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

/**
 * 获取指定国家的所有州/省（通过本地 API 代理）
 */
export async function fetchStates(countryId: number): Promise<State[]> {
  if (!countryId) return [];
  const cacheKey = `states_${countryId}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const response = await fetch(`/api/location/states/${countryId}`);
    if (!response.ok) throw new Error('Failed to fetch states');
    const data = await response.json();
    cache[cacheKey] = data;
    return data;
  } catch (error) {
    console.error('Error fetching states:', error);
    return [];
  }
}

/**
 * 获取指定州的所有城市（通过本地 API 代理）
 */
export async function fetchCities(stateId: number): Promise<City[]> {
  if (!stateId) return [];
  const cacheKey = `cities_${stateId}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const response = await fetch(`/api/location/cities/${stateId}`);
    if (!response.ok) throw new Error('Failed to fetch cities');
    const data = await response.json();
    cache[cacheKey] = data;
    return data;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}