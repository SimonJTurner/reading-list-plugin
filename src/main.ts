import { ItemView, Notice, Plugin, TFile, WorkspaceLeaf, setIcon } from "obsidian";
import {
	removeReadReadingListItems,
	removeReadingListItemByPath,
	tryAddReadingListItem,
	type ReadingListItem,
} from "./reading-list-logic";

export const VIEW_TYPE_READING_LIST = "reading-list-view";

export type { ReadingListItem };

interface StoredData {
	items: ReadingListItem[];
}

export default class ReadingListPlugin extends Plugin {
	items: ReadingListItem[] = [];

	async onload(): Promise<void> {
		const stored = (await this.loadData()) as Partial<StoredData> | null;
		this.items = Array.isArray(stored?.items) ? stored.items : [];

		this.registerView(VIEW_TYPE_READING_LIST, (leaf) => new ReadingListView(leaf, this));

		this.addCommand({
			id: "open-reading-list",
			name: "Open reading list",
			callback: () => {
				void this.openReadingList();
			},
		});

		this.addCommand({
			id: "add-to-reading-list",
			name: "Add current note to reading list",
			callback: () => this.addCurrentNote(),
		});

		this.registerObsidianProtocolHandler("add-reading-list-item", (params) => {
			const path = params.path?.trim();
			const note = params.note?.trim();
			if (!path) {
				new Notice("Missing path for reading list item");
				return;
			}
			this.addItemByPath(path, { note });
		});

		this.addCommand({
			id: "reading-list-clear-read-items",
			name: "Reading List: Clear Read Items",
			callback: () => this.removeReadItems(),
		});

		this.addCommand({
			id: "reading-list-close",
			name: "Reading List: Close",
			callback: () => {
				const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_READING_LIST);
				for (let i = leaves.length - 1; i >= 0; i--) {
					leaves[i].detach();
				}
			},
		});

		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (!(file instanceof TFile)) return;
				let changed = false;
				for (const item of this.items) {
					if (item.path === oldPath) {
						item.path = file.path;
						changed = true;
					}
				}
				if (changed) void this.persist();
				this.refreshViews();
			}),
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (!(file instanceof TFile)) return;
				const before = this.items.length;
				this.items = this.items.filter((i) => i.path !== file.path);
				if (this.items.length !== before) void this.persist();
				this.refreshViews();
			}),
		);
	}

	async persist(): Promise<void> {
		await this.saveData({ items: this.items });
	}

	refreshViews(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_READING_LIST)) {
			const v = leaf.view as ReadingListView;
			v?.render();
		}
	}

	async openReadingList(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_READING_LIST);
		if (existing.length > 0) {
			await this.app.workspace.revealLeaf(existing[0]);
			return;
		}
		let leaf: WorkspaceLeaf | null = this.app.workspace.getRightLeaf(false);
		if (!leaf) {
			leaf = this.app.workspace.getLeaf(true);
		}
		await leaf.setViewState({ type: VIEW_TYPE_READING_LIST, active: true });
		await this.app.workspace.revealLeaf(leaf);
	}

	addCurrentNote(): void {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice("No active file");
			return;
		}
		if (!(file instanceof TFile)) {
			new Notice("Active file must be a note");
			return;
		}
		this.addItemByPath(file.path);
	}

	addItemByPath(path: string, options?: { note?: string; silent?: boolean }): void {
		const normalizedPath = path.trim();
		if (!normalizedPath) {
			if (!options?.silent) new Notice("Path is required");
			return;
		}

		const normalizedNote = options?.note?.trim();
		const existing = this.items.find((item) => item.path === normalizedPath);
		if (existing) {
			if (normalizedNote && existing.note !== normalizedNote) {
				existing.note = normalizedNote;
				void this.persist();
				this.refreshViews();
				if (!options?.silent) new Notice("Updated reading list note");
				return;
			}
			if (!options?.silent) new Notice("Already on reading list");
			return;
		}

		const { items: next, isNew } = tryAddReadingListItem(
			this.items,
			normalizedPath,
			Date.now(),
			normalizedNote,
		);
		if (!isNew) return;

		this.items = next;
		void this.persist();
		this.refreshViews();
		if (!options?.silent) new Notice("Added to reading list");
	}

	removeItem(path: string): void {
		this.items = removeReadingListItemByPath(this.items, path);
		void this.persist();
		this.refreshViews();
	}

	setRead(path: string, read: boolean): void {
		const item = this.items.find((i) => i.path === path);
		if (!item) return;
		item.read = read;
		void this.persist();
		this.refreshViews();
	}

	removeReadItems(): void {
		const before = this.items.length;
		this.items = removeReadReadingListItems(this.items);
		const removed = before - this.items.length;
		if (removed === 0) {
			new Notice("No read items to remove");
			return;
		}
		void this.persist();
		this.refreshViews();
		new Notice(removed === 1 ? "Removed 1 read item" : `Removed ${String(removed)} read items`);
	}

	/** Drop onto row at index `dropIndex` means “insert before that row”. */
	reorderDrag(fromIndex: number, dropIndex: number): void {
		if (fromIndex === dropIndex) return;
		if (fromIndex < 0 || fromIndex >= this.items.length) return;
		if (dropIndex < 0 || dropIndex > this.items.length) return;
		const [removed] = this.items.splice(fromIndex, 1);
		let insertAt = dropIndex;
		if (fromIndex < dropIndex) insertAt -= 1;
		this.items.splice(insertAt, 0, removed);
		void this.persist();
		this.refreshViews();
	}
}

