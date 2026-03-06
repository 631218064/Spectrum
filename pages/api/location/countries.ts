import type { NextApiRequest, NextApiResponse } from 'next';
import { getRequestId, logApiError } from '@/lib/apiLogger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = getRequestId(req);
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', requestId });
  }

  try {
    const response = await fetch('https://city-state-country.vercel.app/countries');

    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    logApiError(req, requestId, error);
    res.status(500).json({ error: 'Failed to fetch countries', requestId });
  }
}
