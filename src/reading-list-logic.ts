export interface ReadingListItem {
	path: string;
	added: number;
	read: boolean;
}

/**
 * Appends a note if its path is not already present. Duplicates are a no-op (same array reference).
 */
export function tryAddReadingListItem(
	items: ReadingListItem[],
	path: string,
	now: number = Date.now(),
): { items: ReadingListItem[]; isNew: boolean } {
	if (items.some((i) => i.path === path)) {
		return { items, isNew: false };
	}
	return {
		items: [...items, { path, added: now, read: false }],
		isNew: true,
	};
}

export function removeReadingListItemByPath(
	items: ReadingListItem[],
	path: string,
): ReadingListItem[] {
	return items.filter((i) => i.path !== path);
}
