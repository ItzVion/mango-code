// Parse PostgreSQL URLs with the WHATWG URL implementation. Passing a connectionString
// directly to pg delegates parsing to pg-connection-string's legacy url.parse() path.
export function postgresConfigFromUrl(connectionString, { isProduction = false } = {}) {
  const url = new URL(connectionString)
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must use the postgres:// or postgresql:// scheme')
  }

  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
  const user = decodeURIComponent(url.username)
  const password = decodeURIComponent(url.password)
  if (!url.hostname || !database || !user) {
    throw new Error('DATABASE_URL is missing a hostname, database, or username')
  }

  const sslmode = (url.searchParams.get('sslmode') || '').toLowerCase()
  const channelBinding = (url.searchParams.get('channel_binding') || '').toLowerCase()
  const config = {
    host: url.hostname.replace(/^\[|\]$/g, ''),
    port: url.port ? Number(url.port) : 5432,
    database,
    user,
    password,
    ssl: isProduction || ['require', 'verify-ca', 'verify-full'].includes(sslmode)
      ? { rejectUnauthorized: true }
      : undefined,
  }

  if (channelBinding === 'require') config.enableChannelBinding = true
  const applicationName = url.searchParams.get('application_name')
  const options = url.searchParams.get('options')
  if (applicationName) config.application_name = applicationName
  if (options) config.options = options

  return config
}
