# Store — Management System

Order, inventory and sales management for stores with WhatsApp/Instagram/Shopify channels.

**Other languages:** [README.md](README.md) (Spanish)

---

## Project structure

```
tienda-sistema/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                        # React entry point
    ├── App.jsx                         # Main layout + tab routing
    │
    ├── constants/
    │   ├── index.js                    # States, transitions, colors, WA template
    │   └── seedData.js                 # Sample data (products, customers, orders)
    │
    ├── utils/
    │   └── index.js                    # Helper functions (formatting, stock, IDs)
    │
    ├── hooks/
    │   └── useStore.js                 # Global state + business logic
    │
    ├── components/
    │   ├── UI.jsx                      # Reusable components (Btn, Input, Modal, Badge...)
    │   ├── Sidebar.jsx                 # Side navigation
    │   ├── WhatsAppModal.jsx           # WhatsApp message template
    │   └── CreateOrderModal.jsx        # New order form
    │
    └── pages/
        ├── PedidosPage.jsx             # Order list + detail, history, transitions
        ├── CajaPage.jsx                # Inventory + stock adjustment + direct sale
        └── ReportesPage.jsx            # Charts, top products, low stock, summary
```

---

## Verification (components and APIs)

The app has been checked so that all components use the APIs correctly:

| Area | API usage | Behaviour |
|------|-----------|-----------|
| **Login** | `authApi.login` | Token stored in `tokenManager`; 401 triggers logout and toast. |
| **Orders** | `ordersApi.list`, `get`, `create`, `transition`, `updateAddress`, `history` | List, detail, create, change state, edit address, history. `normaliseOrder` unifies backend formats. |
| **Caja** | `inventoryApi.balances`, `adjust`; `productsApi` + `variantsApi` via store | Inventory, adjustments, direct sale (multiple negative `adjust`). Available stock with `getBalance` / `getAvailable`. |
| **Reports** | `reportsApi.salesInRange`, `reportsApi.topProducts` | Date range, daily/weekly charts, top products; data normalized for API format. |
| **WhatsApp** | `whatsappApi.message(orderId)` | Message template; accepts `message`/`text`/`body` and `waLink`/`link`/`url`. |
| **Store (useStore)** | `productsApi`, `variantsApi`, `ordersApi`, `inventoryApi` | Load and mutations delegated to API; errors in `setError`, loading by key. |

- **UI**: Badge, Modal, Toast, Input, Select, Btn, AlertBox use state and props safely; `STATE_COLORS` and `ORDER_STATE_LABELS` cover uppercase and Spanish variants.
- **Build**: `npm run build` completes without errors; no linter errors in `src/`.

---

## Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Business logic

### Order state machine
```
Pending → Confirmed → Preparing → Shipped → Delivered
    ↓          ↓           ↓          ↓
 Cancelled  Cancelled  Cancelled  (n/a)
```

- Steps cannot be skipped (validated in `useStore.js > transitionOrder`)
- Shipped cannot be set if the customer has no address

### Stock handling (ADR-1)
| Event        | Effect on stock                              |
|-------------|-----------------------------------------------|
| Create order | No change (pending reserve only)             |
| Confirmed   | `reserved += quantity`                        |
| Delivered  | `stock -= quantity`, `reserved -= quantity`    |
| Cancelled  | `reserved -= quantity` (if was confirmed)     |
| Manual adjust | `stock += delta` (reason required)          |
| Direct sale | `stock -= quantity` immediately              |

### WhatsApp template
Generated with order and customer variables. Includes button to open in WhatsApp Web.

---

## Tech stack
- **Framework**: React 18 + **Vite 5**
- CSS-in-JS (inline styles, no UI lib)

---

## REST API and token

The app connects to the API at the URL set in `VITE_API_URL` (see `.env.example`).

- **Login**: `POST /auth/login` with `{ username, password }`. Response includes a JWT (`token`, `accessToken` or `jwt`).
- **Token**: Stored in memory and `sessionStorage` (`jwt_token`). Authenticated requests send `Authorization: Bearer <token>`.
- **401**: If the server returns 401, the client clears the token and fires `auth:logout` (app redirects to login and shows session expired).

---

## Deploy (e.g. GitHub Pages)

The repo includes a workflow to build and deploy the frontend on push to `main`. Enable GitHub Pages with source **GitHub Actions** and ensure `.github/workflows/deploy.yml` is present.
