// pages/api/location/cities/[stateId].ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { stateId } = req.query;

  if (!stateId || Array.isArray(stateId)) {
    return res.status(400).json({ error: 'Invalid state ID' });
  }

  try {
    const response = await fetch(`https://city-state-country.vercel.app/states/${stateId}/cities`);
    
    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching cities for state ${stateId}:`, error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
}