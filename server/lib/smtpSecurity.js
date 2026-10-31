import dns from 'node:dns/promises'
import net from 'node:net'

function isPrivateIPv4(value) {
  const p = value.split('.').map(Number)
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [a,b] = p
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19))
}
function isPrivateIPv6(value) {
  const ip = value.toLowerCase().split('%')[0]
  if (ip === '::' || ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') ||
      ip.startsWith('fe8') || ip.startsWith('fe9') || ip.startsWith('fea') ||
      ip.startsWith('feb') || ip.startsWith('ff')) return true
  if (ip.startsWith('::ffff:')) return true
  const first = Number.parseInt(ip.split(':')[0] || '0', 16)
  if (first < 0x2000 || first > 0x3fff) return true
  if (ip.startsWith('2001:db8:') || ip.startsWith('2001:10:')) return true
  return false
}
function isPublicAddress(address) {
  const family = net.isIP(address)
  if (family === 4) return !isPrivateIPv4(address)
  if (family === 6) return !isPrivateIPv6(address)
  return false
}

export async function resolvePublicSmtpHost(hostname) {
  const host = String(hostname || '').trim().replace(/\.$/, '')
  if (!host || host.length > 253 || /[\s/@?#]/.test(host)) throw new Error('Invalid SMTP hostname.')
  const directFamily = net.isIP(host)
  const addresses = directFamily ? [{ address: host, family: directFamily }] : await dns.lookup(host, { all: true, verbatim: true })
  if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) {
    throw new Error('SMTP host must resolve only to public IP addresses.')
  }
  return addresses
}
