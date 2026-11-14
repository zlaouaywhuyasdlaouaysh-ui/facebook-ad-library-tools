// Facebook Ad Library (Meta Ad Library) URL builder, parser and ID extractor.
// Zero dependencies; works in Node.js >= 18 and modern browsers.

export const AD_LIBRARY_URL = 'https://www.facebook.com/ads/library/';
export const STATUS_CHECKER_URL = 'https://33.ci/tools/ad-status-checker';

export const MODES = ['keyword', 'phrase', 'page', 'ad'];

export const STATUSES = {
  all: { zh: '全部', en: 'All' },
  active: { zh: '投放中', en: 'Active' },
  inactive: { zh: '已停投', en: 'Inactive' },
};

export const MEDIA_TYPES = {
  all: { zh: '全部', en: 'All media' },
  image: { zh: '图片', en: 'Images' },
  video: { zh: '视频', en: 'Videos' },
  meme: { zh: '梗图', en: 'Memes' },
  image_and_meme: { zh: '图片和梗图', en: 'Images and memes' },
  none: { zh: '无图片和视频', en: 'No image or video' },
};

export const PLATFORMS = {
  facebook: { zh: 'Facebook', en: 'Facebook' },
  instagram: { zh: 'Instagram', en: 'Instagram' },
  messenger: { zh: 'Messenger', en: 'Messenger' },
  audience_network: { zh: 'Audience Network', en: 'Audience Network' },
  threads: { zh: 'Threads', en: 'Threads' },
};

export const LANGUAGES = {
  en: { zh: '英语', en: 'English' },
  es: { zh: '西班牙语', en: 'Spanish' },
  fr: { zh: '法语', en: 'French' },
  de: { zh: '德语', en: 'German' },
  pt: { zh: '葡萄牙语', en: 'Portuguese' },
  it: { zh: '意大利语', en: 'Italian' },
  nl: { zh: '荷兰语', en: 'Dutch' },
  ja: { zh: '日语', en: 'Japanese' },
  ko: { zh: '韩语', en: 'Korean' },
  zh: { zh: '中文', en: 'Chinese' },
  ar: { zh: '阿拉伯语', en: 'Arabic' },
  ru: { zh: '俄语', en: 'Russian' },
  tr: { zh: '土耳其语', en: 'Turkish' },
  th: { zh: '泰语', en: 'Thai' },
  vi: { zh: '越南语', en: 'Vietnamese' },
  id: { zh: '印尼语', en: 'Indonesian' },
};

const ID_RE = /^\d{6,25}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;
const has = (table, key) => typeof key === 'string' && Object.hasOwn(table, key);

export function defaults() {
  return {
    mode: 'keyword',
    query: '',
    country: 'ALL',
    status: 'all',
    media: 'all',
    platforms: [],
    language: '',
    from: '',
    to: '',
  };
}

export function isId(value) {
  return ID_RE.test(String(value ?? '').trim());
}

function normalizeCountry(value) {
  const code = String(value ?? '').trim().toUpperCase();
  return code === 'ALL' || COUNTRY_RE.test(code) ? code : null;
}

/**
 * Build an Ad Library URL.
 * @param {object} input  see defaults(); mode is keyword | phrase | page | ad
 * @returns {string}
 * @throws {TypeError} on invalid input
 */
export function buildUrl(input) {
  const o = { ...defaults(), ...input };
  const query = String(o.query ?? '').trim();
  if (!MODES.includes(o.mode)) throw new TypeError(`unknown mode "${o.mode}"; use ${MODES.join(' | ')}`);
  if (!query) throw new TypeError('query is required (keyword, page ID or ad ID)');

  if (o.mode === 'ad') {
    if (!isId(query)) throw new TypeError('ad ID (Library ID) must be 6-25 digits');
    return `${AD_LIBRARY_URL}?id=${query}`;
  }
  if (o.mode === 'page' && !isId(query)) throw new TypeError('page ID must be 6-25 digits');

  const country = normalizeCountry(o.country);
  if (!country) throw new TypeError(`country must be ALL or a two-letter code, got "${o.country}"`);
  if (!has(STATUSES, o.status)) throw new TypeError(`status must be one of ${Object.keys(STATUSES).join(', ')}`);
  if (!has(MEDIA_TYPES, o.media)) throw new TypeError(`media must be one of ${Object.keys(MEDIA_TYPES).join(', ')}`);
  if (o.language && !has(LANGUAGES, o.language)) throw new TypeError(`language must be one of ${Object.keys(LANGUAGES).join(', ')}`);
  for (const p of o.platforms) {
    if (!has(PLATFORMS, p)) throw new TypeError(`platform must be one of ${Object.keys(PLATFORMS).join(', ')}`);
  }
  for (const [name, value] of [['from', o.from], ['to', o.to]]) {
    if (value && !DATE_RE.test(value)) throw new TypeError(`${name} must be YYYY-MM-DD`);
  }
  if (o.from && o.to && o.from > o.to) throw new TypeError('from is later than to');

  const params = [
    `active_status=${o.status}`,
    'ad_type=all',
    `country=${country}`,
    'is_targeted_country=false',
    `media_type=${o.media}`,
  ];
  if (o.mode === 'page') {
    params.push('search_type=page', `view_all_page_id=${query}`);
  } else {
    params.push(
      `q=${encodeURIComponent(query)}`,
      `search_type=${o.mode === 'phrase' ? 'keyword_exact_phrase' : 'keyword_unordered'}`,
    );
  }
  if (o.language) params.push(`content_languages[0]=${o.language}`);
  [...new Set(o.platforms)].forEach((p, i) => params.push(`publisher_platforms[${i}]=${p}`));
  if (o.from || o.to) params.push(`start_date[min]=${o.from}`, `start_date[max]=${o.to}`);
  return `${AD_LIBRARY_URL}?${params.join('&')}`;
}

