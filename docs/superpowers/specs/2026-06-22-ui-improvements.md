# UI Improvements Design

Date: 2026-06-22

## Overview

Six targeted improvements across the app: Wish List upgraded to match Focus List functionality, Focus List renamed to To-do List, all Delete buttons replaced with ✕, activity link placeholder simplified, day notes given an explicit Save button, and calendar days get an editable title + description with larger cells.

---

## 1. Wish List → same as Focus List

**File:** `client/src/pages/WishList.jsx`

Replace the custom drag list implementation with the `DragList` component (already used by `FocusList`). The list type stays `toBuy`.

Result: Wish List gains checkboxes, drag-to-reorder (pending only), gradient styling, top-3-bold, and a "Done" completed section — identical to Focus List behaviour.

The custom `handleDrop`, `draggedId`, and `remove` state/handlers are removed; `DragList` handles all of this internally.

---

## 2. Rename Focus List → To-do List

**Files:** `client/src/pages/FocusList.jsx`, `client/src/pages/Dashboard.jsx`

- `FocusList.jsx`: `h1` text `"Focus List"` → `"To-do List"`, list name on auto-creation `'Focus List'` → `'To-do List'`, input placeholder `"Add a task..."`→ `"Add a task..."` (unchanged)
- `Dashboard.jsx`: MAIN_PAGES entry label `'Focus List'` → `'To-do List'`

---

## 3. Delete buttons → ✕

Replace the text `Delete` with `✕` on all item-level delete/remove buttons. `DragList` already uses `✕` so Focus List and Wish List are already covered after change 1.

Files and locations:
- `client/src/pages/WhatsNext.jsx` — list card delete button
- `client/src/pages/Itineraries.jsx` — itinerary card delete button
- `client/src/pages/Blobs.jsx` — blob delete button (display row)
- `client/src/pages/ListPage.jsx` — item delete button (display row)
- `client/src/pages/Itinerary.jsx` — activity delete button in DayPanel display row; linked list "Remove" button (change to ✕)

---

## 4. Activity link placeholder

**File:** `client/src/pages/Itinerary.jsx` (DayPanel)

Both the add-activity form and the edit-activity inline form: change the location URL input placeholder from `"Google Maps link (optional)"` → `"Link (optional)"`.

---

## 5. Day notes explicit Save button

**File:** `client/src/pages/Itinerary.jsx` (DayPanel)

Remove `onBlur` auto-save from the notes textarea. Add an explicit `Save` button below the textarea. Clicking Save calls `onSaveNotes(dateStr, localNotes)`.

The textarea remains always visible; the Save button is always rendered below it.

---

## 6. Calendar day title + description

### Server changes

**`server/src/models/Itinerary.js`** — add two fields to `DaySchema`:
```js
title: { type: String, default: '' },
description: { type: String, default: '' },
```

**`server/src/routes/itineraries.js`** — rename route from `PUT /:id/days/:date/notes` to `PUT /:id/days/:date`. The handler now accepts `{ title, description, notes }` from `req.body` and upserts all three on the matching day entry. Removal logic: only remove the day entry when all three fields are empty strings.

### Client changes

**`client/src/pages/Itinerary.jsx`**

**DayPanel** — add at the top of the panel (before activities):
- A text input for the day title (placeholder `"Day summary..."`)
- A textarea for the day description (`rows={3}`, placeholder `"Describe the day..."`)
- A `Save day summary` button that calls `onSaveNotes(dateStr, { title, description, notes: localNotes })`

`onSaveNotes` signature updates: the parent's `saveDayNotes` now sends `{ title, description, notes }` to `PUT /api/itineraries/:id/days/:date`.

`notesForDay` helper is supplemented by `titleForDay` and `descriptionForDay` helpers that pull from `itinerary.days`.

DayPanel receives three initial props: `notes`, `title`, `description` (all strings, empty default). It manages `localTitle`, `localDescription`, `localNotes` state internally, initialised from props (relies on `key={expandedDay}` remount to reinitialise when day changes — already in place).

**Desktop calendar cells** — increase `min-h-[64px]` → `min-h-[96px]`. Below the date number and activity badge, show the day title in a small truncated line:
```jsx
{isTrip && titleForDay(dateStr) && (
  <div className="text-xs text-indigo-700 truncate mt-1">{titleForDay(dateStr)}</div>
)}
```

**Mobile day cards** — show the day title below the date text when present:
```jsx
{titleForDay(dateStr) && (
  <p className="text-xs text-indigo-600 mt-0.5">{titleForDay(dateStr)}</p>
)}
```

---

## What is not changing

- Server routes other than the day-update route rename
- List/Item/Activity models
- All other pages not listed above
