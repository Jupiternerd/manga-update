import { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from './dbPool.js';
import authMiddleware from './authMiddleware.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  authMiddleware(req, res, async () => {
    const { mangaId } = req.body;
    const userId = (req as any).userId;

    if (!mangaId) {
      return res.status(400).json({ error: 'Missing mangaId parameter' });
    }

    const client = await pool.connect();
    try {

      // Check if the user follows this manga
      const result = await client.query('SELECT * FROM user_manga WHERE user_id = $1 AND manga_id = $2', [userId, mangaId]);

      if (result.rows.length === 0) {
        res.status(400).json({ message: 'You do not follow this manga.' });
        return;
      }

      // Remove manga from user_manga table
      await client.query('DELETE FROM user_manga WHERE user_id = $1 AND manga_id = $2', [userId, mangaId]);

      // Decrement follower count for the manga
      await client.query('UPDATE manga SET follower_count = follower_count - 1 WHERE id = $1', [mangaId]);

      res.status(200).json({ message: 'Manga unfollowed successfully.' });
    } catch (error) {
      console.error('Error unfollowing manga:', error);
      res.status(500).json({ error: 'Error unfollowing manga' });
    } finally {
      client.release();
    }
  });
}
