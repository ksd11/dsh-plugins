/**
 * Client half of the sidebar workbench bundle.
 *
 * Registers two slots against the same panel id: the icon row in
 * `sidebar.panellist` (the shell builds a nav button from it) and the page in
 * the keyed `main` slot that `ctx.layout.selectPanel(id)` renders. The sidebar
 * entry id is what ties the two together.
 */
window.__ModuleLoader__.load({
  id: '@local/sidebar-panel',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Dictionary namespace owned by this plugin. */
    const NS = 'local-sidebar-panel';
    /** Panel id shared by the sidebar entry and the main slot key. */
    const PANEL_ID = 'local-sidebar-panel';

    const en = {
      'panel.label': 'Workbench',
      'page.title': 'Workbench',
      'page.lead': 'This page and the row in the left sidebar both come from the installed plugin @local/sidebar-panel.',
      'page.section': 'What this bundle contributes',
      'card.entry.title': 'Sidebar entry',
      'card.entry.text': 'The Workbench row is registered in the sidebar panel list, so it follows the sidebar expanded and collapsed states without extra code.',
      'card.page.title': 'Main panel page',
      'card.page.text': "Selecting the row renders this page in the central column from the plugin's own React component.",
      'card.state.title': 'Local state',
      'card.state.text': 'The counter below lives in this component only. It is not written to the session log and resets when the page unmounts.',
      'counter.increment': 'Increment',
      'counter.count': '{count} clicks',
      'page.note': 'To change this page, edit client.js in the plugin directory.',
    };

    const zh = {
      'panel.label': '工作台',
      'page.title': '工作台',
      'page.lead': '这个页面和左侧栏中的一行都由已安装的插件 @local/sidebar-panel 提供。',
      'page.section': '这个插件提供了什么',
      'card.entry.title': '左侧栏入口',
      'card.entry.text': '「工作台」这一行注册在侧边栏的面板列表中，会跟随侧边栏的展开与收起状态，无需额外代码。',
      'card.page.title': '主面板页面',
      'card.page.text': '点击该行后，中间一栏会渲染这个页面，内容来自插件自己的 React 组件。',
      'card.state.title': '本地状态',
      'card.state.text': '下方的计数器只存在于这个组件中，不会写入会话日志，页面卸载后会重置。',
      'counter.increment': '加一',
      'counter.count': '{count} 次点击',
      'page.note': '要修改这个页面，请编辑插件目录中的 client.js。',
    };

    /** Page styles are scoped by a unique class prefix and use host theme tokens only. */
    const CSS = `
.dshsp-page{box-sizing:border-box;height:100%;min-height:0;overflow-y:auto;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
.dshsp-inner{box-sizing:border-box;max-width:760px;margin:0 auto;padding:36px 40px 56px;display:flex;flex-direction:column;gap:22px}
.dshsp-header{display:flex;flex-direction:column;gap:6px}
.dshsp-title{margin:0;font-size:20px;line-height:28px;font-weight:600}
.dshsp-lead{margin:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.dshsp-section{display:flex;flex-direction:column;gap:10px}
.dshsp-sectionTitle{margin:0;font-size:13px;line-height:20px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.dshsp-cards{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px}
.dshsp-card{display:flex;gap:12px;padding:14px 16px;background:var(--dsw-alias-bg-layer-1);border:.5px solid var(--dsw-alias-border-l1);border-radius:10px}
.dshsp-glyph{flex:none;width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.dshsp-cardBody{display:flex;flex-direction:column;gap:3px;min-width:0}
.dshsp-cardTitle{font-size:14px;line-height:20px;font-weight:500}
.dshsp-cardText{font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.dshsp-counter{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;background:var(--dsw-alias-bg-layer-1);border:.5px solid var(--dsw-alias-border-l1);border-radius:10px}
.dshsp-counterText{display:flex;flex-direction:column;gap:2px;min-width:0}
.dshsp-counterTitle{font-size:14px;line-height:20px;font-weight:500}
.dshsp-count{font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.dshsp-button{flex:none;font:inherit;font-size:13px;line-height:20px;padding:6px 14px;border-radius:8px;border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);cursor:pointer}
.dshsp-button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
@media (hover:hover){.dshsp-button:hover{background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-border-l2)}}
.dshsp-note{margin:0;padding-top:14px;border-top:.5px solid var(--dsw-alias-border-l1);font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
`;

    /**
     * Sidebar panel glyph. The shell hands the entry's square edge and whether
     * this panel is the active one.
     */
    function PanelIcon({ size, active }) {
      return h('svg', {
        viewBox: '0 0 20 20',
        width: size,
        height: size,
        fill: 'none',
        'aria-hidden': 'true',
        focusable: 'false',
        style: { display: 'block' },
      },
        h('rect', {
          x: 2.75, y: 3.25, width: 14.5, height: 13.5, rx: 3.25,
          stroke: 'currentColor', strokeWidth: 1.5,
        }),
        h('rect', {
          x: 5.5, y: 6, width: 3.5, height: 8, rx: 1.25,
          fill: 'currentColor', opacity: active ? 1 : 0.55,
        }),
      );
    }

    /** Small glyph shown inside one page card. */
    function CardGlyph({ kind }) {
      const svg = (children) => h('svg', {
        viewBox: '0 0 20 20', width: 14, height: 14, fill: 'none',
        'aria-hidden': 'true', focusable: 'false',
      }, ...children);
      if (kind === 'page') {
        return svg([
          h('rect', { key: 'frame', x: 2.5, y: 3.5, width: 15, height: 13, rx: 3, stroke: 'currentColor', strokeWidth: 1.4 }),
          h('path', { key: 'lines', d: 'M7 7h7M7 10h7M7 13h4.5', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
        ]);
      }
      if (kind === 'state') {
        return svg([
          h('circle', { key: 'ring', cx: 10, cy: 10, r: 6.5, stroke: 'currentColor', strokeWidth: 1.4 }),
          h('circle', { key: 'dot', cx: 10, cy: 10, r: 2.2, fill: 'currentColor' }),
        ]);
      }
      return svg([
        h('rect', { key: 'frame', x: 2.5, y: 3.5, width: 15, height: 13, rx: 3, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('rect', { key: 'rail', x: 5.5, y: 6.5, width: 3, height: 7, rx: 1, fill: 'currentColor' }),
      ]);
    }

    /** The main panel page for {@link PANEL_ID}. */
    function PanelPage({ t }) {
      const [count, setCount] = React.useState(0);
      const cards = [
        { kind: 'entry', title: t('card.entry.title'), text: t('card.entry.text') },
        { kind: 'page', title: t('card.page.title'), text: t('card.page.text') },
        { kind: 'state', title: t('card.state.title'), text: t('card.state.text') },
      ];
      return h('div', { className: 'dshsp-page' },
        h('style', { key: 'dshsp-styles' }, CSS),
        h('div', { className: 'dshsp-inner' },
          h('header', { className: 'dshsp-header' },
            h('h1', { className: 'dshsp-title' }, t('page.title')),
            h('p', { className: 'dshsp-lead' }, t('page.lead')),
          ),
          h('section', { className: 'dshsp-section' },
            h('h2', { className: 'dshsp-sectionTitle' }, t('page.section')),
            h('ul', { className: 'dshsp-cards' }, cards.map((card) => h('li', { key: card.kind, className: 'dshsp-card' },
              h('span', { className: 'dshsp-glyph' }, h(CardGlyph, { kind: card.kind })),
              h('span', { className: 'dshsp-cardBody' },
                h('span', { className: 'dshsp-cardTitle' }, card.title),
                h('span', { className: 'dshsp-cardText' }, card.text),
              ),
            ))),
          ),
          h('section', { className: 'dshsp-counter' },
            h('span', { className: 'dshsp-counterText' },
              h('span', { className: 'dshsp-counterTitle' }, t('card.state.title')),
              h('span', { className: 'dshsp-count', 'aria-live': 'polite' }, t('counter.count', { count })),
            ),
            h('button', {
              type: 'button',
              className: 'dshsp-button',
              onClick: () => setCount((value) => value + 1),
            }, t('counter.increment')),
          ),
          h('p', { className: 'dshsp-note' }, t('page.note')),
        ),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'local-sidebar-panel: dictionaries');
        const t = ctx.locale.bind(NS);

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
        }, PanelPage));

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 20,
          label: () => t('panel.label'),
        }, PanelIcon));
      },
    };
  },
});
