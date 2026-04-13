import assert from "node:assert/strict";
import test from "node:test";
import {
	removeReadReadingListItems,
	removeReadingListItemByPath,
	tryAddReadingListItem,
	type ReadingListItem,
} from "./reading-list-logic";

function sampleItems(): ReadingListItem[] {
	return [
		{ path: "a.md", added: 1, read: false },
		{ path: "b.md", added: 2, read: true },
	];
}

test("tryAddReadingListItem adds a new note to the reading list", () => {
	const before: ReadingListItem[] = [];
	const { items, isNew } = tryAddReadingListItem(before, "note.md", 100, "Read this soon");
	assert.equal(isNew, true);
	assert.deepEqual(items, [{ path: "note.md", added: 100, read: false, note: "Read this soon" }]);
	assert.deepEqual(before, []);
});

test("tryAddReadingListItem does not add a duplicate when the same path is added twice", () => {
	const first = tryAddReadingListItem([], "dup.md", 10);
	assert.equal(first.isNew, true);
	const second = tryAddReadingListItem(first.items, "dup.md", 99);
	assert.equal(second.isNew, false);
	assert.equal(second.items, first.items);
	assert.deepEqual(second.items, [{ path: "dup.md", added: 10, read: false }]);
});

test("tryAddReadingListItem trims note and omits empty values", () => {
	const withNote = tryAddReadingListItem([], "note.md", 42, "  Keep this  ");
	assert.deepEqual(withNote.items, [
		{ path: "note.md", added: 42, read: false, note: "Keep this" },
	]);

	const withoutNote = tryAddReadingListItem([], "no-note.md", 42, "   ");
	assert.deepEqual(withoutNote.items, [{ path: "no-note.md", added: 42, read: false }]);
});

test("removeReadingListItemByPath removes a note from the reading list", () => {
	const items = sampleItems();
	const next = removeReadingListItemByPath(items, "a.md");
	assert.deepEqual(next, [{ path: "b.md", added: 2, read: true }]);
	assert.equal(items.length, 2);
});

test("removeReadingListItemByPath leaves the list unchanged when the path is not present", () => {
	const items = sampleItems();
	const next = removeReadingListItemByPath(items, "missing.md");
	assert.deepEqual(next, items);
});

test("removeReadReadingListItems drops every read item and keeps order of the rest", () => {
	const items = sampleItems();
	const next = removeReadReadingListItems(items);
	assert.deepEqual(next, [{ path: "a.md", added: 1, read: false }]);
	assert.equal(items.length, 2);
});

test("removeReadReadingListItems returns an empty list when all items are read", () => {
	const items: ReadingListItem[] = [
		{ path: "x.md", added: 1, read: true },
		{ path: "y.md", added: 2, read: true },
	];
	assert.deepEqual(removeReadReadingListItems(items), []);
});
