/**
 * GET /api/health
 * Health check endpoint - verifica conexão com o banco Neon Postgres
 */
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`SELECT 1`;
    return res.status(200).json({
      status: 'online',
      database: 'Neon Postgres',
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      error: err.message,
    });
  }
}
