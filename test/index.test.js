import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUrl, parseUrl, extractIds, statusCheckerUrl } from '../src/index.js';

const BASE = 'https://www.facebook.com/ads/library/';

test('keyword search URL matches the Ad Library format', () => {
  assert.equal(
    buildUrl({ query: 'dog bed', country: 'us', status: 'active', media: 'video' }),
    `${BASE}?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=video&q=dog%20bed&search_type=keyword_unordered`,
  );
});

test('phrase, language, platforms and dates', () => {
  const url = buildUrl({
    mode: 'phrase',
    query: 'free shipping',
    platforms: ['instagram', 'facebook', 'instagram'],
    language: 'en',
    from: '2026-11-01',
    to: '2026-11-14',
  });
  assert.equal(
    url,
    `${BASE}?active_status=all&ad_type=all&country=ALL&is_targeted_country=false&media_type=all&q=free%20shipping&search_type=keyword_exact_phrase&content_languages[0]=en&publisher_platforms[0]=instagram&publisher_platforms[1]=facebook&start_date[min]=2026-11-01&start_date[max]=2026-11-14`,
  );
});

test('page and ad modes', () => {
  assert.equal(
    buildUrl({ mode: 'page', query: '123456789012345' }),
    `${BASE}?active_status=all&ad_type=all&country=ALL&is_targeted_country=false&media_type=all&search_type=page&view_all_page_id=123456789012345`,
  );
  assert.equal(buildUrl({ mode: 'ad', query: '1583920114729930' }), `${BASE}?id=1583920114729930`);
});

test('invalid input is rejected with a message', () => {
  assert.throws(() => buildUrl({ query: '' }), /query is required/);
  assert.throws(() => buildUrl({ mode: 'ad', query: '12ab' }), /6-25 digits/);
  assert.throws(() => buildUrl({ mode: 'page', query: 'nike' }), /6-25 digits/);
  assert.throws(() => buildUrl({ query: 'x', country: 'USA' }), /two-letter/);
  assert.throws(() => buildUrl({ query: 'x', status: 'toString' }), /status/);
  assert.throws(() => buildUrl({ query: 'x', from: '2026-11-14', to: '2026-11-01' }), /later/);
});

test('parseUrl round-trips builder output', () => {
  const input = {
    mode: 'phrase',
    query: 'cat tree & scratcher',
    country: 'DE',
    status: 'inactive',
    media: 'image_and_meme',
    platforms: ['threads'],
    language: 'de',
    from: '2026-01-01',
    to: '',
  };
  assert.deepEqual(parseUrl(buildUrl(input)), input);
});

test('parseUrl accepts bare IDs, scheme-less and mobile URLs, rejects others', () => {
  assert.equal(parseUrl('1583920114729930').mode, 'ad');
  assert.equal(parseUrl('facebook.com/ads/library/?id=1583920114729930').query, '1583920114729930');
  const page = parseUrl('https://m.facebook.com/ads/library/?view_all_page_id=987654321&country=us&active_status=bogus');
  assert.equal(page.mode, 'page');
  assert.equal(page.country, 'US');
  assert.equal(page.status, 'all');
  assert.equal(parseUrl('https://www.facebook.com/nike'), null);
  assert.equal(parseUrl('https://evil-facebook.com/ads/library/?id=1583920114729930'), null);
});

test('extractIds finds IDs in URLs and copied card text', () => {
  const text = `
    看这条 https://www.facebook.com/ads/library/?id=1583920114729930 还有
    资料库编号：2201234567890123
    Library ID: 3301234567890123
    主页 https://www.facebook.com/ads/library/?active_status=all&search_type=page&view_all_page_id=123456789012345)
    重复 https://www.facebook.com/ads/library/?id=1583920114729930
  `;
  assert.deepEqual(extractIds(text), {
    adIds: ['1583920114729930', '2201234567890123', '3301234567890123'],
    pageIds: ['123456789012345'],
  });
});

test('statusCheckerUrl validates the ID', () => {
  assert.equal(
    statusCheckerUrl('1583920114729930'),
    'https://33.ci/tools/ad-status-checker?id=1583920114729930&utm_source=github&utm_medium=referral',
  );
  assert.throws(() => statusCheckerUrl('abc'), /6-25 digits/);
});
