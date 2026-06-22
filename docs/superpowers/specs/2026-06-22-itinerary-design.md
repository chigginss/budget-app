# Itinerary Feature Design

Date: 2026-06-22

## Overview

A new Itinerary section for planning trips. Each itinerary has a name, description, date range, trip budget, an optional linked Ledger duration for actual spend tracking, multiple linked What's Next lists shown inline, and a per-day calendar with activities and notes.

---

## Architecture

Two new server models (Itinerary, Activity), two new route files, two new client pages (Itineraries list, Itinerary detail), and a Dashboard nav card.

No changes to existing models. Day notes are embedded in the Itinerary document as a sparse array — only populated when a day has notes. Activities are a separate collection referencing itinerary + date.

---

## Server

### Models

**`server/src/models/Itinerary.js`**

```js
{
  name: { type: String, required: true },
  description: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  budget: { type: Number },                           // trip budget in NZD
  ledgerMonthId: { type: ObjectId, ref: 'Month' },    // optional — links to existing Ledger duration
  linkedListIds: [{ type: ObjectId, ref: 'List' }],   // What's Next custom lists
  days: [{                                             // sparse — only entries with notes
    date: { type: Date, required: true },
    notes: { type: String, default: '' },
  }],
}
```

**`server/src/models/Activity.js`**

```js
{
  title: { type: String, required: true },
  description: { type: String, default: '' },
  locationUrl: { type: String, default: '' },  // plain URL, e.g. Google Maps link
  date: { type: Date, required: true },         // which day this activity belongs to
  order: { type: Number, default: 0 },
  itinerary: { type: ObjectId, ref: 'Itinerary', required: true, index: true },
}
```

### Routes

**`server/src/routes/itineraries.js`**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/itineraries` | List all itineraries (no activities/days populated) |
| POST | `/api/itineraries` | Create itinerary |
| GET | `/api/itineraries/:id` | Get itinerary with activities array sorted by date asc, order asc |
| PUT | `/api/itineraries/:id` | Update any top-level fields |
| DELETE | `/api/itineraries/:id` | Delete itinerary + cascade delete all its activities |
| PUT | `/api/itineraries/:id/days/:date/notes` | Upsert notes for a day (`:date` = `YYYY-MM-DD`). If notes is empty string, remove the day entry. |

GET /:id response shape:
```js
{
  ...itinerary,
  activities: Activity[],   // sorted by date asc, order asc
}
```

**`server/src/routes/activities.js`**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/itineraries/:id/activities` | Create activity; order = count of existing activities on that date |
| PUT | `/api/activities/:id` | Update activity fields |
| DELETE | `/api/activities/:id` | Delete activity |

Activities route is registered at `/api/activities` in app.js. The POST for creating is under `/api/itineraries/:id/activities` (registered in itineraries router).

**`server/src/app.js` additions:**
```js
app.use('/api/itineraries', require('./routes/itineraries'))
app.use('/api/activities', require('./routes/activities'))
```

---

## Client

### New files

- `client/src/pages/Itineraries.jsx` — list page
- `client/src/pages/Itinerary.jsx` — detail page

### Routing

**`App.jsx`** additions:
```jsx
import Itineraries from './pages/Itineraries'
import Itinerary from './pages/Itinerary'

<Route path="/itineraries" element={<Itineraries />} />
<Route path="/itineraries/:id" element={<Itinerary />} />
```

### Dashboard nav card

Add to `MAIN_PAGES` in `Dashboard.jsx`:
```js
{ label: 'Itinerary', path: '/itineraries', description: 'Plan your trips' }
```

---

### Itineraries.jsx (`/itineraries`)

- `← Dashboard` back link
- `h1` "Itineraries"
- Inline "New Itinerary" form at top: name input, start date, end date, "Create" button. On submit: POST `/api/itineraries`, navigate to `/itineraries/:id`.
- Grid of itinerary cards (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3`): each shows name, formatted date range, Delete button (with confirm).

---

### Itinerary.jsx (`/itineraries/:id`)

State: `itinerary`, `activities`, `availableLists`, `linkedListsData`, `ledgerMonth`, `expandedDay`, `editingField`, `activityForm`

On load:
- `GET /api/itineraries/:id` → sets itinerary + activities
- `GET /api/lists?type=custom` → sets availableLists (for linked list picker)
- For each linkedListId: `GET /api/lists/:id` → sets linkedListsData
- If ledgerMonthId: `GET /api/months/:id` → sets ledgerMonth

#### Section 1: Header

- **Name**: displayed as `h1`, click to edit inline (single-line input, saves on blur/Enter)
- **Description**: rendered as `<ReactMarkdown>` when not editing; click to edit shows a `rows={8}` textarea, saves on blur

#### Section 2: Trip details

Two-column grid (`grid-cols-1 sm:grid-cols-2`), each field saves on blur:
- Start date (date input)
- End date (date input)
- Budget (number input, NZD)
- Ledger duration (select dropdown of all months from `/api/months`; shows "No duration linked" default)

When a Ledger duration is linked, show below:
```
Budget: $X,XXX  |  Actual: $X,XXX  |  Remaining: $X,XXX  (green if positive, red if over)
```
Actual = sum of transactions in the linked month (already available from monthData.transactions).

#### Section 3: Linked Lists

- Heading "Linked Lists"
- Dropdown: select from availableLists not already linked → "Add List" button → PUTs updated linkedListIds
- Each linked list renders as a collapsible card: list name header, items below (checkbox state shown read-only, item name as ReactMarkdown), "Open list →" link to `/lists/:id`, remove button (×)

#### Section 4: Calendar

**Data helper:** `getDaysInRange(startDate, endDate)` → array of Date objects for each day inclusive.

**Desktop (`hidden sm:block`):** Week grid
- Header row: Sun Mon Tue Wed Thu Fri Sat (7 columns)
- Pad before first day and after last day with empty/greyed cells to complete weeks
- Each trip day cell: date number, activity count badge if > 0
- Clicking a trip day sets `expandedDay`; clicking again collapses
- Selected day highlighted with indigo border

**Expanded day panel** (below the grid, spans full width):
- Heading: formatted date (e.g. "Monday 12 May")
- Activities list: each activity shows title (bold), description (if any), location link (if any, opens in new tab). Edit button → inline form. Delete button.
- "Add +" button → shows inline activity form: title input, description textarea (`rows={4}`), location URL input, Save/Cancel
- Day notes: label "Notes", `<textarea rows={4}>` with current notes, saves on blur via `PUT /api/itineraries/:id/days/:date/notes`

**Mobile (`sm:hidden`):** Vertical stack of day cards
- Each card: date heading (e.g. "Mon 12 May"), activity count
- Tap to expand inline (same content as expanded day panel above)
- Expanded card has indigo background

---

## What is not changing

- Existing models: List, Item, Idea, Transaction, Month, ForecastSettings
- Existing routes and pages
- Auth middleware (new routes go under `/api`, so auth applies automatically)
