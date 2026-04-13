# Reading list

An [Obsidian](https://obsidian.md/) plugin that keeps an **ordered reading queue** in a **sidebar** pane. Items are stored in **plugin data** (not a meta-note). Marking something as read is **manual only**—opening a note does not change read state.

**Desktop only** (`isDesktopOnly`).

## Features

- **Sidebar view** with a brain icon (no ribbon button).
- **Queue order** matters: the top item is “next.” **Drag and drop** to reorder; drop on the dashed area to move to the end.
- **Read / Unread** toggles per item (explicit buttons).
- **Remove** items from the queue.
- **Click a title** to open the note in the workspace.
- **Rename / delete** in the vault updates stored paths or drops missing files from the list.

## Commands

| Command                              | Action                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------- |
| **Open reading list**                | Focus the sidebar view, or open it on the right if it is not open yet.    |
| **Add current note to reading list** | Append the active note to the end of the queue (duplicates are rejected). |

Open the command palette and search for “reading list” to run these.

## Requirements

- Obsidian **1.5.0** or newer (see `manifest.json` for `minAppVersion`).
- Desktop app (plugin is not aimed at mobile).

## Installation

### From a GitHub release (manual)

1. Download **`main.js`**, **`manifest.json`**, and **`styles.css`** from the latest release.
2. Create a folder: `<Vault>/.obsidian/plugins/reading-list/`
3. Place the three files in that folder.
4. In Obsidian: **Settings → Community plugins → Restricted mode** off, then enable **Reading list**.

### From source (for development)

```bash
git clone <your-repo-url> reading-list-plugin
cd reading-list-plugin
npm install
```

`npm run build` writes the plugin into:

`dist/` in this repository (ignored by git), **or** your vault’s plugin folder if you opt in:

```bash
export OBSIDIAN_VAULT=/path/to/your/vault
npm run build
```

With **`OBSIDIAN_VAULT`** set, output goes to `<OBSIDIAN_VAULT>/.obsidian/plugins/reading-list/` instead of `dist/`.

`npm run dev` performs a non-production build (inline source maps) and copies `manifest.json` and `styles.css` to the same plugin folder.

## Data

Your queue is persisted by Obsidian as **`data.json`** next to the plugin files:

`<Vault>/.obsidian/plugins/reading-list/data.json`

Back up that file (or your whole `.obsidian` folder) if the list matters to you.

## Privacy

Reading list is local-only. It stores your queue in local plugin data and does not send note content, metadata, or telemetry to external services.

## Releasing (maintainers)

1. Set **`version`** in `manifest.json` to a semver (e.g. `1.0.1`).
2. Commit and push.
3. Create a Git tag that matches that version, with or without a `v` prefix, e.g. `1.0.1` or `v1.0.1`.
4. Push the tag. The **Release Obsidian plugin** GitHub Action builds `dist/`, checks the tag against `manifest.json`, and attaches **`main.js`**, **`manifest.json`**, and **`styles.css`** to a GitHub release.

Local release artifact check:

```bash
npm run build:release
# Outputs under dist/
```

## Publishing to Community Plugins

After you have a public repo and at least one release with the three files attached, follow Obsidian’s process: fork **[obsidian-releases](https://github.com/obsidianmd/obsidian-releases)**, add your plugin to **`community-plugins.json`**, and open a PR. See Obsidian’s developer documentation for current requirements (README, license, policies).

## License

This project is licensed under the MIT License. See `LICENSE`.
