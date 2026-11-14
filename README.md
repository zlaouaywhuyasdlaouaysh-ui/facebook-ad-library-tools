<h1 align="center">Facebook 广告资料库工具</h1>

<p align="center">
  Facebook 广告资料库（Meta Ad Library）链接生成、链接解析、广告编号 / 主页编号批量提取。<br>
  命令行 + JS 库 + 油猴脚本，零依赖，MIT 开源。
</p>

<p align="center">
  <a href="https://33.ci/tools?utm_source=github&utm_medium=referral&utm_campaign=fb-ad-library-tools"><b>在线版（免安装）</b></a> ·
  <a href="README.en.md">English</a> ·
  <a href="https://github.com/zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-guide">Facebook 广告资料库中文指南</a> ·
  <a href="https://33.ci/?utm_source=github&utm_medium=referral&utm_campaign=fb-ad-library-tools">33.ci 广告监控</a>
</p>

---

做跨境电商、独立站、品牌出海，每天都要在 Facebook 广告资料库里查竞品广告。资料库的搜索条件全写在链接参数里：国家、投放状态、素材类型、平台、语言、开始投放日期。这个仓库把这些参数整理成了一份速查表，并提供三个小工具：

| 工具 | 干什么 |
|:--|:--|
| [`fbal` 命令行](#命令行) | 生成搜索链接、主页全部广告链接、单条广告链接；把一条资料库链接拆开逐项解释；从一段文本里批量提取广告编号和主页编号 |
| [JS 库](#js-库) | `buildUrl` / `parseUrl` / `extractIds`，可以嵌进你自己的表格、机器人、浏览器插件 |
| [油猴脚本](#油猴脚本) | 在资料库页面右下角显示当前搜索条件和主页编号，自动收集页面上所有广告的资料库编号，一键复制、打开、查投放状态 |

不想装任何东西：直接用在线版 [Facebook 广告资料库链接生成器](https://33.ci/tools/ad-library-link-generator?utm_source=github&utm_medium=referral&utm_campaign=fb-ad-library-tools) 和 [Facebook 广告状态查询](https://33.ci/tools/ad-status-checker?utm_source=github&utm_medium=referral&utm_campaign=fb-ad-library-tools)（输入广告编号，看还在不在投、投了多少天）。

## 链接参数速查表

广告资料库的地址是 `https://www.facebook.com/ads/library/`，后面跟这些参数：

| 想要 | 参数 | 取值 |
|:--|:--|:--|
| 按关键词搜（任意词匹配） | `q` + `search_type=keyword_unordered` | 文案里出现其中任意一个词就算，结果多但杂 |
| 精确短语 | `q` + `search_type=keyword_exact_phrase` | 文案里完整出现这串词才算，适合产品名、品牌口号 |
| 一个主页的全部广告 | `view_all_page_id` + `search_type=page` | 主页编号（Page ID），纯数字 |
| 单条广告 | `id` | 资料库编号（Library ID），纯数字；有了它其他参数都不用带 |
| 投放国家 | `country` | 两位国家代码，如 `US`、`GB`、`DE`；`ALL` 是全部国家 |
| 投放状态 | `active_status` | `active` 投放中 · `inactive` 已停投 · `all` 全部 |
| 广告类别 | `ad_type` | 商业广告用 `all`；政治类另有类别 |
| 素材类型 | `media_type` | `all` · `image` 图片 · `video` 视频 · `meme` 梗图 · `image_and_meme` 图片和梗图 · `none` 无图片和视频 |
| 投放平台 | `publisher_platforms[0]`、`publisher_platforms[1]`… | `facebook` · `instagram` · `messenger` · `audience_network` · `threads`；不带就是全部 |
| 广告文案语言 | `content_languages[0]` | `en` `es` `fr` `de` `pt` `it` `nl` `ja` `ko` `zh` `ar` `ru` `tr` `th` `vi` `id` |
| 开始投放日期 | `start_date[min]`、`start_date[max]` | `YYYY-MM-DD`，只看某段时间新上的广告 |
| （资料库自带） | `is_targeted_country` | 资料库自己生成的链接里是 `false`，照抄即可 |

### 常用链接模板

```text
# 单条广告（把编号换成你的）
https://www.facebook.com/ads/library/?id=1583920114729930

# 一个主页的全部广告（全部国家、全部状态）
https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&is_targeted_country=false&media_type=all&search_type=page&view_all_page_id=主页编号

# 美国市场、投放中、视频、关键词 dog bed
https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=video&q=dog%20bed&search_type=keyword_unordered

# 只看 Instagram 上、英文文案、11 月 1 日以后新上的精确短语
https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=free%20shipping&search_type=keyword_exact_phrase&content_languages[0]=en&publisher_platforms[0]=instagram&start_date[min]=2026-11-01&start_date[max]=
```

### 编号去哪找

- **资料库编号（Library ID）**：每张广告卡片顶部的「资料库编号：XXXXXXXX」，一串十几位的数字。详见 [广告资料库编号是什么，怎么用编号直接打开广告](https://github.com/zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-guide/blob/main/docs/09-ad-library-ad-id.md)。
- **主页编号（Page ID）**：在资料库里点进某个主页的广告列表，地址栏 `view_all_page_id=` 后面的数字；或者在对方主页的「主页透明度」里看。详见 [怎么找 Facebook 主页编号](https://github.com/zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-guide/blob/main/docs/10-find-facebook-page-id.md)。

## 命令行

需要 Node.js 18.3 或更高版本。

```bash
# 不安装，直接用
npx github:zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-tools search dog bed -c US -s active -m video

# 或者装到全局
npm install -g github:zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-tools
```

```console
$ fbal search dog bed -c us -s active -m video -p instagram,facebook -l en --from 2026-11-01
https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=video&q=dog%20bed&search_type=keyword_unordered&content_languages[0]=en&publisher_platforms[0]=instagram&publisher_platforms[1]=facebook&start_date[min]=2026-11-01&start_date[max]=

$ fbal page "https://www.facebook.com/ads/library/?view_all_page_id=123456789012345" -s active
https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&is_targeted_country=false&media_type=all&search_type=page&view_all_page_id=123456789012345

$ fbal ad 1583920114729930
https://www.facebook.com/ads/library/?id=1583920114729930
状态查询 / status: https://33.ci/tools/ad-status-checker?id=1583920114729930&utm_source=fbal-cli&utm_medium=referral

$ fbal parse "https://www.facebook.com/ads/library/?active_status=active&country=US&media_type=video&q=dog%20bed&search_type=keyword_exact_phrase&start_date[min]=2026-11-01"
搜什么        精确短语
关键词        dog bed
投放国家      US
投放状态      投放中
素材类型      视频
平台          全部
广告语言      不限
开始投放日期  2026-11-01 ~ …

# 从聊天记录、表格、网页复制的文本里批量提取编号
$ fbal ids 竞品链接.txt
ad	2201234567890123
page	123456789012345
```

| 命令 | 说明 |
|:--|:--|
| `fbal search <关键词>` | 关键词搜索链接；加 `--phrase` 变精确短语 |
| `fbal page <主页编号或链接>` | 主页全部广告链接 |
| `fbal ad <资料库编号或链接>` | 单条广告链接 + 在线状态查询链接 |
| `fbal parse <链接>` | 逐项解释链接参数；`--en` 输出英文 |
| `fbal ids [文件]` | 提取广告编号、主页编号；不给文件就读标准输入 |

筛选参数：`-c/--country`、`-s/--status`、`-m/--media`、`-p/--platform`（可逗号分隔或重复）、`-l/--lang`、`--from`、`--to`。所有命令都支持 `--json`。

## JS 库

```js
import { buildUrl, parseUrl, extractIds, explain, statusCheckerUrl } from 'facebook-ad-library-tools';

buildUrl({ query: 'cat tree', country: 'US', status: 'active', media: 'video' });
// → https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&...

buildUrl({ mode: 'page', query: '123456789012345' });   // 主页全部广告
buildUrl({ mode: 'ad', query: '1583920114729930' });    // 单条广告

parseUrl('https://www.facebook.com/ads/library/?id=1583920114729930');
// → { mode: 'ad', query: '1583920114729930', country: 'ALL', ... }

extractIds('资料库编号：2201234567890123 https://www.facebook.com/ads/library/?view_all_page_id=123456789012345');
// → { adIds: ['2201234567890123'], pageIds: ['123456789012345'] }

explain(parseUrl(url), 'zh');        // [['投放国家', 'US'], ...]
statusCheckerUrl('1583920114729930'); // 在线查这条广告还在不在投
```

`buildUrl` 遇到不合法的输入（编号不是 6–25 位数字、国家代码不对、日期格式不对、开始日期晚于结束日期）会抛 `TypeError`，错误信息说明原因。

## 油猴脚本

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或 Violentmonkey。
2. 打开 [fb-ad-library-helper.user.js](https://raw.githubusercontent.com/zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-tools/main/userscript/fb-ad-library-helper.user.js)，点「安装」。
3. 打开 Facebook 广告资料库，右下角会出现「广告资料库助手」面板：
   - 当前链接的搜索条件逐项翻译成中文，主页编号一键复制；
   - 往下滚动加载广告时，自动收集页面上出现的所有资料库编号；
   - 每个编号可以复制、单独打开、跳到在线状态查询；「复制全部」可以直接粘进表格。

脚本只读取当前页面的文字和地址，不发任何网络请求，不收集数据。

## 常见问题

**打开链接要登录 Facebook 吗？** 一般不用，广告资料库是公开的。个别地区或网络环境下会要求登录或验证，换网络再试。

**为什么搜出来是 0 条？** 最常见的是国家选窄了、选了「投放中」但对方已经停投，或者关键词只在图片里、不在文案里。先放宽到 `country=ALL`、`active_status=all` 再试。详见 [为什么在广告资料库里搜不到某个主页或广告](https://github.com/zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-guide/blob/main/docs/05-why-ads-not-showing-in-ad-library.md)。

**能看到广告花了多少钱吗？** 普通商业广告看不到花费和展示量；资料库只对政治类广告、投放到欧盟的广告公开部分覆盖和展示数据。详见 [Facebook 广告资料库能看到广告花费和展示量吗](https://github.com/zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-guide/blob/main/docs/07-ad-library-ad-spend.md)。

**生成的链接会过期吗？** 不会。链接只是把搜索条件写进地址里，什么时候打开都是当时的最新结果。想留住某个时间点的样子，要当时就把广告存下来。

**我想每天盯着对手有没有上新广告、哪条停投了？** 资料库只显示当下状态，不告诉你昨天到今天变了什么。可以用 [33.ci 广告监控](https://33.ci/?utm_source=github&utm_medium=referral&utm_campaign=fb-ad-library-tools)：把主页或广告加进去，新上、停投、改素材、改文案时通知你。

## 相关

- [Facebook 广告资料库中文指南](https://github.com/zlaouaywhuyasdlaouaysh-ui/facebook-ad-library-guide)：从打开资料库到判断爆款、保存素材、按品类和市场找广告，20 章
- [33.ci 免费工具](https://33.ci/tools?utm_source=github&utm_medium=referral&utm_campaign=fb-ad-library-tools)：在线链接生成器、广告状态查询
- [33.ci 教程](https://33.ci/guides?utm_source=github&utm_medium=referral&utm_campaign=fb-ad-library-tools)：完整图文版教程

## 开发

```bash
npm test   # node:test，无需安装依赖
```

## 许可

MIT © [33.ci](https://33.ci/?utm_source=github&utm_medium=referral&utm_campaign=fb-ad-library-tools)。本项目与 Meta Platforms, Inc. 无关联；Facebook、Instagram、Meta 是其各自所有者的商标。
