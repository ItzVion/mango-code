import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const pool = new Pool({
  connectionString: databaseUrl,
  max: process.env.VERCEL ? 3 : 10,
  ssl: /sslmode=require/i.test(databaseUrl) || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : undefined,
})

function sqlWithPositionalParameters(sql, args = []) {
  let index = 0
  const text = String(sql).replace(/\?/g, () => `$${++index}`)
  return { text, values: args }
}

export const db = {
  async execute(statement) {
    const sql = typeof statement === 'string' ? statement : statement?.sql
    const args = typeof statement === 'string' ? [] : (statement?.args || [])
    if (!sql) throw new Error('Invalid SQL statement')
    const query = sqlWithPositionalParameters(sql, args)
    const result = await pool.query(query.text, query.values)
    return {
      rows: result.rows,
      rowsAffected: result.rowCount || 0,
    }
  },
  async end() {
    await pool.end()
  },
}

pool.on('error', (error) => console.error('MangoCode PostgreSQL pool error:', error))
