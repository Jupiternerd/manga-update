import { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from './dbPool.js';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]);
    res.status(201).send('User registered successfully');
  } catch (error: any) {
    res.status(500).json({ error: 'Error registering user', details: error.message });
  }
}