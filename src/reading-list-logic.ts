export interface ReadingListItem {
	path: string;
	added: number;
	read: boolean;
	note?: string;
}

/**
 * Appends a note if its path is not already present. Duplicates are a no-op (same array reference).
 */
export function tryAddReadingListItem(
	items: ReadingListItem[],
	path: string,
	now: number = Date.now(),
	note?: string,
): { items: ReadingListItem[]; isNew: boolean } {
	if (items.some((i) => i.path === path)) {
		return { items, isNew: false };
	}
	const normalizedNote = note?.trim();
	return {
		items: [
			...items,
			{
				path,
				added: now,
				read: false,
				...(normalizedNote ? { note: normalizedNote } : {}),
			},
		],
		isNew: true,
	};
}

export function removeReadingListItemByPath(
	items: ReadingListItem[],
	path: string,
): ReadingListItem[] {
	return items.filter((i) => i.path !== path);
}

/** Removes every item marked read. Order of remaining items is preserved. */
export function removeReadReadingListItems(items: ReadingListItem[]): ReadingListItem[] {
	return items.filter((i) => !i.read);
}
