// pages/api/location/countries.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 仅允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://city-state-country.vercel.app/countries');
    
    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // 可选：添加缓存头（Vercel 边缘网络会尊重 cache-control）
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // 缓存 1 天
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
}