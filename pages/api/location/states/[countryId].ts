// pages/api/location/states/[countryId].ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { countryId } = req.query;

  if (!countryId || Array.isArray(countryId)) {
    return res.status(400).json({ error: 'Invalid country ID' });
  }

  try {
    const response = await fetch(`https://city-state-country.vercel.app/countries/${countryId}/states`);
    
    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching states for country ${countryId}:`, error);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
}