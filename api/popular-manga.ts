import { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from './dbPool.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await pool.query(
      'SELECT id, title, cover_url, chapters, last_updated, follower_count ' +
      'FROM manga ' +
      'WHERE follower_count > 0 ' +
      'ORDER BY follower_count DESC ' +
      'LIMIT 10'
    );

    res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('Error fetching popular manga:', error);
    res.status(500).json({ error: 'Error fetching popular manga', details: error.message });
  }
}
