import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from "pg";

// Example serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
    const client = new pg.Client(process.env.POSTGRES_URL)
    await client.connect()
    try {
        const { rows } = await client.query('SELECT * FROM users')
        res.status(200).json(rows)
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
}