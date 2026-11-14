#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { buildUrl, parseUrl, explain, extractIds, statusCheckerUrl } from '../src/index.js';

const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

const HELP = `fbal ${VERSION} · Facebook 广告资料库链接工具 / Meta Ad Library URL tool

用法 Usage:
  fbal search <关键词>     按关键词生成搜索链接 / keyword search URL
  fbal page <主页编号|链接>  主页全部广告 / all ads of a Page
  fbal ad <资料库编号|链接>  单条广告 + 状态查询链接 / single ad + status checker
  fbal parse <链接>        解释链接里的每个参数 / explain an Ad Library URL
  fbal ids [文件]          从文本里提取广告编号、主页编号（默认读 stdin）

筛选 Filters (search / page):
  -c, --country <US|ALL>   投放国家，两位代码，默认 ALL
  -s, --status <all|active|inactive>
  -m, --media <all|image|video|meme|image_and_meme|none>
  -p, --platform <facebook,instagram,messenger,audience_network,threads>
  -l, --lang <en|es|fr|de|...>  广告文案语言
      --from <YYYY-MM-DD>  开始投放日期下限
      --to <YYYY-MM-DD>    开始投放日期上限
      --phrase             精确短语匹配 (search_type=keyword_exact_phrase)

输出 Output:
      --json               JSON 输出
      --en                 English labels for "parse"
  -h, --help / -v, --version

在线版（免安装）/ Online: https://33.ci/tools?utm_source=github&utm_medium=cli
`;

function fail(message) {
  process.stderr.write(`fbal: ${message}\n`);
  process.exit(1);
}

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function idFrom(arg, kind) {
  if (!arg) fail(`missing ${kind}`);
  const parsed = parseUrl(arg);
  if (parsed && (kind === 'page ID' ? parsed.mode === 'page' : parsed.mode === 'ad')) return parsed.query;
  return arg.trim();
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    country: { type: 'string', short: 'c' },
    status: { type: 'string', short: 's' },
    media: { type: 'string', short: 'm' },
    platform: { type: 'string', short: 'p', multiple: true },
    lang: { type: 'string', short: 'l' },
    from: { type: 'string' },
    to: { type: 'string' },
    phrase: { type: 'boolean' },
    json: { type: 'boolean' },
    en: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
  },
});

if (values.version) {
  process.stdout.write(`${VERSION}\n`);
  process.exit(0);
}
const [command, ...rest] = positionals;
if (values.help || !command) {
  process.stdout.write(HELP);
  process.exit(values.help ? 0 : 1);
}

const filters = {
  country: (values.country ?? 'ALL').toUpperCase(),
  status: values.status ?? 'all',
  media: values.media ?? 'all',
  platforms: (values.platform ?? []).flatMap((v) => v.split(',')).map((v) => v.trim().toLowerCase()).filter(Boolean),
  language: values.lang ?? '',
  from: values.from ?? '',
  to: values.to ?? '',
};

function print(result, text) {
  process.stdout.write(values.json ? `${JSON.stringify(result, null, 2)}\n` : `${text}\n`);
}

try {
  switch (command) {
    case 'search': {
      const query = rest.join(' ');
      const url = buildUrl({ ...filters, mode: values.phrase ? 'phrase' : 'keyword', query });
      print({ url }, url);
      break;
    }
    case 'page': {
      const url = buildUrl({ ...filters, mode: 'page', query: idFrom(rest[0], 'page ID') });
      print({ url }, url);
      break;
    }
    case 'ad': {
      const id = idFrom(rest[0], 'ad ID');
      const url = buildUrl({ mode: 'ad', query: id });
      const status = statusCheckerUrl(id, 'fbal-cli');
      print({ id, url, status }, `${url}\n状态查询 / status: ${status}`);
      break;
    }
    case 'parse': {
      const parsed = parseUrl(rest.join(' '));
      if (!parsed) fail('not a facebook.com/ads/library URL or Library ID');
      const rows = explain(parsed, values.en ? 'en' : 'zh');
      const cells = (s) => [...s].reduce((n, ch) => n + (ch.codePointAt(0) >= 0x2e80 ? 2 : 1), 0);
      const width = Math.max(...rows.map(([k]) => cells(k)));
      print(parsed, rows.map(([k, v]) => `${k}${' '.repeat(width - cells(k))}  ${v}`).join('\n'));
      break;
    }
    case 'ids': {
      const text = rest[0] ? readFileSync(rest[0], 'utf8') : readStdin();
      const ids = extractIds(text);
      const lines = [
        ...ids.adIds.map((id) => `ad\t${id}`),
        ...ids.pageIds.map((id) => `page\t${id}`),
      ];
      print(ids, lines.join('\n'));
      break;
    }
    default:
      fail(`unknown command "${command}" (fbal --help)`);
  }
} catch (error) {
  if (error instanceof TypeError) fail(error.message);
  throw error;
}
