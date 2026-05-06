const CLIENT_KEY_PREFIX = 'client_key_';
const CLIENT_KEY_TTL = 7 * 24 * 60 * 60;
const CLIENT_KEY_HISTORY_LIMIT = 5;

function normalizeClientKey(clientKey: string) {
  const trimmed = clientKey?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith(CLIENT_KEY_PREFIX)) return trimmed;
  return `${CLIENT_KEY_PREFIX}${trimmed}`;
}

export function extractAESKey(clientKey: string) {
  const normalized = normalizeClientKey(clientKey);
  if (!normalized) return null;
  return normalized.slice(CLIENT_KEY_PREFIX.length);
}

function getCurrentClientKeyRedisKey(userId: string) {
  return `client_key:${userId}`;
}

function getClientKeyHistoryRedisKey(userId: string) {
  return `client_keys:${userId}`;
}

export async function saveUserClientKey(
  redisClient: any,
  userId: string,
  clientKey: string,
) {
  const normalized = normalizeClientKey(clientKey);
  if (!normalized) return null;

  const currentKey = getCurrentClientKeyRedisKey(userId);
  const historyKey = getClientKeyHistoryRedisKey(userId);
  const [current, historyRaw] = await Promise.all([
    redisClient.get(currentKey),
    redisClient.get(historyKey),
  ]);

  let history: string[] = [];
  if (historyRaw) {
    try {
      const parsed = JSON.parse(historyRaw);
      if (Array.isArray(parsed)) {
        history = parsed.filter((item) => typeof item === 'string');
      }
    } catch (_error) {}
  }

  const nextHistory = [normalized, current, ...history]
    .filter((item): item is string => typeof item === 'string' && item.length > 0)
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, CLIENT_KEY_HISTORY_LIMIT);

  await redisClient.set(currentKey, normalized, 'EX', CLIENT_KEY_TTL);
  await redisClient.set(historyKey, JSON.stringify(nextHistory), 'EX', CLIENT_KEY_TTL);

  return normalized;
}

export async function getUserClientKeyCandidates(
  redisClient: any,
  userId: string,
) {
  const currentKey = getCurrentClientKeyRedisKey(userId);
  const historyKey = getClientKeyHistoryRedisKey(userId);

  const [current, historyRaw] = await Promise.all([
    redisClient.get(currentKey),
    redisClient.get(historyKey),
  ]);

  let history: string[] = [];
  if (historyRaw) {
    try {
      const parsed = JSON.parse(historyRaw);
      if (Array.isArray(parsed)) {
        history = parsed.filter((item) => typeof item === 'string');
      }
    } catch (_error) {}
  }

  const merged = [current, ...history].filter((item): item is string => Boolean(item));
  const uniq = Array.from(new Set(merged));

  return uniq
    .map((item) => extractAESKey(item))
    .filter((item): item is string => Boolean(item));
}
