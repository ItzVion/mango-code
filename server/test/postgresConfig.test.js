import test from 'node:test'
import assert from 'node:assert/strict'
import { postgresConfigFromUrl } from '../lib/postgresConfig.js'

test('parses Neon URLs without passing a connectionString to pg', () => {
  const config = postgresConfigFromUrl(
    'postgresql://user%40tenant:p%40ss%3Aword@db.example.test:5432/neondb?sslmode=require&channel_binding=require',
    { isProduction: true },
  )
  assert.equal(config.host, 'db.example.test')
  assert.equal(config.port, 5432)
  assert.equal(config.database, 'neondb')
  assert.equal(config.user, 'user@tenant')
  assert.equal(config.password, 'p@ss:word')
  assert.equal(config.enableChannelBinding, true)
  assert.deepEqual(config.ssl, { rejectUnauthorized: true })
  assert.equal(Object.hasOwn(config, 'connectionString'), false)
})

test('requires verified TLS in production even if the URL requests disable', () => {
  const config = postgresConfigFromUrl(
    'postgres://u:p@db.example.test/neondb?sslmode=disable',
    { isProduction: true },
  )
  assert.deepEqual(config.ssl, { rejectUnauthorized: true })
})

test('rejects malformed or non-PostgreSQL connection URLs', () => {
  assert.throws(() => postgresConfigFromUrl('https://example.test/db'))
  assert.throws(() => postgresConfigFromUrl('postgres://u:p@db.example.test/'))
})
