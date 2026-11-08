# Sidebar workbench

A local DeepSeek Harness bundle that adds a left sidebar entry and its own main
panel page.

## What it registers

- `sidebar.panellist` — the Workbench row and icon in the left sidebar, at
  `order: 20`, after the shipped Plugins (`0`) and Schedules (`10`) entries.
- `main` keyed by the same panel id — the page rendered in the central column
  when the row is selected. The sidebar shell calls `ctx.layout.selectPanel(id)`.

The page is a plain React component with a small in-component counter, styled
with host theme tokens (`--dsw-alias-*`) and localized through a
`local-sidebar-panel` locale namespace.

## Layout

| File | Purpose |
|---|---|
| `package.json` | Bundle manifest: Host export, `dsh.bundle.patch`, `dsh.client`, locales, icon. |
| `cordis.patch.yml` | Inserts the `sidebar-panel` row. |
| `index.js` | Host half; the page and entry are Client registrations. |
| `client.js` | Browser half: locale dictionaries, sidebar entry, and main panel page. |
| `locale/en.json`, `locale/zh.json` | Plugin Manager title and description. |
| `icon.svg` | Plugin inventory icon. |

## Install

Install this directory as a bundle from the profile that should load it
(`plugin_manager` → `install_bundle`, target = this directory). The bundle is
selected automatically and the sidebar entry appears after the page reloads.

## Change it

Edit `client.js`, then reload the Web page so the new bundle bytes are served.
The panel id (`local-sidebar-panel`) is shared by the two registrations; keep
them equal if you rename it.
