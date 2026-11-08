/**
 * Client half of the conversation-search bundle (DSH 0.2.2-rc.1 Web shell).
 *
 * It contributes a frame-wide find panel in `shell.overlay`, a session-header
 * button, and a `ctx.shortcuts` command. On macOS/Windows Desktop the command
 * takes over the real Cmd/Ctrl+F through the native input dispatch; on the
 * Web shell it uses Cmd/Ctrl+Alt+F because browsers reserve Cmd/Ctrl+F and
 * Cmd/Ctrl+Shift+F is already taken by `session.fork`.
 *
 * Search reads the loaded Conversation DOM (`[data-chat-flow-key]` rows, whose
 * textContent also covers rows hidden with `hidden="until-found"`), so it does
 * not depend on any internal model API. A "load full history" action clicks
 * the shipped "load earlier" button until the window is complete.
 */
window.__ModuleLoader__.load({
  id: '@local/conversation-search',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Locale namespace owned by this plugin. */
    const NS = 'local-conversation-search';

    const en = {
      'trigger.label': 'Find in chat',
      'trigger.tip': 'Search this conversation',
      'command.open': 'Find in conversation',
      'input.placeholder': 'Find in this conversation…',
      'input.aria': 'Find in this conversation',
      'close': 'Close',
      'prev': 'Previous match',
      'next': 'Next match',
      'found': '{current} of {total} matches',
      'noMatches': 'No matches in loaded messages',
      'emptyHint': 'Type to search user, assistant, tool, and reasoning text.',
      'hint': 'Enter jump · ↑↓ navigate · Esc close',
      'jump.missing': 'That match is not visible right now (folded away or not loaded).',
      'loadAll': 'Load full history',
      'loading': 'Loading earlier messages…',
      'loaded': 'Full history loaded',
      'partial': 'Only loaded messages are searched. Earlier history is not in the page yet.',
      'role.user': 'You',
      'role.assistant': 'Assistant',
      'role.tool': 'Tool',
      'role.other': 'Message',
      'turn': 'Turn {turn}',
    };

    const zh = {
      'trigger.label': '搜索对话',
      'trigger.tip': '搜索当前对话内容',
      'command.open': '在对话中搜索',
      'input.placeholder': '搜索当前对话…',
      'input.aria': '搜索当前对话',
      'close': '关闭',
      'prev': '上一个匹配',
      'next': '下一个匹配',
      'found': '{current} / {total} 条匹配',
      'noMatches': '已加载的消息中没有匹配',
      'emptyHint': '输入关键词，可搜索提问、回答、工具调用和思考过程。',
      'hint': '↵ 跳转 · ↑↓ 切换 · Esc 关闭',
      'jump.missing': '这条匹配当前不可见（被折叠或未加载）',
      'loadAll': '加载全部历史',
      'loading': '正在加载更早的消息…',
      'loaded': '已加载全部历史',
      'partial': '当前仅搜索已加载的消息，更早的历史还没进入页面。',
      'role.user': '你',
      'role.assistant': '助手',
      'role.tool': '工具',
      'role.other': '消息',
      'turn': '第 {turn} 轮',
    };

    /** Styles are scoped by a unique prefix and use host theme tokens only. */
    const CSS = `
.dshcs-layer{position:absolute;top:60px;left:50%;transform:translateX(-50%);z-index:60;width:min(640px,calc(100vw - 48px));pointer-events:auto;box-sizing:border-box;font-family:var(--dsw-font-sans,var(--dsw-alias-font-body,inherit));color:var(--dsw-alias-label-primary)}
.dshcs-panel{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:12px;border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-elevation-prominent)}
.dshcs-row{display:flex;align-items:center;gap:6px;min-width:0}
.dshcs-input{flex:1;min-width:0;font:inherit;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;padding:6px 9px;outline:none}
.dshcs-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:2px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 35%,transparent);outline-offset:1px}
.dshcs-input::placeholder{color:var(--dsw-alias-label-tertiary)}
.dshcs-count{flex:none;font-size:12px;line-height:18px;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);min-width:62px;text-align:right}
.dshcs-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;font:inherit;border-radius:7px;border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);cursor:pointer}
.dshcs-btn:disabled{opacity:.45;cursor:default}
.dshcs-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
@media (hover:hover){.dshcs-btn:not(:disabled):hover{background:var(--dsw-alias-fill-l1);color:var(--dsw-alias-label-primary)}}
.dshcs-list{margin:0;padding:2px;list-style:none;display:flex;flex-direction:column;gap:2px;max-height:min(340px,calc(100vh - 180px));overflow-y:auto;overscroll-behavior:contain}
.dshcs-item{display:flex;gap:8px;align-items:flex-start;width:100%;box-sizing:border-box;text-align:left;font:inherit;font-size:12px;line-height:18px;padding:6px 8px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.dshcs-item:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
@media (hover:hover){.dshcs-item:hover{background:var(--dsw-alias-fill-l1)}}
.dshcs-itemActive{background:var(--dsw-alias-fill-l2);color:var(--dsw-alias-label-primary)}
.dshcs-badge{flex:none;font-size:10px;line-height:16px;padding:0 5px;border-radius:4px;background:var(--dsw-alias-fill-l2);color:var(--dsw-alias-label-secondary);white-space:nowrap}
.dshcs-snippet{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshcs-mark{padding:0 1px;border-radius:2px;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 26%,transparent);color:inherit;font-weight:600}
.dshcs-turn{flex:none;font-size:10px;line-height:16px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.dshcs-empty{padding:10px 8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.dshcs-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:.5px solid var(--dsw-alias-border-l1);padding-top:7px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}
.dshcs-link{font:inherit;font-size:11px;line-height:16px;padding:0;border:0;background:none;color:var(--dsw-alias-brand-primary);cursor:pointer;text-decoration:none}
.dshcs-link:disabled{opacity:.6;cursor:default}
.dshcs-link:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dshcs-hint{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dshcs-trigger{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 7px;font:inherit;font-size:12px;line-height:18px;border:.5px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);cursor:pointer}
.dshcs-trigger:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
@media (hover:hover){.dshcs-trigger:hover{background:var(--dsw-alias-fill-l1);color:var(--dsw-alias-label-primary)}}
`;

    /** Button labels shipped by ui-chat for `chat.loadOlder` across locales. */
    const LOAD_OLDER_LABELS = [
      '加载更早', 'Load earlier', '以前を読み込む', 'Cargar antes',
      'Charger plus tôt', 'Früher laden', 'Загрузить раньше', 'Carregar mais cedo',
    ];

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const squash = (text) => String(text == null ? '' : text).replace(/\s+/gu, ' ').trim();
    const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

    /**
     * One row per rendered Chat node. `textContent` includes content inside
     * `hidden="until-found"` fold rows, which the browser's own find would
     * only reveal one at a time.
     */
    function collectMessages() {
      const rows = [];
      const nodes = document.querySelectorAll('[data-chat-flow-key]');
      for (const el of nodes) {
        if (el.querySelector('[data-chat-flow-key]')) continue;
        const text = squash(el.textContent);
        if (text === '') continue;
        rows.push({
          key: el.getAttribute('data-chat-flow-key') || '',
          nodeKey: el.getAttribute('data-chat-node-key') || '',
          anchorKey: el.getAttribute('data-chat-anchor-key') || '',
          kind: el.getAttribute('data-chat-flow-kind') || '',
          turn: el.getAttribute('data-chat-turn') || '',
          text,
        });
      }
      return rows;
    }

    /** The shipped "load earlier" button, when older history is still paged out. */
    function findLoadOlder() {
      for (const button of document.querySelectorAll('button')) {
        if (LOAD_OLDER_LABELS.includes(squash(button.textContent))) return button;
      }
      return null;
    }

    function roleOf(kind) {
      const value = String(kind || '').toLowerCase();
      if (value === 'user' || value === 'steering') return 'user';
      if (value.startsWith('assistant')) return 'assistant';
      if (value.includes('tool')) return 'tool';
      return 'other';
    }

    /** Build a short, highlighted excerpt around the earliest match. */
    function buildSnippet(text, terms, radius) {
      const lower = text.toLowerCase();
      let first = -1;
      for (const term of terms) {
        const at = lower.indexOf(term);
        if (at >= 0 && (first < 0 || at < first)) first = at;
      }
      const start = Math.max(0, (first < 0 ? 0 : first) - radius);
      const end = Math.min(text.length, start + radius * 2 + 48);
      const slice = text.slice(start, end);
      const prefix = start > 0 ? '…' : '';
      const suffix = end < text.length ? '…' : '';
      const parts = [];
      const escaped = terms.map(escapeRegExp).filter(Boolean);
      if (escaped.length === 0) {
        parts.push({ text: prefix + slice + suffix, hit: false });
        return parts;
      }
      const re = new RegExp('(' + escaped.join('|') + ')', 'giu');
      let cursor = 0;
      let match;
      while ((match = re.exec(slice)) !== null) {
        if (match.index > cursor) parts.push({ text: slice.slice(cursor, match.index), hit: false });
        parts.push({ text: match[0], hit: true });
        cursor = match.index + match[0].length;
        if (match[0].length === 0) re.lastIndex += 1;
      }
      if (cursor < slice.length) parts.push({ text: slice.slice(cursor), hit: false });
      if (prefix) parts.unshift({ text: prefix, hit: false });
      if (suffix) parts.push({ text: suffix, hit: false });
      return parts;
    }

    /** Find one rendered row by exact attribute value (no selector escaping). */
    function findByAttribute(attribute, value) {
      if (!value) return null;
      for (const node of document.querySelectorAll('[' + attribute + ']')) {
        if (node.getAttribute(attribute) === value) return node;
      }
      return null;
    }

    /** Wait for the next animation frames so React can commit a reveal. */
    function nextFrames(count) {
      return new Promise((resolve) => {
        let left = Math.max(1, count);
        const step = () => {
          left -= 1;
          if (left <= 0) resolve();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }

    /**
     * Unfold every hidden ancestor. Turn-process groups and disclosure rows use
     * `hidden="until-found"`; DSH expands its own state from the `beforematch`
     * listener, and removing the attribute is the fallback when React does not
     * react to the synthetic event.
     */
    function revealChain(el) {
      const hidden = [];
      for (let node = el; node != null && node !== document.documentElement; node = node.parentElement) {
        if (typeof node.hasAttribute === 'function' && node.hasAttribute('hidden')) hidden.push(node);
      }
      if (hidden.length === 0) return false;
      for (const node of hidden) {
        try { node.dispatchEvent(new Event('beforematch')); } catch { /* non-browser host */ }
      }
      for (const node of hidden) {
        if (typeof node.removeAttribute === 'function' && node.hasAttribute('hidden')) node.removeAttribute('hidden');
      }
      return true;
    }

    /** Center a row inside the Conversation scroller. */
    function scrollRowIntoView(el) {
      const scroller = el.closest('[data-conversation-scroll]');
      if (scroller === null) {
        try { el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch { el.scrollIntoView(); }
        return;
      }
      const row = el.getBoundingClientRect();
      const box = scroller.getBoundingClientRect();
      if (row.height === 0) return;
      const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const top = scroller.scrollTop + (row.top - box.top) - (box.height - row.height) / 2;
      const desired = Math.max(0, Math.min(top, max));
      // Assign instead of smooth-scrolling: the assignment is observable, so a
      // nested or clipped container can be detected and the browser fallback used.
      scroller.scrollTop = desired;
      if (max === 0 || Math.abs(scroller.scrollTop - desired) > 1) {
        try { el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch { el.scrollIntoView(); }
      }
    }

    function flashRow(el) {
      try {
        el.animate([
          { backgroundColor: 'rgba(255, 196, 0, 0)' },
          { backgroundColor: 'rgba(255, 196, 0, 0.28)', offset: 0.15 },
          { backgroundColor: 'rgba(255, 196, 0, 0.28)', offset: 0.75 },
          { backgroundColor: 'rgba(255, 196, 0, 0)' },
        ], { duration: 1800, easing: 'ease-out' });
      } catch { /* Web Animations unavailable */ }
    }

    /**
     * Reveal, scroll to, and flash one match. Flow keys can be JSON chords such
     * as `["tool:x","call"]`, so rows are matched by exact attribute comparison
     * instead of an escaped CSS attribute selector.
     * @returns whether a rendered row was found and scrolled to.
     */
    async function jumpTo(item) {
      const find = () => findByAttribute('data-chat-flow-key', item.key)
        || findByAttribute('data-chat-node-key', item.nodeKey)
        || findByAttribute('data-chat-anchor-key', item.anchorKey);
      let el = find();
      if (el === null) return false;
      const revealed = revealChain(el);
      if (revealed) await nextFrames(2);
      el = el.isConnected ? el : find();
      if (el === null) return false;
      scrollRowIntoView(el);
      flashRow(el);
      if (revealed) {
        // The reveal animation reflows the column; correct once it settles.
        await new Promise((resolve) => { setTimeout(resolve, 260); });
        const again = el.isConnected ? el : find();
        if (again !== null && again.getBoundingClientRect().height > 0) scrollRowIntoView(again);
      }
      return true;
    }

    /** Observable controller shared by the panel and the header button. */
    function createController() {
      let state = {
        open: false,
        query: '',
        active: 0,
        messages: [],
        results: [],
        total: 0,
        loadingAll: false,
        loadedAll: false,
        notice: '',
      };
      const listeners = new Set();
      const getSnapshot = () => state;
      const subscribe = (listener) => {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
      };
      const set = (patch) => {
        state = { ...state, ...patch };
        for (const listener of listeners) listener();
      };
      const termsOf = (query) => query.trim().toLowerCase().split(/\s+/u).filter(Boolean);

      function search(query, active) {
        const messages = collectMessages();
        const terms = termsOf(query);
        const results = [];
        if (terms.length > 0) {
          for (let index = 0; index < messages.length; index += 1) {
            const lower = messages[index].text.toLowerCase();
            if (terms.every((term) => lower.includes(term))) {
              results.push({ ...messages[index], index });
            }
          }
        }
        const bounded = Math.min(Math.max(active, 0), Math.max(results.length - 1, 0));
        set({ query, messages, results, total: messages.length, active: bounded });
      }

      return {
        getSnapshot,
        subscribe,
        open() {
          search(state.query, 0);
          set({ open: true });
        },
        close() { set({ open: false }); },
        setQuery(query) { search(query, 0); },
        move(delta) {
          const count = state.results.length;
          if (count === 0) return;
          set({ active: (state.active + delta + count) % count });
        },
        jump(index, keepOpen) {
          const item = state.results[index];
          if (item === undefined) return;
          set({ active: index, notice: '' });
          void jumpTo(item).then((found) => {
            // A click jumps and dismisses the panel so the target is visible;
            // keyboard Enter keeps it open for consecutive matches.
            if (!found) set({ notice: 'missing' });
            else if (keepOpen !== true) set({ open: false });
          });
        },
        async loadAll() {
          if (state.loadingAll) return;
          set({ loadingAll: true });
          try {
            for (let page = 0; page < 40; page += 1) {
              const button = findLoadOlder();
              if (button === null || button.disabled) break;
              const before = collectMessages().length;
              button.click();
              let grew = false;
              for (let tick = 0; tick < 25; tick += 1) {
                await wait(160);
                if (collectMessages().length > before) { grew = true; break; }
              }
              if (!grew) break;
            }
          } finally {
            set({ loadingAll: false, loadedAll: findLoadOlder() === null });
            search(state.query, state.active);
          }
        },
      };
    }

    /** Small glyph reused by the header button and panel buttons. */
    function Icon({ name }) {
      const common = {
        viewBox: '0 0 20 20', width: 14, height: 14, fill: 'none',
        'aria-hidden': 'true', focusable: 'false', style: { display: 'block' },
      };
      if (name === 'search') {
        return h('svg', common,
          h('circle', { cx: 8.7, cy: 8.7, r: 5.2, stroke: 'currentColor', strokeWidth: 1.5 }),
          h('path', { d: 'M12.6 12.6 L16.4 16.4', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
        );
      }
      if (name === 'close') {
        return h('svg', common,
          h('path', { d: 'M5.5 5.5 L14.5 14.5 M14.5 5.5 L5.5 14.5', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
        );
      }
      if (name === 'up' || name === 'down') {
        return h('svg', common,
          h('path', {
            d: name === 'up' ? 'M5.5 12 L10 7.5 L14.5 12' : 'M5.5 8 L10 12.5 L14.5 8',
            stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
          }),
        );
      }
      return null;
    }

    /** Frame-wide find panel registered into `shell.overlay`. */
    function SearchPanel({ t, search }) {
      const state = React.useSyncExternalStore(search.subscribe, search.getSnapshot);
      const inputRef = React.useRef(null);
      const listRef = React.useRef(null);
      const terms = state.query.trim().toLowerCase().split(/\s+/u).filter(Boolean);

      React.useEffect(() => {
        if (!state.open) return;
        const input = inputRef.current;
        if (input !== null) { input.focus(); input.select(); }
      }, [state.open]);

      // Mounted for the whole lifetime, not only while the panel is open:
      // this is the DOM fallback for shells where the shortcuts service
      // cannot deliver the binding (e.g. Linux Web). `open()` is idempotent.
      React.useEffect(() => {
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            if (!search.getSnapshot().open) return;
            if (!event.defaultPrevented) event.preventDefault();
            search.close();
            return;
          }
          const mod = event.metaKey || event.ctrlKey;
          if (!mod || event.key.toLowerCase() !== 'f' || event.defaultPrevented) return;
          event.preventDefault();
          search.open();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => { document.removeEventListener('keydown', onKeyDown); };
      }, [search]);

      React.useEffect(() => {
        if (!state.open || listRef.current === null) return;
        const active = listRef.current.querySelector('[data-active="true"]');
        if (active !== null) active.scrollIntoView({ block: 'nearest' });
      }, [state.active, state.open]);

      if (!state.open) return null;

      const onInputKeyDown = (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (event.shiftKey) search.move(-1);
          else search.jump(state.active, true);
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          search.move(1);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          search.move(-1);
        }
      };

      const count = state.results.length;
      const current = count === 0 ? 0 : state.active + 1;
      // Keep the active row inside the rendered window even past 200 matches.
      const windowSize = 200;
      const first = Math.max(0, Math.min(
        state.active - Math.floor(windowSize / 2),
        Math.max(count - windowSize, 0),
      ));
      const visible = state.results
        .slice(first, first + windowSize)
        .map((item, offset) => ({ item, index: first + offset }));

      return h('div', { className: 'dshcs-layer', role: 'dialog', 'aria-label': t('command.open') },
        h('div', { className: 'dshcs-panel' },
          h('div', { className: 'dshcs-row' },
            h('input', {
              ref: inputRef,
              className: 'dshcs-input',
              type: 'text',
              value: state.query,
              placeholder: t('input.placeholder'),
              'aria-label': t('input.aria'),
              spellCheck: false,
              autoComplete: 'off',
              onChange: (event) => search.setQuery(event.target.value),
              onKeyDown: onInputKeyDown,
            }),
            h('span', { className: 'dshcs-count', 'aria-live': 'polite' },
              state.query === '' ? '' : t('found', { current, total: count })),
            h('button', {
              type: 'button', className: 'dshcs-btn', title: t('prev'), 'aria-label': t('prev'),
              disabled: count === 0, onClick: () => search.move(-1),
            }, h(Icon, { name: 'up' })),
            h('button', {
              type: 'button', className: 'dshcs-btn', title: t('next'), 'aria-label': t('next'),
              disabled: count === 0, onClick: () => search.move(1),
            }, h(Icon, { name: 'down' })),
            h('button', {
              type: 'button', className: 'dshcs-btn', title: t('close'), 'aria-label': t('close'),
              onClick: () => search.close(),
            }, h(Icon, { name: 'close' })),
          ),
          count > 0 && h('ul', { ref: listRef, className: 'dshcs-list', 'aria-label': t('command.open') },
            visible.map(({ item, index }) => h('li', { key: item.key + ':' + index },
              h('button', {
                type: 'button',
                className: 'dshcs-item' + (index === state.active ? ' dshcs-itemActive' : ''),
                'data-active': index === state.active ? 'true' : 'false',
                onClick: () => search.jump(index),
              },
                h('span', { className: 'dshcs-badge' }, t('role.' + roleOf(item.kind))),
                h('span', { className: 'dshcs-snippet' },
                  buildSnippet(item.text, terms, 46).map((part, partIndex) => part.hit
                    ? h('mark', { key: partIndex, className: 'dshcs-mark' }, part.text)
                    : h('span', { key: partIndex }, part.text)),
                ),
                item.turn ? h('span', { className: 'dshcs-turn' }, t('turn', { turn: item.turn })) : null,
              ),
            )),
          ),
          count === 0 && h('div', { className: 'dshcs-empty' },
            state.query === '' ? t('emptyHint') : t('noMatches')),
          h('div', { className: 'dshcs-foot' },
            h('span', { className: 'dshcs-hint' }, state.notice === 'missing' ? t('jump.missing') : t('hint')),
            h('button', {
              type: 'button', className: 'dshcs-link', disabled: state.loadingAll,
              title: state.loadedAll ? t('loaded') : t('partial'),
              onClick: () => { void search.loadAll(); },
            }, state.loadingAll ? t('loading') : state.loadedAll ? t('loaded') : t('loadAll')),
          ),
        ),
      );
    }

    /** Session-header entry point so the feature is discoverable without a key. */
    function HeaderButton({ t, search }) {
      return h('button', {
        type: 'button', className: 'dshcs-trigger',
        title: t('trigger.tip'), 'aria-label': t('trigger.tip'),
        onClick: () => search.open(),
      },
        h(Icon, { name: 'search' }),
        h('span', null, t('trigger.label')),
      );
    }

    return {
      inject: ['shortcuts', 'locale', 'slots'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'conversation-search: dictionaries');
        ctx.effect(() => {
          const tag = document.createElement('style');
          tag.dataset.plugin = '@local/conversation-search';
          tag.dataset.pluginCss = '@local/conversation-search/panel.css';
          tag.textContent = CSS;
          document.head.appendChild(tag);
          return () => { tag.remove(); };
        }, 'conversation-search: styles');

        const t = ctx.locale.bind(NS);
        const search = createController();

        ctx.slots.inject('shell.overlay', () => {
          const disposeCommand = ctx.shortcuts.register({
            id: 'conversation-search.open',
            label: () => t('command.open'),
            aliases: ['find in conversation', 'search conversation'],
            defaults: {
              // Desktop native input dispatch wins over native actions, so the
              // real browser-style find key can be taken over here.
              'desktop:macos': { code: 'KeyF', modifiers: ['primary'] },
              'desktop:windows': { code: 'KeyF', modifiers: ['primary'] },
              'desktop:linux': { code: 'KeyF', modifiers: ['primary'] },
              // Browsers never deliver plain Cmd/Ctrl+F to the page, and
              // Cmd/Ctrl+Shift+F is taken by `session.fork`; use Cmd/Ctrl+Alt+F.
              'web:macos': { code: 'KeyF', modifiers: ['primary', 'alt'] },
              'web:windows': { code: 'KeyF', modifiers: ['primary', 'alt'] },
              // web:linux only admits Mod+Slash / Mod+Shift+Comma / Mod+Shift+Period,
              // all owned by shipped commands; the DOM fallback and header button
              // still open the panel there.
            },
            regions: ['page', 'editable', 'terminal'],
            modals: [],
            resolve: ({ modal }) => modal !== null
              ? { status: 'blocked', reason: 'modal' }
              : { status: 'handled', run: () => search.open() },
          });
          const disposeSlot = ctx.slots.register({
            name: 'shell.overlay',
            id: 'conversation-search',
            locale: NS,
            inject: () => ({ search }),
          }, SearchPanel);
          return () => { disposeCommand(); disposeSlot(); };
        });

        ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: 'conversation-search',
          order: 90,
          locale: NS,
          inject: () => ({ search }),
        }, HeaderButton));
      },
    };
  },
});
