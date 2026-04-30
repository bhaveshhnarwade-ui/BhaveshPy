# Gourmet Bites — Competition Project Walkthrough

**Project:** Gourmet Bites — Luxury Online Food Ordering System  
**Team:** Runtime Terrors  
**License:** MIT © 2026 Nirbhay Umesh Mali

---

## 1. Project Overview

Gourmet Bites is a **full-stack web application** for online food ordering, built entirely with open-source technologies. It simulates a real restaurant ordering workflow:

1. **Customer enters name** → GPS location requested silently  
2. **Range check** → `/api/check_delivery` confirms within 15 km, else out-of-range screen  
3. **Browses the menu** → 50 dishes across 5 categories with images, prices, tags (no ETA shown yet)  
4. **Searches for dishes** → Real-time search bar filters across name + description  
5. **Adds items to cart** → Slide-out cart sidebar with quantity controls  
6. **Confirms & checks out** → Two-step confirmation → Receipt with ETA breakdown + Leaflet delivery map  
7. **Contacts the restaurant** → Contact Us modal from navbar and footer

### Why This Stands Out

| Differentiator | Detail |
|---|---|
| **Full-stack** | Python Flask backend + SQLite database + Vanilla JS frontend |
| **Zero frameworks** | No React, no Tailwind — raw HTML/CSS/JS for full control |
| **Luxury UI** | Custom Black/Gold/Cream/Dark Brown premium theme |
| **50 menu items** | Each with photo, price, description, tag, and delivery time |
| **Mobile-first** | Compact card layout on mobile, full grid on desktop |
| **Delivery gating** | GPS-based range check before menu loads; >15 km blocked |
| **Live route map** | Leaflet + OpenStreetMap in receipt — restaurant → user pin |
| **Inspect protection** | Right-click off, F12 blocked, DevTools window-size detection |
| **Single file deploy** | `python App.py` — auto-creates DB, seeds data, runs server |

---

## 2. Architecture