/**
 * Parse an Ad Library URL (or a bare Library ID) back into builder options.
 * Unknown parameter values fall back to defaults.
 * @returns {object|null} null when the input is not an Ad Library URL or ID
 */
export function parseUrl(input) {
  const text = String(input ?? '').trim();
  if (isId(text)) return { ...defaults(), mode: 'ad', query: text };

  let url;
  try {
    url = new URL(text.includes('://') ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (!/(^|\.)facebook\.com$/i.test(url.hostname) || !url.pathname.startsWith('/ads/library')) return null;

  const p = url.searchParams;
  const o = defaults();
  const adId = p.get('id') ?? '';
  if (isId(adId)) return { ...o, mode: 'ad', query: adId };

  const pageId = p.get('view_all_page_id') ?? '';
  if (isId(pageId)) {
    o.mode = 'page';
    o.query = pageId;
  } else {
    o.mode = p.get('search_type') === 'keyword_exact_phrase' ? 'phrase' : 'keyword';
    o.query = p.get('q') ?? '';
  }
  o.country = normalizeCountry(p.get('country') ?? 'ALL') ?? 'ALL';
  const status = p.get('active_status');
  if (has(STATUSES, status)) o.status = status;
  const media = p.get('media_type');
  if (has(MEDIA_TYPES, media)) o.media = media;
  const language = p.get('content_languages[0]') ?? '';
  if (has(LANGUAGES, language)) o.language = language;
  for (const [key, value] of p) {
    const platform = value.toLowerCase();
    if (key.startsWith('publisher_platforms[') && has(PLATFORMS, platform) && !o.platforms.includes(platform)) {
      o.platforms.push(platform);
    }
  }
  const from = p.get('start_date[min]') ?? '';
  const to = p.get('start_date[max]') ?? '';
  if (DATE_RE.test(from)) o.from = from;
  if (DATE_RE.test(to)) o.to = to;
  return o;
}

const MODE_LABELS = {
  keyword: { zh: '关键词（任意词匹配）', en: 'Keyword (any word)' },
  phrase: { zh: '精确短语', en: 'Exact phrase' },
  page: { zh: '主页全部广告', en: 'All ads of a Page' },
  ad: { zh: '单条广告', en: 'Single ad' },
};

/**
 * Human-readable rows describing parsed options.
 * @param {object} o  result of parseUrl()
 * @param {'zh'|'en'} lang
 * @returns {Array<[string, string]>}
 */
export function explain(o, lang = 'zh') {
  const zh = lang === 'zh';
  const label = (table, key) => table[key]?.[lang] ?? key;
  const rows = [[zh ? '搜什么' : 'Search', label(MODE_LABELS, o.mode)]];
  if (o.mode === 'ad') return [...rows, [zh ? '资料库编号' : 'Library ID', o.query]];
  rows.push([o.mode === 'page' ? (zh ? '主页编号' : 'Page ID') : (zh ? '关键词' : 'Query'), o.query || '—']);
  rows.push([zh ? '投放国家' : 'Country', o.country === 'ALL' ? (zh ? '全部国家 / 地区' : 'All countries') : o.country]);
  rows.push([zh ? '投放状态' : 'Status', label(STATUSES, o.status)]);
  rows.push([zh ? '素材类型' : 'Media type', label(MEDIA_TYPES, o.media)]);
  rows.push([zh ? '平台' : 'Platforms', o.platforms.length ? o.platforms.map((p) => label(PLATFORMS, p)).join(', ') : (zh ? '全部' : 'All')]);
  rows.push([zh ? '广告语言' : 'Language', o.language ? label(LANGUAGES, o.language) : (zh ? '不限' : 'Any')]);
  if (o.from || o.to) rows.push([zh ? '开始投放日期' : 'Start date', `${o.from || '…'} ~ ${o.to || '…'}`]);
  return rows;
}

/**
 * Find ad Library IDs and Page IDs in free text: Ad Library URLs and
 * "Library ID: …" / "资料库编号：…" labels copied from the Ad Library page.
 * @returns {{adIds: string[], pageIds: string[]}}
 */
export function extractIds(text) {
  const adIds = new Set();
  const pageIds = new Set();
  const source = String(text ?? '');
  for (const match of source.matchAll(/(?:https?:\/\/)?(?:[\w-]+\.)*facebook\.com\/ads\/library\/?\?[^\s"'<>)]+/gi)) {
    const parsed = parseUrl(match[0]);
    if (parsed?.mode === 'ad') adIds.add(parsed.query);
    if (parsed?.mode === 'page') pageIds.add(parsed.query);
  }
  for (const match of source.matchAll(/(?:Library ID|资料库编号|資料庫編號)\s*[:：#]?\s*(\d{6,25})/gi)) {
    adIds.add(match[1]);
  }
  return { adIds: [...adIds], pageIds: [...pageIds] };
}

/** Link to the free online status checker (is the ad still running, days running). */
export function statusCheckerUrl(adId, source = 'github') {
  const id = String(adId ?? '').trim();
  if (!isId(id)) throw new TypeError('ad ID (Library ID) must be 6-25 digits');
  return `${STATUS_CHECKER_URL}?id=${id}&utm_source=${encodeURIComponent(source)}&utm_medium=referral`;
}
