# Facebook Ad Library Tools

Build, parse and explain **Facebook Ad Library (Meta Ad Library) URLs**, and bulk-extract ad Library IDs and Page IDs from any text. CLI + JavaScript library + userscript. Zero dependencies, MIT.

[中文说明](README.md) · [Online tools, no install](https://33.ci/tools?utm_source=github&utm_medium=referral&utm_campaign=fb-ad-library-tools) · [33.ci ad monitoring](https://33.ci/?utm_source=github&utm_medium=referral&utm_campaign=fb-ad-library-tools)

## Ad Library URL parameters

Base URL: `https://www.facebook.com/ads/library/`

| Goal | Parameter | Values |
|:--|:--|:--|
| Keyword search (any word) | `q` + `search_type=keyword_unordered` | Matches ads whose text contains any of the words |
| Exact phrase | `q` + `search_type=keyword_exact_phrase` | Matches the whole phrase; good for product names and slogans |
| All ads of a Page | `view_all_page_id` + `search_type=page` | Numeric Page ID |
| Single ad | `id` | Numeric Library ID; no other parameters needed |
| Country | `country` | Two-letter code (`US`, `GB`, `DE` …) or `ALL` |
| Status | `active_status` | `active`, `inactive`, `all` |
| Ad category | `ad_type` | `all` for commercial ads |
| Media type | `media_type` | `all`, `image`, `video`, `meme`, `image_and_meme`, `none` |
| Platforms | `publisher_platforms[0]`, `publisher_platforms[1]` … | `facebook`, `instagram`, `messenger`, `audience_network`, `threads` |
| Ad language | `content_languages[0]` | `en` `es` `fr` `de` `pt` `it` `nl` `ja` `ko` `zh` `ar` `ru` `tr` `th` `vi` `id` |
| Start date range | `start_date[min]`, `start_date[max]` | `YYYY-MM-DD` |
| (set by the Ad Library) | `is_targeted_country` | `false` in URLs the Ad Library generates |

```text
# One ad
https://www.facebook.com/ads/library/?id=1583920114729930

# Every ad of a Page, all countries, all statuses
https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&is_targeted_country=false&media_type=all&search_type=page&view_all_page_id=PAGE_ID

# Active US video ads mentioning "dog bed"
https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=video&q=dog%20bed&search_type=keyword_unordered
```

## CLI

Node.js 18.3+.

```bash
# npm 12+ blocks git installs by default, hence --allow-git=all
npx --allow-git=all github:zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-tools search dog bed -c US -s active -m video
```

```console
$ fbal ad 1583920114729930
https://www.facebook.com/ads/library/?id=1583920114729930
状态查询 / status: https://33.ci/tools/ad-status-checker?id=1583920114729930&utm_source=fbal-cli&utm_medium=referral

$ fbal parse --en "https://www.facebook.com/ads/library/?id=1583920114729930"
Search      Single ad
Library ID  1583920114729930

$ pbpaste | fbal ids          # pull every Library ID / Page ID out of copied text
```

Commands: `search`, `page`, `ad`, `parse`, `ids`. Filters: `-c/--country`, `-s/--status`, `-m/--media`, `-p/--platform`, `-l/--lang`, `--from`, `--to`, `--phrase`. Every command accepts `--json`.

## Library

```js
import { buildUrl, parseUrl, extractIds, explain, statusCheckerUrl } from 'facebook-ad-library-tools';

buildUrl({ query: 'cat tree', country: 'US', status: 'active', media: 'video' });
buildUrl({ mode: 'page', query: '123456789012345' });
parseUrl('https://www.facebook.com/ads/library/?id=1583920114729930'); // { mode: 'ad', ... }
extractIds('Library ID: 2201234567890123');                              // { adIds: [...], pageIds: [] }
explain(parseUrl(url), 'en');                                            // [['Country', 'US'], ...]
```

`buildUrl` throws `TypeError` with a readable message on invalid IDs, country codes or dates.

## Userscript

Install [Tampermonkey](https://www.tampermonkey.net/), then open [fb-ad-library-helper.user.js](https://raw.githubusercontent.com/zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-tools/main/userscript/fb-ad-library-helper.user.js). On the Ad Library a panel shows the current filters and Page ID, and collects every Library ID on the page with copy, open and status-check links. The panel is in Chinese. It reads only the current page and makes no network requests.

## FAQ

- **Do I need to log in?** Usually not; the Ad Library is public.
- **Zero results?** Widen to `country=ALL` and `active_status=all`; the keyword may only appear inside the image.
- **Spend and impressions?** Only for political/issue ads and ads delivered in the EU.
- **Want alerts when a competitor launches or stops an ad?** The Ad Library shows only the current state. [33.ci](https://33.ci/?utm_source=github&utm_medium=referral&utm_campaign=fb-ad-library-tools) monitors Pages and ads and notifies you of changes.

## License

MIT © [33.ci](https://33.ci/?utm_source=github&utm_medium=referral&utm_campaign=fb-ad-library-tools). Not affiliated with Meta Platforms, Inc.