```
┌──────────────────────────────────────────────────┐
│                   BROWSER                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │index.html│ │  app.js  │ │     p.css        │ │
│  │(structure)│ │ (logic)  │ │ (luxury theme)   │ │
│  └──────────┘ └────┬─────┘ └──────────────────┘ │
│                     │                            │
│          fetch('/api/menu')                      │
│          fetch('/api/bill', POST)                │
└─────────────────────┬────────────────────────────┘
                      │  HTTP (JSON)
┌─────────────────────▼────────────────────────────┐
│                  FLASK SERVER                     │
│  ┌─────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │  @app.route  │ │ get_db()   │ │ init_db()   │ │
│  │  "/"         │ │ connection │ │ seed data   │ │
│  │  "/api/menu" │ │ factory    │ │ if empty    │ │
│  │  "/api/bill" │ └─────┬──────┘ └─────┬───────┘ │
│  │  "/walkthru" │       │              │         │
│  └─────────────┘       │              │         │
│                  ┌─────▼──────────────▼───────┐ │
│                  │        menu.db (SQLite)     │ │
│                  │  ┌──────────────────────┐   │ │
│                  │  │ menu_items table      │   │ │
│                  │  │ id | category | name  │   │ │
│                  │  │ price | description   │   │ │
│                  │  │ tag | delivery_time   │   │ │
│                  │  │ image_url             │   │ │
│                  │  └──────────────────────┘   │ │
│                  └────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Data Flow

1. **Page Load** → Browser requests `/` → Flask returns `index.html`
2. **Name entry** → Browser Geolocation API fetches GPS coords → POST to `/api/check_delivery`
3. **Range check** → Server Haversine distance vs `MAX_DELIVERY_KM` → in_range true/false
4. **Menu Load** → `app.js` calls `fetch('/api/menu')` → Flask queries SQLite → Returns JSON
5. **Add to Cart** → Client-side only (JavaScript array `cart[]`)
6. **Checkout** → `app.js` POSTs `{cart, distance_km}` to `/api/bill` → Flask calculates avg prep + travel + buffer → Returns JSON with ETA + server coords
7. **Receipt** → `app.js` renders bill + Leaflet map (restaurant pin + user pin + dashed route)

---

## 3. Technology Stack — Detailed

### 3.1 Backend — Python Flask

| Component | Version | Purpose |
|---|---|---|
| **Python** | 3.x | Server-side runtime |
| **Flask** | Latest | Lightweight WSGI micro-framework |
| **sqlite3** | stdlib | Embedded relational database |
| **os** | stdlib | File path resolution for `menu.db` |

**Why Flask?** Minimal boilerplate, no ORM needed for a single-table schema, built-in JSON serialization, and perfect for a single-file backend.

### 3.2 Database — SQLite

| Column | Type | Purpose |
|---|---|---|
| `id` | TEXT PK | Unique item identifier (e.g. `s1`, `m5`, `d4`) |
| `category` | TEXT | One of: Starters, Beverages, Breads, Main Course, Desserts |
| `name` | TEXT | Dish display name |
| `price` | REAL | Price in USD |
| `description` | TEXT | Short description shown on card |
| `tag` | TEXT | `Bestseller`, `Chef Special`, `New`, or empty string |
| `delivery_time` | INTEGER | Estimated prep + delivery time in minutes |
| `image_url` | TEXT | Unsplash CDN URL for the dish photo |

**Why SQLite?** Zero-config, serverless, self-contained — the DB file is created automatically, no install needed. Perfect for a portable competition demo.

### 3.3 Frontend

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic document structure |
| **Vanilla CSS** | Full custom styling with CSS variables |
| **Vanilla JavaScript** | DOM manipulation, fetch API, cart state management |
| **Leaflet 1.9.4** | Interactive delivery route map in receipt modal |
| **OpenStreetMap** | Free map tiles for Leaflet (no API key required) |
| **Browser Geolocation API** | `navigator.geolocation` — GPS coords for delivery range check |
| **Font Awesome 6** | 200+ icons (cart, search, phone, map pins, etc.) |
| **Google Fonts** | Cormorant Garamond (headings), Outfit (body text) |
| **Unsplash** | High-quality dish photos via CDN URLs |

---

## 4. Backend Logic — Function-by-Function

### 4.1 `get_db()` — Database Connection Factory

```python
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
```

**What it does:**
- Opens a connection to `menu.db` (path resolved from `App.py`'s directory)
- Sets `row_factory = sqlite3.Row` so query results are accessible as dictionaries (`row["name"]`) instead of tuples (`row[2]`)
- Returns the connection for the caller to use and close

**Design decision:** We use a factory function rather than a persistent connection because SQLite handles concurrent reads well and Flask's request lifecycle is short.

---

### 4.2 `init_db()` — Auto-Setup + Seed

```python
def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS menu_items (
            id TEXT PRIMARY KEY, category TEXT NOT NULL,
            name TEXT NOT NULL, price REAL NOT NULL,
            description TEXT DEFAULT '', tag TEXT DEFAULT '',
            delivery_time INTEGER DEFAULT 15, image_url TEXT DEFAULT ''
        )
    """)
    c.execute("SELECT COUNT(*) FROM menu_items")
    if c.fetchone()[0] == 0:
        c.executemany("INSERT INTO menu_items VALUES (?,?,?,?,?,?,?,?)", MENU_SEED)
    conn.commit()
    conn.close()
```

**Logic breakdown:**
1. `CREATE TABLE IF NOT EXISTS` — Idempotent: safe to run multiple times without error
2. `SELECT COUNT(*)` — Check if data already exists
3. `if count == 0` → Seed 50 items from `MENU_SEED` list using `executemany()` for batch performance
4. `commit()` + `close()` — Persist and release

**Called from:** `if __name__ == "__main__": init_db()` — runs once when the server starts

---

### 4.3 Route: `GET /api/menu` — Menu Retrieval

```python
@app.route("/api/menu")
def get_menu():
    conn = get_db()
    rows = conn.execute("SELECT * FROM menu_items ORDER BY category").fetchall()
    conn.close()
    grouped = {cat: [] for cat in CATEGORY_ORDER}
    for r in rows:
        cat = r["category"]
        if cat in grouped:
            grouped[cat].append({
                "id": r["id"], "name": r["name"], "price": r["price"],
                "description": r["description"], "tag": r["tag"],
                "delivery_time": r["delivery_time"], "image_url": r["image_url"]
            })
    return jsonify(grouped)
```

**Logic:**
1. Queries all 50 items ordered alphabetically by category
2. Groups them into a dict: `{ "Starters": [...], "Beverages": [...], ... }`
3. Uses `CATEGORY_ORDER` list to maintain a fixed display order (not alphabetical)
4. Returns JSON with `jsonify()` — Flask sets `Content-Type: application/json` automatically

**Response structure:**
```json
{
  "Starters": [{ "id":"s1", "name":"Spring Rolls", "price":5.99, ... }],
  "Beverages": [...],
  "Breads": [...],
  "Main Course": [...],
  "Desserts": [...]
}
```

---

### 4.4 Route: `POST /api/bill` — Bill Calculation

```python
@app.route("/api/bill", methods=["POST"])
def calculate_bill():
    data        = request.json
    cart        = data.get("cart", [])
    distance_km = float(data.get("distance_km", 0))  # sent by frontend

    subtotal, items, prep_times = 0, [], []
    conn = get_db()
    for cart_item in cart:
        row = conn.execute("SELECT * FROM menu_items WHERE id=?",
                           (cart_item["id"],)).fetchone()
        if row:
            qty        = cart_item["quantity"]
            item_total = row["price"] * qty
            subtotal  += item_total
            prep_times.append(row["delivery_time"])   # collect per-item
            items.append({"name": row["name"], "price": row["price"],
                          "quantity": qty, "total": round(item_total, 2)})
    conn.close()

    avg_prep = (int(sum(prep_times) / len(prep_times)) if prep_times else 15) + 10
    eta      = delivery_time_mins(distance_km, avg_prep)  # avg + travel + buffer
    tax      = subtotal * 0.08
    return jsonify({
        "items": items, "subtotal": round(subtotal,2),
        "tax": round(tax,2), "total": round(subtotal+tax,2),
        "delivery_time": eta, "distance_km": round(distance_km,2),
        "avg_prep_min": avg_prep,
        "server_lat": SERVER_LAT, "server_lng": SERVER_LNG  # for Leaflet map
    })
```

**Logic:**
1. Reads `cart` and `distance_km` from POST body
2. Fetches **real price from DB** for each item (never trusts client price)
3. Collects `delivery_time` per item → computes **average** (not max)
4. `delivery_time_mins(distance_km, avg_prep)` = `(avg_prep + 10) + distance×4 + 5`
5. Returns ETA + `server_lat/lng` so frontend can draw the Leaflet map

**Security:** Parameterised queries (`WHERE id=?`) prevent SQL injection.

---

### 4.5 Route: `POST /api/check_delivery` — Range Gate

```python
@app.route("/api/check_delivery", methods=["POST"])
def check_delivery():
    data     = request.get_json(force=True)
    user_lat = float(data["lat"])
    user_lng = float(data["lng"])
    dist     = haversine_km(SERVER_LAT, SERVER_LNG, user_lat, user_lng)
    in_range = dist <= MAX_DELIVERY_KM
    response = {"in_range": in_range, "distance_km": round(dist, 2)}
    if in_range:
        response["estimated_delivery_min"] = delivery_time_mins(dist)
    else:
        response["message"] = "Out of delivery range. We're growing soon!"
    return jsonify(response)
```

**Logic:**
- Uses the **Haversine formula** (great-circle distance) from `config.py` coords
- `in_range: false` triggers the out-of-range screen in the browser
- Called immediately after the user enters their name — before the menu loads

**`config.py`** — change before every demo:
```python
SERVER_LAT = 19.3008   # ← paste college latitude here
SERVER_LNG = 73.0593   # ← paste college longitude here
MAX_DELIVERY_KM  = 15
FIXED_PREP_TIME  = 15   # min
TRAVEL_PER_KM    = 4    # min/km
HANDOFF_BUFFER   = 5    # min
```

---

### 4.5 Route: `GET /walkthrough` — Documentation Page

```python
@app.route("/walkthrough")
def walkthrough():
    return render_template("walkthrough.html")
```

Simply serves the styled walkthrough HTML page at `/walkthrough`.

---

## 5. Frontend Logic — Function-by-Function (`app.js`)

### 5.1 Application State

```javascript
let userName       = '';       // Customer name from welcome overlay
let menuData       = {};       // { "Starters": [...], "Beverages": [...], ... }
let cart           = [];       // [{ id, name, price, quantity }, ...]
let activeCategory = 'All';    // Current filter: "All" | "Starters" | etc.
let searchQuery    = '';       // Current search text (lowercase)
```

All state is kept in JavaScript variables — no localStorage, no cookies. Cart resets on page reload (intentional for a restaurant kiosk scenario).

---

### 5.2 Welcome Flow (with Geolocation)

```javascript
startOrderingBtn.addEventListener('click', () => {
    const name = customerNameInput.value.trim();
    if (name && /^[a-zA-Z\s]+$/.test(name)) {
        userName = name;
        startOrderingBtn.disabled = true;
        startOrderingBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking location…';
        checkUserLocation();   // ← geolocation starts here
    } else { /* show error */ }
});

function checkUserLocation() {
    navigator.geolocation.getCurrentPosition(
        (pos) => callDeliveryAPI(pos.coords.latitude, pos.coords.longitude),
        (err) => proceedToMenu(0)   // if denied → allow through (demo mode)
    );
}

function callDeliveryAPI(lat, lng) {
    fetch('/api/check_delivery', { method:'POST', body: JSON.stringify({lat, lng}) })
    .then(r => r.json())
    .then(data => {
        if (data.in_range) {
            userLat = lat; userLng = lng;
            userDistanceKm = data.distance_km;
            proceedToMenu(userDistanceKm);   // ← no ETA shown here
        } else {
            showOutOfRange(data.message);    // ← out-of-range screen
        }
    });
}
```

**Key design:** ETA is **NOT** shown when the menu opens. It appears only on the receipt after the order is placed, so it reflects the actual items ordered.

---

### 5.3 Menu Fetching & Initialisation

```javascript
fetch('/api/menu')
    .then(r => r.json())
    .then(data => { menuData = data; initApp(); })
    .catch(() => { /* show error */ });

function initApp() {
    renderCategories();
    renderMenu();
}
```

Uses the **Fetch API** (native browser, no Axios/jQuery needed). Stores the grouped menu data globally, then calls two render functions.

---

### 5.4 `renderCategories()` — Dynamic Filter Buttons

```javascript
function renderCategories() {
    const cats = Object.keys(menuData);   // ["Starters","Beverages",...]
    cats.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.dataset.category = cat;
        btn.textContent = cat;
        btn.addEventListener('click', () => {
            setCategory(cat);
            // toggle active class
        });
        categoryFilter.appendChild(btn);
    });
}
```

**Dynamic:** Categories aren't hardcoded in HTML — they're generated from the API response keys. If a new category is added to the DB, it appears automatically.

---

### 5.5 `renderMenu()` — Card Grid Rendering

This is the **core rendering function**. It:

1. **Collects items** based on `activeCategory` (All = concatenate all arrays)
2. **Filters by search** using `String.includes()` on name AND description
3. **Shows search notice** with result count or "no results" message
4. **Generates HTML cards** with: image, tag badge, name, price, delivery time, description, add button

```javascript
items.forEach(item => {
    // Tag class mapping
    const tagClass = item.tag === 'Bestseller' ? 'bestseller'
                   : item.tag === 'Chef Special' ? 'chef-special'
                   : item.tag === 'New' ? 'new' : '';

    // Fallback image
    const imgUrl = item.image_url || 'fallback-url';

    el.innerHTML = `
        <div class="item-img-wrap">
            <img class="item-img" src="${imgUrl}" alt="${item.name}"
                 loading="lazy" onerror="this.src='fallback'">
            <span class="item-tag ${tagClass}">${tagIcon} ${item.tag}</span>
        </div>
        <div class="item-body">
            <span class="item-name">${item.name}</span>
            <span class="item-price">$${item.price.toFixed(2)}</span>
            <span class="item-delivery">~${item.delivery_time} mins</span>
            <p class="item-desc">${item.description}</p>
            <button onclick="addToCart(...)">Add to Cart</button>
        </div>
    `;
});
```

**Key techniques:**
- `loading="lazy"` — Browser lazy-loads images for performance (50 images!)
- `onerror` — Fallback to generic food image if Unsplash URL fails
- `toFixed(2)` — Always show 2 decimal places ($5.99, not $5.9)
- `item.name.replace(/'/g, "\\'")` — Escape apostrophes in onclick handlers

---

### 5.6 Search Engine

```javascript
searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    if (searchQuery) {
        activeCategory = 'All';   // Search across all categories
    }
    renderMenu();   // Re-render with filter
});
```

**Inside `renderMenu()`:**
```javascript
if (searchQuery) {
    items = items.filter(i =>
        i.name.toLowerCase().includes(searchQuery) ||
        i.description.toLowerCase().includes(searchQuery)
    );
}
```

**How it works:**
- Triggers on every keystroke (`input` event, not `keypress`)
- Converts to lowercase for case-insensitive matching
- Searches both name and description fields
- Resets category to "All" so search spans the entire menu
- Shows dynamic result count: "Showing **3** result(s) for **chicken**"

---

### 5.7 Cart System

**Three global functions (attached to `window` for onclick access):**

| Function | Purpose |
|---|---|
| `addToCart(id, name, price)` | Add item or increment quantity if already in cart |
| `updateQty(id, delta)` | +1 or -1 quantity; remove if ≤ 0 |
| `removeFromCart(id)` | Delete item from cart entirely |

```javascript
window.addToCart = (id, name, price) => {
    const existing = cart.find(i => i.id === id);
    if (existing) { existing.quantity += 1; }
    else { cart.push({ id, name, price, quantity: 1 }); }
    updateCartUI();
    // Bounce animation on cart icon
    cartBtn.style.transform = 'scale(1.25)';
    setTimeout(() => cartBtn.style.transform = '', 220);
};
```

**`updateCartUI()`** — Re-renders the sidebar:
- Iterates `cart[]`, creates DOM elements for each item
- Calculates running subtotal and item count
- Updates header badge count
- Enables/disables checkout button based on cart emptiness

---

### 5.8 Checkout Flow (Two-Step Confirmation)

```
[Checkout Button] → [Confirm Modal] → [POST /api/bill] → [Receipt Modal]
```

1. **Step 1:** User clicks "Proceed to Checkout" → Opens confirm modal
2. **Step 2:** User clicks "Yes, Place Order" → 
   - Closes confirm modal and cart sidebar
   - Sends POST to `/api/bill` with cart data
   - Server calculates bill with real DB prices
   - Receipt modal shows: items, subtotal, tax, total, delivery time
3. **Cart is cleared** after successful checkout

```javascript
confirmOrderBtn.addEventListener('click', () => {
    fetch('/api/bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // distance_km sent so server can calculate accurate ETA
        body: JSON.stringify({ cart, distance_km: userDistanceKm })
    })
    .then(r => r.json())
    .then(data => {
        showBill(data);   // renders receipt + Leaflet map
        cart = [];
        updateCartUI();
    });
});
```

---

### 5.9 `showBill()` — Receipt Rendering

Dynamically builds the receipt HTML:

```javascript
function showBill(data) {
    billBody.innerHTML = `
        ✅ Order Successful!
        Thank you, ${userName}!
        ─────────────────
        2× Butter Chicken     $31.98
        1× Garlic Naan        $2.49
        ─────────────────
        Subtotal              $34.47
        Tax (8%)              $2.76
        ─────────────────
        TOTAL                 $37.23

        🏍 Your order will arrive in ~25 minutes
    `;
}
```

**Delivery time calculation:** The server returns `max_delivery` — the longest prep time among all ordered items. E.g., if you order Water Bottle (3 min) + Beef Steak (30 min), the estimate is **30 minutes** (the bottleneck dish determines total wait).

---

### 5.10 Modal System

All three modals (Confirm, Bill/Receipt, Contact) share the same CSS pattern:

```css
.bill-modal {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(10px);
    opacity: 0; pointer-events: none;
}
.bill-modal.show {
    opacity: 1; pointer-events: all;
}
```

**Toggle pattern:** Adding/removing `.show` class controls visibility. `pointer-events: none` prevents clicks when hidden. `backdrop-filter: blur()` creates a frosted-glass effect behind modals.

Clicking the backdrop (dark area) closes any modal:
```javascript
[confirmModal, billModal, contactModal].forEach(modal => {
    modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('show');
    });
});
```

---

## 6. CSS Design System — Luxury Theme

### 6.1 Color Palette

| Variable | Hex | Usage |
|---|---|---|
| `--bg-dark` | `#0a0804` | Page background (near-black with warm undertone) |
| `--bg-card` | `#14100a` | Card backgrounds (dark brown-black) |
| `--bg-card2` | `#1c1610` | Secondary surfaces (search bar, inputs) |
| `--primary` | `#c9a84c` | Gold — primary accent, headings, prices |
| `--primary-hover` | `#e8c96a` | Bright gold — hover states |
| `--accent` | `#d4af37` | Deep gold — badges, accents |
| `--text-main` | `#f5f0e8` | Cream — body text |
| `--text-muted` | `#9a8a7a` | Muted tan — descriptions, secondary text |

### 6.2 Typography

- **Headings:** Cormorant Garamond (serif, elegant, luxury feel)
- **Body text:** Outfit (clean sans-serif, excellent readability)
- **Hero title:** CSS gradient text using `background-clip: text` → Gold shimmer effect

```css
.hero h1 {
    background: linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
```

### 6.3 Glassmorphism

Used on navbar and modals:
```css
.navbar {
    background: rgba(10,8,4,0.96);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(201,168,76,0.22);
}
```

### 6.4 Tag Badge System

| Tag | Background | Text Color | Border |
|---|---|---|---|
| 🥇 Bestseller | `#c9a84c` gold | `#0a0804` black | — |
| 👨‍🍳 Chef Special | `#8B6914` amber | `#fff0d0` cream | — |
| ✨ New | `#1a4a1a` forest | `#90ee90` light green | `#3a8a3a` |

### 6.5 Mobile Responsive Design

**Breakpoint: ≤768px** — Cards switch from vertical grid to horizontal list:

```css
@media (max-width: 768px) {
    .menu-grid { grid-template-columns: 1fr; gap: 0; }
    .menu-item { flex-direction: row; }
    .item-img-wrap { width: 90px; height: 90px; }
}
```

This means on mobile, each dish is a compact row: `[90px image] [name + price + add button]`

---

## 7. Security Considerations

| Threat | Mitigation |
|---|---|
| **SQL Injection** | Parameterised queries (`WHERE id=?`) — never string concatenation |
| **Price Manipulation** | Server fetches price from DB, ignores client-sent price |
| **XSS** | User-supplied name validated with regex (`/^[a-zA-Z\s]+$/`) |
| **Distance Bypass** | Range check done server-side; client cannot fake being in range |
| **Inspect / Copy** | Right-click disabled, F12/Ctrl+Shift+I/Ctrl+U blocked, DevTools size heuristic |
| **CORS** | Not configured — same-origin requests only |

---

## 8. Key Design Patterns

### 8.1 Client-Server Separation
- **Client** manages UI state (cart, active category, search query)
- **Server** manages data (menu items) and business logic (bill calculation)
- Communication via **RESTful JSON API** (`GET /api/menu`, `POST /api/bill`)

### 8.2 Idempotent Database Setup
- `CREATE TABLE IF NOT EXISTS` — safe to run repeatedly
- `if count == 0 then seed` — won't duplicate data on restart

### 8.3 Event-Driven UI
- All UI updates are triggered by events (`click`, `input`)
- Single `renderMenu()` function handles all re-renders (category change, search, initial load)

### 8.4 Progressive Enhancement
- Page loads with a loading spinner
- Menu populates via async fetch
- Images load lazily with `loading="lazy"`
- Fallback image on `onerror`

---

## 9. File Structure

```
Project Menu/
├── App.py                 ← Flask server (routes, Haversine, bill logic)
│                             Routes: /, /api/menu, /api/bill, /api/check_delivery, /walkthrough
│                             Helpers: haversine_km(), delivery_time_mins()
│
├── config.py              ← EDIT THIS before demo (server location + delivery settings)
│                             SERVER_LAT, SERVER_LNG, MAX_DELIVERY_KM, TRAVEL_PER_KM, etc.
│
├── menu.db                ← SQLite database (auto-created on first run)
│
├── static/
│   ├── app.js             ← Frontend: geolocation, delivery check, Leaflet map, cart
│   ├── p.css              ← Luxury theme + map pin styles + out-of-range overlay
│   └── Dream_big.jpg      ← Welcome overlay background
│
└── templates/
    ├── index.html          ← Main app (Leaflet CDN + inspect protection script)
    ├── walkthrough.html    ← Styled walkthrough page
    └── walkthrough.md      ← This documentation file
```

---

## 10. API Reference

### `GET /api/menu`

**Returns:** Menu items grouped by category

```json
{
  "Starters": [
    {
      "id": "s1",
      "name": "Spring Rolls",
      "price": 5.99,
      "description": "Crispy vegetable spring rolls",
      "tag": "",
      "delivery_time": 15,
      "image_url": "https://images.unsplash.com/..."
    }
  ],
  "Beverages": [...],
  "Breads": [...],
  "Main Course": [...],
  "Desserts": [...]
}
```

### `POST /api/check_delivery`

**Request body:**
```json
{ "lat": 19.28, "lng": 73.05 }
```
**Response (in range):**
```json
{ "in_range": true, "distance_km": 3.2, "estimated_delivery_min": 38 }
```
**Response (out of range):**
```json
{ "in_range": false, "distance_km": 22.7, "message": "Out of delivery range. We're growing soon!" }
```

### `POST /api/bill`

**Request body:**
```json
{
  "cart": [
    { "id": "m5", "quantity": 2 },
    { "id": "br2", "quantity": 1 }
  ],
  "distance_km": 3.2
}
```

**Response:**
```json
{
  "items": [
    { "name": "Butter Chicken", "price": 15.99, "quantity": 2, "total": 31.98 },
    { "name": "Garlic Naan",   "price": 2.49,  "quantity": 1, "total": 2.49  }
  ],
  "subtotal": 34.47, "tax": 2.76, "total": 37.23,
  "delivery_time": 38,
  "distance_km": 3.2,
  "avg_prep_min": 18,
  "server_lat": 19.3008,
  "server_lng": 73.0593
}
```

---

## 11. Running the Project

```bash
# 1. Install Flask (one-time)
pip install flask

# 2. Start the server
python App.py

# 3. Open in browser
http://localhost:5000

# 4. View walkthrough
http://localhost:5000/walkthrough
```

The SQLite database `menu.db` is created and seeded **automatically** on first run. No manual setup needed.

---

## 12. Tag Assignments

### Bestseller (10 items)
Garlic Bread, Paneer Tikka, Mango Shake, Water Bottle, Garlic Naan, Tandoori Roti, Grilled Chicken, Butter Chicken, Paneer Butter Masala, Tiramisu

### Chef Special (10 items)
Bruschetta, Chicken Wings, Stuffed Mushrooms, Cold Coffee, Baguette, Pasta Alfredo, Beef Steak, Pad Thai, Mushroom Risotto, Cheesecake

### New (10 items)
Mozzarella Sticks, Nachos, Mojito, Sourdough Slice, Focaccia, Fish and Chips, Apple Pie, Chocolate Mousse, Panna Cotta, Rasmalai

---

*Built with ❤️ by Runtime Terrors | © 2026 Nirbhay Umesh Mali*
