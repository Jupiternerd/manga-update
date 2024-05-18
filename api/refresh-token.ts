import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { pool } from './dbPool';

const REFRESH_SECRET = process.env.RFSH_SECRET;
const ACCESS_SECRET = process.env.JWT_SECRET

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (REFRESH_SECRET === undefined || ACCESS_SECRET === undefined) throw new Error('Missing secret');
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Missing refresh token' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { userId: string };

    const userId = decoded.userId;

    // Optionally verify if refresh token is still valid (e.g., by checking in database)
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newAccessToken = jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '15m' });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}
