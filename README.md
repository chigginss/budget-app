# Personal Assistant

A personal life-organisation app with budget tracking, financial forecasting, and list management.

## Setup

**Prerequisites:** Node.js 18+, MongoDB running locally on port 27017

**Install dependencies:**
```bash
npm run install:all
```

**Run in development:**
```bash
npm run dev
```

This starts:
- Server at http://localhost:5000
- Client at http://localhost:5173

## Pages

- **Dashboard** `/` — navigation hub, create custom lists
- **Ledger** `/ledger` — track monthly spending, upload bank screenshots
- **Forecast** `/forecast` — project savings over 12 months
- **Focus List** `/focus` — priority task list with drag-and-drop
- **Wish List** `/wishlist` — things to buy
- **Dreaming** `/dreaming` — long-term goals and saving target
- **Custom Lists** `/lists/:id` — user-created lists
