/**
 * Bunny.net Stream Token Signing Engine & Handshake Protocol
 *
 * Implements SHA-256 HMAC / SHA-256 token hashing for Bunny.net Stream Embeds.
 * Limits playback URL authorization window strictly to 30-45 seconds.
 */
import crypto from 'crypto';

/**
 * Parses Bunny.net libraryId and videoId from any legacy format (URL or IDs)
 */
export function extractBunnyVideoIdentifiers(videoUrlOrId, defaultLibraryId = '800731') {
  if (!videoUrlOrId) return { libraryId: defaultLibraryId, videoId: null };

  const str = String(videoUrlOrId).trim();
  const match = str.match(/(?:player|iframe)\.mediadelivery\.net\/(?:play|embed)\/([0-9]+)\/([a-zA-Z0-9-]+)/i);
  if (match) {
    return {
      libraryId: match[1],
      videoId: match[2],
    };
  }

  // If videoUrl is already a plain UUID
  const uuidMatch = str.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  if (uuidMatch) {
    return {
      libraryId: defaultLibraryId,
      videoId: str,
    };
  }

  return { libraryId: defaultLibraryId, videoId: null };
}

/**
 * Generates an authenticated Bunny.net Stream Embed URL with a short-lived token (30-45s max).
 *
 * Bunny.net Token Authentication algorithm:
 *   hashableBase = securityKey + videoId + expiresTimestamp
 *   token = sha256(hashableBase)
 *
 * @param {object} params
 * @param {string} params.videoId - Bunny.net video GUID
 * @param {string} params.libraryId - Bunny.net stream library ID (default: 800731)
 * @param {string} params.securityKey - Bunny.net Stream Library Token Authentication Key
 * @param {number} params.ttlSeconds - Token lifetime in seconds (bounded to 30..45s)
 * @param {string} params.userIp - Optional remote client IP binding
 * @returns {{ signedUrl: string, expiresAt: number, ttl: number }}
 */
export function generateBunnyTokenEmbed({
  videoId,
  libraryId = '800731',
  securityKey = process.env.BUNNY_STREAM_API_KEY || 'ilm_essentials_bunny_stream_sec_key',
  ttlSeconds = 45,
  userIp = '',
}) {
  if (!videoId) {
    throw new Error('Video ID is required for Bunny.net token generation.');
  }

  // Strict constraint: bound between 30 and 45 seconds max
  const boundedTtl = Math.min(Math.max(Number(ttlSeconds) || 45, 30), 45);
  const nowUnix = Math.floor(Date.now() / 1000);
  const expiresAt = nowUnix + boundedTtl;

  // Bunny Token Hash: SHA256(securityKey + videoId + expiresAt [ + userIp if configured ])
  const rawBase = userIp ? `${securityKey}${videoId}${expiresAt}${userIp}` : `${securityKey}${videoId}${expiresAt}`;
  const token = crypto.createHash('sha256').update(rawBase).digest('hex');

  const queryParams = new URLSearchParams({
    token,
    expires: String(expiresAt),
    autoplay: 'true',
    loop: 'false',
    muted: 'false',
    preload: 'true',
    responsive: 'true',
  });

  const signedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?${queryParams.toString()}`;

  return {
    signedUrl,
    expiresAt,
    ttl: boundedTtl,
  };
}
