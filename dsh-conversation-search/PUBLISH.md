# 发布指南：把对话搜索插件发到公共仓库

这份文档给的是可执行步骤，假设你已经确认插件在本地可用（当前状态）。

> 关键前提：本插件是**纯 Client 插件**，`client.js` 本身就是浏览器可直接加载的 bundle
> （`window.__ModuleLoader__.load({ id, factory })` 格式），**不需要构建步骤**。
> 所以 `npm publish` 直接发源文件即可，用户装到就是可运行的代码。

---

## 0. 先选发布形态

| 形态 | 用户怎么装 | 适合 |
|---|---|---|
| **npm 公共包**（推荐） | `dsh plugin --profile <profile> add <包名>` | 通用分发，无需构建权限 |
| 插件索引（Discover） | 在 Plugins → Discover 里添加你的 `index.json` URL | 让用户「逛」到你的插件 |
| GitHub 直装 | `dsh plugin add github:you/repo` | 不想发 npm，但需要 `prepare` 构建脚本 + 用户手动放行构建，体验差 |

推荐组合：**npm 包 + 一个插件索引**。两者都不需要用户做任何特殊授权。

---

## 1. 发布前必须改的 `package.json`

当前文件是为了本地 link 安装写的（`name: "@local/conversation-search"`、`private: true`），
发布前至少改这些字段：

| 字段 | 现在 | 改成 | 原因 |
|---|---|---|---|
| `name` | `@local/conversation-search` | `dsh-conversation-search` 或 `@你的scope/dsh-conversation-search` | `@local/` 是本地约定，npm 上不存在这个 scope |
| `private` | `true` | **删掉这一行** | npm 拒绝发布 private 包，插件市场生成器也会跳过 |
| `license` | 无 | `"MIT"` | 已在目录里放了 `LICENSE` |
| `repository` | 无 | `{ "type": "git", "url": "https://github.com/you/dsh-conversation-search" }` | 用户能看到源码 |
| `engines.dsh` | 无 | `">=0.2.2-rc.1"` | 本插件用到 0.2.2 才有的 `ctx.shortcuts` / `shell.overlay`；DSH 安装时会校验 |
| `keywords` | 无 | `["dsh", "deepseek-harness", "search", "conversation"]` | 插件索引靠它做搜索匹配 |
| `author` | 无 | 你的名字 | 显示在插件卡片上 |
| `homepage` | 无 | 仓库地址或文档地址 | 可选，便于用户了解 |

改完的 `package.json` 大致长这样（可直接替换）：

```json
{
  "name": "dsh-conversation-search",
  "version": "0.1.0",
  "description": "Adds Cmd/Ctrl+F-style full-text search over the current conversation in the DeepSeek Harness Web UI.",
  "type": "module",
  "license": "MIT",
  "author": "你的名字",
  "repository": { "type": "git", "url": "https://github.com/you/dsh-conversation-search" },
  "homepage": "https://github.com/you/dsh-conversation-search#readme",
  "keywords": ["dsh", "deepseek-harness", "search", "conversation", "find"],
  "engines": { "dsh": ">=0.2.2-rc.1" },
  "exports": {
    ".": "./index.js",
    "./client": "./client.js",
    "./locale/*.json": "./locale/*.json",
    "./icon": "./icon.svg"
  },
  "files": [
    "index.js", "client.js", "cordis.patch.yml",
    "locale/*.json", "icon.svg", "README.md", "LICENSE"
  ],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "immediately": true,
      "inject": [
        "@deepseek-ai/dsh-client-shortcuts",
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-ui-layout",
        "@deepseek-ai/dsh-client-ui-conversation"
      ]
    }
  }
}
```

> 改了 `name` 之后，本地这份 link 安装会失联（profile 里记的是旧包名）。
> 重新安装一次即可：先 `plugin_manager` remove 掉 `@local/conversation-search`，
> 再 install 新目录，然后刷新页面。

### 先查包名有没有被占

```bash
npm view dsh-conversation-search version
```

- 返回版本号 → 已被占用，换 `@你的scope/dsh-conversation-search`（需要先在 npm 建 scope）
- 报 `E404` → 可以用

---

## 2. 建仓库并推送

```bash
cd /Users/liuqiang/Workspace/ai/dsh-conversation-search
git init
git add -A
git commit -m "feat: conversation search plugin for DeepSeek Harness"

# 在 GitHub 新建空仓库后：
git remote add origin https://github.com/<you>/dsh-conversation-search.git
git branch -M main
git push -u origin main
```

建议在仓库根加一个 `.gitignore`（如果以后加构建产物）：

```gitignore
node_modules/
*.log
```

---

## 3. 发布到 npm

```bash
npm login          # 当前这台机器还没登录
npm publish --access public
```

- 无 scope 包默认 public，`--access public` 是为了防止账号默认设成 restricted。
- 发布的是 `files` 里列出的文件，`client.js` 会原样进 tarball。
- 验证：

