import { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from './dbPool.js';
import authMiddleware from './authMiddleware.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  authMiddleware(req, res, async () => {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    try {
      const result = await pool.query(
        'SELECT manga.id, manga.title, manga.last_updated, manga.follower_count, manga.cover_url ' +
        'FROM manga ' +
        'JOIN user_manga ON manga.id = user_manga.manga_id ' +
        'WHERE user_manga.user_id = $1',
        [userId]
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching user manga:', error);
      res.status(500).json({ error: 'Error fetching user manga', details: error.message });
    }
  });
}