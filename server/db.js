import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)
const pool = new Pool({
  connectionString: databaseUrl,
  max: Number(process.env.PG_POOL_MAX || (process.env.VERCEL ? 4 : 10)),
  min: 0,
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 20_000),
  connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
  statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 8_000),
  query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 10_000),
  keepAlive: true,
  ssl: isProduction || /sslmode=require|sslmode=verify-full/i.test(databaseUrl)
    ? { rejectUnauthorized: true }
    : undefined,
})

function sqlWithPositionalParameters(sql, args = []) {
  const source = String(sql)
  let index = 0
  let out = ''
  let inSingleQuote = false
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]
    if (ch === "'") {
      out += ch
      if (inSingleQuote && source[i + 1] === "'") {
        out += "'"
        i += 1
      } else {
        inSingleQuote = !inSingleQuote
      }
      continue
    }
    if (ch === '?' && !inSingleQuote) out += `$${++index}`
    else out += ch
  }
  return { text: out, values: args }
}

function executor(client) {
  return {
    async execute(statement) {
      const sql = typeof statement === 'string' ? statement : statement?.sql
      const args = typeof statement === 'string' ? [] : (statement?.args || [])
      if (!sql) throw new Error('Invalid SQL statement')
      const query = sqlWithPositionalParameters(sql, args)
      const result = await client.query(query.text, query.values)
      return { rows: result.rows, rowsAffected: result.rowCount || 0 }
    },
  }
}

const directExecutor = executor({ query: (text, values) => pool.query(text, values) })

export const db = {
  execute: directExecutor.execute,
  async transaction(work) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await work(executor(client))
      await client.query('COMMIT')
      return result
    } catch (error) {
      try { await client.query('ROLLBACK') } catch {}
      throw error
    } finally {
      client.release()
    }
  },
  async end() {
    await pool.end()
  },
}

pool.on('error', (error) => console.error('MangoCode PostgreSQL pool error:', error?.message || error))
