import dns from 'dns/promises';
import net from 'net';
import AppError from '@/src/lib/AppError.js';
import { statusCodes } from '@/src/constants/statusCodes.js';

/**
 * SSRF guard for user-supplied webhook URLs. Webhook targets are fetched
 * server-side, so without this a user could point a job at internal services
 * or cloud metadata (169.254.169.254). We require http(s) and reject any host
 * that resolves into a private/reserved range.
 *
 * Self-hosters who legitimately fire at internal hosts can opt out with
 * ALLOW_PRIVATE_WEBHOOKS=true.
 */

function privatewebhooksAllowed() {
  return process.env.ALLOW_PRIVATE_WEBHOOKS === 'true';
}

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function inCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(range) & mask);
}

// IPv4 ranges that must never be reachable from a webhook.
const BLOCKED_V4 = [
  '0.0.0.0/8', // "this" network
  '10.0.0.0/8', // private
  '100.64.0.0/10', // CGNAT
  '127.0.0.0/8', // loopback
  '169.254.0.0/16', // link-local incl. cloud metadata
  '172.16.0.0/12', // private
  '192.0.0.0/24', // IETF protocol assignments
  '192.0.2.0/24', // TEST-NET-1
  '192.168.0.0/16', // private
  '198.18.0.0/15', // benchmarking
  '224.0.0.0/4', // multicast
  '240.0.0.0/4', // reserved
  '255.255.255.255/32', // broadcast
];

function isBlockedIp(address: string): boolean {
  const family = net.isIP(address);

  if (family === 4) {
    return BLOCKED_V4.some((cidr) => inCidr(address, cidr));
  }

  if (family === 6) {
    const ip = address.toLowerCase();

    // IPv4-mapped (::ffff:a.b.c.d) — validate the embedded v4 address.
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedIp(mapped[1]);

    if (ip === '::1' || ip === '::') return true; // loopback / unspecified
    if (ip.startsWith('fe80') || ip.startsWith('fe9') || ip.startsWith('fea') || ip.startsWith('feb'))
      return true; // link-local fe80::/10
    if (ip.startsWith('fc') || ip.startsWith('fd')) return true; // unique-local fc00::/7
    if (ip.startsWith('ff')) return true; // multicast
    return false;
  }

  return true; // not a recognizable IP — treat as unsafe
}

export async function assertPublicWebhookUrl(rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new AppError('Invalid webhook URL', statusCodes.BAD_REQUEST);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AppError('Webhook URL must use http or https', statusCodes.BAD_REQUEST);
  }

  if (privatewebhooksAllowed()) return;

  const hostname = url.hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets

  if (hostname.toLowerCase() === 'localhost') {
    throw new AppError('Webhook URL may not target a private address', statusCodes.BAD_REQUEST);
  }

  // Resolve to every address the host points at and reject if any is internal
  // (defends against a public name that resolves to a private IP).
  let addresses: string[];
  if (net.isIP(hostname)) {
    addresses = [hostname];
  } else {
    try {
      const records = await dns.lookup(hostname, { all: true });
      addresses = records.map((r) => r.address);
    } catch {
      throw new AppError('Webhook URL host could not be resolved', statusCodes.BAD_REQUEST);
    }
  }

  if (addresses.length === 0 || addresses.some(isBlockedIp)) {
    throw new AppError('Webhook URL may not target a private address', statusCodes.BAD_REQUEST);
  }
}