```bash
npm view dsh-conversation-search version
npm pack --dry-run        # 看会发哪些文件
```

---

## 4. 让用户装（三条命令任选）

用户拿到包名后：

```bash
# 方式 A：装到某个 profile（把 web 换成你自己的 profile，本机是 desktop）
dsh plugin --profile web add dsh-conversation-search

# 方式 B：在 Web GUI 的 Plugins 页面搜索包名安装
# 方式 C：从本地 tarball（离线分发）
pnpm pack && dsh plugin --profile web add ./dsh-conversation-search-0.1.0.tgz
```

装完**刷新页面**，会话标题旁会出现「搜索对话」按钮。

卸载：

```bash
dsh plugin --profile web remove dsh-conversation-search
```

---

## 5. 可选：做一个插件索引（Discover 里能逛到）

DSH 的插件市场索引就是一个 JSON 文件，托管在任意静态站点（GitHub Pages 最省事）。

### 5.1 生成索引

仓库里自带生成器，但它依赖 DSH 源码 checkout。更简单的做法是手写
（格式见 DSH 文档 `docs/user/guide/plugin-market.md`）：

```json
{
  "format": 1,
  "title": { "en": "My DSH plugins", "zh": "我的 DSH 插件" },
  "plugins": [
    {
      "name": "dsh-conversation-search",
      "title": { "en": "Conversation search", "zh": "对话内容搜索" },
      "description": {
        "en": "Cmd/Ctrl+F full-text search over the current conversation.",
        "zh": "为当前会话提供 ⌘F 全文搜索，可跳转并高亮匹配内容。"
      },
      "icon": "icons/conversation-search.svg",
      "author": "你的名字",
      "homepage": "https://github.com/you/dsh-conversation-search#readme",
      "repository": { "url": "https://github.com/you/dsh-conversation-search" },
      "versions": [
        {
          "version": "0.1.0",
          "publishTimestamp": 1790476800,
          "source": { "type": "npm" },
          "engines": { "dsh": ">=0.2.2-rc.1" }
        }
      ]
    }
  ]
}
```

要点：

- `format` 必须是 `1`；`title` 至少要 `en`。
- `versions[].publishTimestamp` 是 Unix **秒**（不是毫秒）。
- `source.type` 用 `npm` 时，DSH 安装 `name@version`。
- `icon` 可以是相对路径（相对 `index.json` 解析）或 `data:` URL（≤32 KiB）。
- `plugins[].name` 在索引内唯一，且必须等于 npm 包名。

### 5.2 托管

把 `index.json` 和 `icons/` 放到 GitHub Pages 分支，得到类似：

```
https://you.github.io/dsh-plugins/index.json
```

必须用 `https:`，且不能有重定向、不能带 `?`/`#`。

### 5.3 用户添加索引

Web GUI → Plugins → 打开 **Custom plugin indexes**（实验性）→ Discover →
**Add index source** → 填上面的 URL。之后就能浏览、搜索、一键安装。

---

## 6. 版本升级

```bash
# 改 package.json 的 version，或者：
npm version patch      # 0.1.0 -> 0.1.1
npm publish --access public
```

索引里新增一条 version 记录并重新托管 `index.json`（`publishTimestamp` 用新时间）。
DSH 会把已安装的旧版本标成 `Update available`（当前版本还不支持一键升级，需要卸载再装）。

---

## 7. 常见坑

| 现象 | 原因 | 处理 |
|---|---|---|
| `npm publish` 报 `E402` / `private` | `package.json` 还有 `"private": true` | 删掉 |
| 安装时报 `Unmet DSH version requirements` | `engines.dsh` 与用户 DSH 版本不匹配 | 放宽范围，或用户用 `dsh plugin allow-version` 显式豁免（有风险） |
| 安装成功但页面没变化 | 客户端 bundle 只在页面加载时进入 boot graph | 刷新页面（硬刷新 `⌘⇧R`） |
| 插件加载失败、页面报 boot error | `client.js` 运行时错误 | 打开 DevTools Console 看堆栈；`dsh` 启动日志也会打印插件激活失败 |
| 索引被拒 | JSON 不合规 | 报错会带 JSON 路径；对照第 5 节字段检查 |
| 用户装了但按钮不出现 | DSH 版本 < 0.2.2 | 本插件依赖 `ctx.shortcuts`，旧版没有该服务 |

---

## 8. 发布检查清单

- [ ] `private` 已删除
- [ ] `name` 是公开可用名
- [ ] `license` + `LICENSE` 文件
- [ ] `engines.dsh` 与实际兼容版本一致
- [ ] `files` 包含 `client.js` / `cordis.patch.yml` / `locale` / `icon`
- [ ] `npm pack --dry-run` 看到的文件齐全
- [ ] 在干净的 DSH profile 里实际装一次、刷新、验证快捷键与跳转
- [ ] README 里写清安装命令、快捷键表、已知限制