class ReadingListView extends ItemView {
	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: ReadingListPlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_READING_LIST;
	}

	getDisplayText(): string {
		return "Reading list";
	}

	getIcon(): string {
		return "brain";
	}

	async onOpen(): Promise<void> {
		this.render();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	render(): void {
		this.contentEl.empty();
		this.contentEl.addClass("reading-list-root");
		this.contentEl.setAttr("role", "region");
		this.contentEl.setAttr("aria-label", "Reading list");

		const headerEl = this.contentEl.createDiv({ cls: "reading-list-header" });
		headerEl.createSpan({ cls: "reading-list-pane-title", text: "Reading List" });
		const clearReadBtn = headerEl.createEl("button", {
			cls: "reading-list-clear-read",
			text: "Remove read items",
			attr: {
				type: "button",
				"aria-label": "Remove all items marked as read from the list",
			},
		});
		const hasReadItems = this.plugin.items.some((i) => i.read);
		clearReadBtn.disabled = !hasReadItems;
		clearReadBtn.addEventListener("click", () => {
			this.plugin.removeReadItems();
		});

		const listEl = this.contentEl.createDiv({ cls: "reading-list-items" });
		listEl.setAttr("role", "list");

		if (this.plugin.items.length === 0) {
			listEl.createDiv({
				cls: "reading-list-empty",
				text: "Empty. Use “Add current note to reading list” from the command palette.",
			});
		} else {
			this.plugin.items.forEach((item, index) => {
				const file = this.app.vault.getAbstractFileByPath(item.path);
				const title =
					file instanceof TFile ? file.basename : (item.path.split("/").pop() ?? item.path);
				const missing = !(file instanceof TFile);

				const row = listEl.createDiv({
					cls: `setting-item reading-list-row${item.read ? " is-read" : ""}`,
				});
				row.setAttr("role", "listitem");

				const infoEl = row.createDiv({ cls: "setting-item-info reading-list-info" });

				const titleEl = infoEl.createEl("button", {
					cls: "setting-item-name reading-list-title",
					text: missing ? `${title} (missing)` : title,
				});
				titleEl.addEventListener("click", () => {
					if (file instanceof TFile) {
						void this.app.workspace.getLeaf(false).openFile(file);
					} else {
						new Notice("File not found in vault");
					}
				});

				const metaRowEl = infoEl.createDiv({ cls: "reading-list-meta-row" });
				metaRowEl.createDiv({
					cls: "setting-item-description reading-list-path",
					text: item.path,
				});
				if (item.note) {
					metaRowEl.createDiv({
						cls: "setting-item-description reading-list-note",
						text: item.note,
					});
				}

				const controlsEl = metaRowEl.createDiv({ cls: "reading-list-controls" });
				controlsEl.createDiv({ cls: "reading-list-grip", text: "⋮⋮" });

				const readBtn = controlsEl.createEl("button", {
					cls: `clickable-icon reading-list-btn reading-list-icon-btn${item.read ? " is-active" : ""}`,
					attr: {
						"aria-label": item.read ? "Mark as unread" : "Mark as read",
						"aria-pressed": item.read ? "true" : "false",
						title: item.read ? "Mark as unread" : "Mark as read",
					},
				});
				setIcon(readBtn, "check");
				readBtn.addEventListener("click", (e) => {
					e.stopPropagation();
					this.plugin.setRead(item.path, !item.read);
				});

				const removeBtn = controlsEl.createEl("button", {
					cls: "clickable-icon reading-list-btn reading-list-icon-btn is-danger",
					attr: {
						"aria-label": "Remove from reading list",
						title: "Remove from reading list",
					},
				});
				setIcon(removeBtn, "trash-2");
				removeBtn.addEventListener("click", (e) => {
					e.stopPropagation();
					this.plugin.removeItem(item.path);
				});

				row.setAttr("draggable", "true");
				row.addEventListener("dragstart", (e) => {
					e.dataTransfer?.setData("text/plain", String(index));
					e.dataTransfer!.effectAllowed = "move";
					row.addClass("is-dragging");
				});
				row.addEventListener("dragend", () => {
					row.removeClass("is-dragging");
				});
				row.addEventListener("dragover", (e) => {
					e.preventDefault();
					e.dataTransfer!.dropEffect = "move";
					row.addClass("reading-list-drag-over");
				});
				row.addEventListener("dragleave", () => {
					row.removeClass("reading-list-drag-over");
				});
				row.addEventListener("drop", (e) => {
					e.preventDefault();
					e.stopPropagation();
					row.removeClass("reading-list-drag-over");
					const from = parseInt(e.dataTransfer?.getData("text/plain") ?? "", 10);
					if (Number.isNaN(from)) return;
					this.plugin.reorderDrag(from, index);
				});
			});

			const endDrop = listEl.createDiv({ cls: "reading-list-end-drop" });
			endDrop.addEventListener("dragover", (e) => {
				e.preventDefault();
				e.dataTransfer!.dropEffect = "move";
				endDrop.addClass("reading-list-drag-over");
			});
			endDrop.addEventListener("dragleave", () => {
				endDrop.removeClass("reading-list-drag-over");
			});
			endDrop.addEventListener("drop", (e) => {
				e.preventDefault();
				endDrop.removeClass("reading-list-drag-over");
				const from = parseInt(e.dataTransfer?.getData("text/plain") ?? "", 10);
				if (Number.isNaN(from)) return;
				this.plugin.reorderDrag(from, this.plugin.items.length);
			});
		}
	}
}
