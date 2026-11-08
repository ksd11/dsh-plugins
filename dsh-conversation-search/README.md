# Conversation search

A local DeepSeek Harness bundle that adds a browser-style **find in this
conversation** panel to the Web GUI: a search box centered at the top of the
frame, a result list with highlighted excerpts, jump-to-message with a flash
highlight, and an action that loads the rest of a long session's history.

It is a pure Client plugin. No Host or core source change is needed.

## What it contributes

| Registration | Purpose |
|---|---|
| `ctx.shortcuts` command `conversation-search.open` | Global hotkey that opens the panel. |
| `shell.overlay` (list, root scope) | The floating find panel, above every column. |
| `conversation.session.header.utilities` (list) | A "Find in chat" button next to the session title. |

## Shortcuts

| Shell | Hotkey | Why |
|---|---|---|
| macOS Desktop | **⌘F** | Desktop uses native input dispatch, which takes priority over native actions — so the real Cmd+F is taken over. |
| Windows / Linux Desktop | **Ctrl+F** | Same native dispatch. |
| macOS Web | **⌘⌥F** (Cmd+Alt+F) | Browsers never deliver plain Cmd+F to the page, and Cmd+Shift+F is already used by `session.fork`. |
| Windows Web | **Ctrl+Alt+F** | Same reason. |
| Linux Web | no registered binding | The shortcuts service only admits `Mod+Slash`, `Mod+Shift+Comma`, `Mod+Shift+Period` there, all owned by shipped commands. Use the header button, or Cmd/Ctrl+Shift+F / Cmd/Ctrl+Alt+F, which the panel also listens for as a DOM fallback. |

Inside the panel: `Enter` jumps to the active match and keeps the panel open
for consecutive matches, `Shift+Enter` / `↑` / `↓` move between matches, `Esc`
closes. Clicking a result jumps to that message and dismisses the panel, so the
target is visible immediately.

The header button always works, including on Linux Web.

## What is searched

The panel indexes the rendered Conversation rows (`[data-chat-flow-key]`).
Because it reads `textContent`, it also covers rows folded away with
`hidden="until-found"` — user prompts, assistant answers, reasoning blocks,
tool calls and their results — not just what is visually on screen.

A long session is paged: the Web client keeps a window of roughly the last 50
messages plus pages you have loaded. Search covers the loaded window. Click
**Load full history** to repeatedly trigger the shipped "load earlier" button
until `hasMore` is exhausted, then re-run the search. The footer shows whether
the full history is loaded.

Jumping resolves the matched row by exact attribute comparison (flow key, then
node key, then anchor key). It must not build a CSS attribute selector from the
key: 0.2.2 encodes grouped rows as JSON chords such as `["tool:x","call"]`, and
`CSS.escape` is meant for identifiers, not selector string literals. The jump
then walks every ancestor and unfolds `hidden="until-found"` rows (dispatching
`beforematch` for DSH's own reveal, removing the attribute as a fallback), waits
two animation frames, centers the row by setting `scrollTop` on
`[data-conversation-scroll]`, flashes it, and re-centers once after the reveal
animation settles. If the row is gone, the footer says the match is not visible
instead of failing silently.

## Known limitations

- Search covers the Chat view. The Trajectory view virtualizes rows above 100,
  so its DOM is not a complete source; this plugin does not replace its own
  built-in trajectory search.
- "Load full history" pulls older pages into the client. On a very long
  session it stops after 40 pages or when a page fails to grow, to avoid an
  unbounded loop.
- Only the current session is searched. Cross-session search is the shipped
  `session/search` command (Cmd+K on Desktop).
- The list shows the first 200 matches; the counter shows the full match count.

## Install

From npm into the profile that serves the Web GUI:

```sh
dsh plugin --profile web add @ksd11oj/dsh-conversation-search
```

Replace `web` with your profile name (`desktop` on this machine). **Reload the
Web page** after installing so the new client bundle is served; a "Find in
chat" button then appears in the session header.

You can also install the checkout directly:

```sh
dsh plugin --profile web add /absolute/path/to/dsh-conversation-search
```

To uninstall:

```sh
dsh plugin --profile web remove @ksd11oj/dsh-conversation-search
```

Uninstalling only removes the bundle's rows; the plugin writes no data.

## Layout

| File | Purpose |
|---|---|
| `package.json` | Bundle manifest, `dsh.bundle.patch`, `dsh.client` injection list. |
| `cordis.patch.yml` | Inserts the `conversation-search` Loader row. |
| `index.js` | Host half; intentionally empty. |
| `client.js` | Browser half: shortcuts command, overlay panel, header button, search logic. |
| `locale/*.json` | Plugin Manager title and description. |
| `icon.svg` | Plugin inventory icon. |

## Compatibility notes

Written against the shipped **0.2.2-rc.1** client API (`ctx.shortcuts`,
`shell.overlay`, `conversation.session.header.utilities`). The source checkout
under `deepseek-harness/` in this workspace is an older 0.1.2-alpha.1 snapshot
and does not contain those APIs — do not use it as the reference for this
bundle.
