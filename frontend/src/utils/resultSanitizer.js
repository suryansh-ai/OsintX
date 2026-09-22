const BOT_LINE_PATTERNS = [
  /please\s+note\s+that\s+you\s+use\s+the\s+free\s+version/i,
  /buying\s+a\s+subscription\s+reduces/i,
  /mirror\s*\(.*(?:removal|bot).*\)/i,
  /@\w*bot\b/i,
  /\b\w*bot\b/i,
  /(?:telegram|телеграм).{0,30}(?:bot|бот)/i,
  /^\s*(?:source|источник)\s*:/i,
];

const BOT_KEY_PATTERNS = [
  /^bot(?:Username|Name|Id|ID)?$/i,
  /botUsername/i,
  /botName/i,
  /sourceBot/i,
  /providerBot/i,
  /shnuzzi/i,
];

const BOT_INLINE_PATTERNS = [
  /@\w*bot\b/gi,
  /\bshnuzzi(?:[_\s-]*bot)?\b/gi,
  /\btelegram\s+bot\b/gi,
  /\bbot\b/gi,
];

const TOOL_NAME_ALIASES = [
  [/^shnuzzi[_\s-]*/i, ''],
  [/\s+bot$/i, ''],
];

export const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;

  const lines = value.split('\n').filter((line) => {
    const compact = line.replace(/[*_`]/g, '').trim();
    if (!compact) return true;
    return !BOT_LINE_PATTERNS.some((pattern) => pattern.test(compact));
  });

  return lines
    .join('\n')
    .replace(BOT_INLINE_PATTERNS[0], '')
    .replace(BOT_INLINE_PATTERNS[1], '')
    .replace(BOT_INLINE_PATTERNS[2], 'data provider')
    .replace(BOT_INLINE_PATTERNS[3], 'provider')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const sanitizeToolName = (value) => {
  if (!value) return value;
  let text = sanitizeString(String(value));
  for (const [pattern, replacement] of TOOL_NAME_ALIASES) {
    text = text.replace(pattern, replacement);
  }
  return text
    .replace(/[_-]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const sanitizeResultData = (value, seen = new WeakSet()) => {
  if (value == null) return value;
  if (typeof value === 'string') return sanitizeString(value);
  if (typeof value !== 'object') return value;

  if (seen.has(value)) return undefined;
  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeResultData(item, seen))
      .filter((item) => item !== undefined && item !== '');
  }

  return Object.entries(value).reduce((acc, [key, raw]) => {
    if (BOT_KEY_PATTERNS.some((pattern) => pattern.test(key))) return acc;
    const cleanKey = sanitizeToolName(key) || key;
    const cleanValue = sanitizeResultData(raw, seen);
    if (cleanValue === undefined || cleanValue === '') return acc;
    acc[cleanKey] = cleanValue;
    return acc;
  }, {});
};

export const stringifySanitized = (value, space = 2) => {
  const clean = sanitizeResultData(value);
  if (clean == null) return '';
  if (typeof clean === 'string') return clean;
  try { return JSON.stringify(clean, null, space); } catch { return String(clean); }
};

export default sanitizeResultData;
