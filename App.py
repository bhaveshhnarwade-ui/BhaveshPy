from flask import Flask, render_template, jsonify, request
import sqlite3, os, math
from config import (
    SERVER_LAT, SERVER_LNG,
    MAX_DELIVERY_KM,
    FIXED_PREP_TIME, TRAVEL_PER_KM, HANDOFF_BUFFER
)

app = Flask(__name__)
app.json.sort_keys = False
app.config['JSON_SORT_KEYS'] = False

DB_PATH = os.path.join(os.path.dirname(__file__), 'menu.db')

# ── Seed Data ──────────────────────────────────────────────────────────────
MENU_SEED = [
    # Starters
    ("s1","Starters","Spring Rolls",5.99,"Crispy vegetable spring rolls","",15,
     "/static/images/spring_roll.jpg"),
    ("s2","Starters","Garlic Bread",4.99,"Toasted bread with garlic butter and herbs","Bestseller",12,
     "/static/images/Garlic_bread.jpg"),
    ("s3","Starters","French Fries",3.99,"Classic salted french fries","",10,
     "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&h=300&fit=crop&auto=format"),
    ("s4","Starters","Onion Rings",4.49,"Golden fried onion rings","",12,
     "https://images.unsplash.com/photo-1639024471283-03518883512d?w=500&h=300&fit=crop&auto=format"),
    ("s5","Starters","Mozzarella Sticks",6.99,"Cheese sticks with marinara sauce","New",15,
     "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&h=300&fit=crop&auto=format"),
    ("s6","Starters","Bruschetta",5.49,"Grilled bread rubbed with garlic and topped with tomatoes","Chef Special",12,
     "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500&h=300&fit=crop&auto=format"),
    ("s7","Starters","chicken Burger",2.99,"Middle Eastern style burger","",12,
     "/static/images/chicken_burger.jpg"),
    ("s8","Starters","Stuffed Mushrooms",7.49,"Mushrooms stuffed with cheese and herbs","Chef Special",15,
     "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&h=300&fit=crop&auto=format"),
    ("s9","Starters","Nachos",6.49,"Tortilla chips with melted cheese and jalapenos","New",10,
     "/static/images/Nachos.jpg"),


    # Beverages
    ("b1","Beverages","Cola",1.99,"Chilled cola","",5,
     "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=500&h=300&fit=crop&auto=format"),
    ("b2","Beverages","Lemonade",2.49,"Freshly squeezed lemon juice","",5,
     "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&h=300&fit=crop&auto=format"),
    ("b3","Beverages","Iced Tea",2.99,"Peach flavored iced tea","",5,
     "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=300&fit=crop&auto=format"),
    ("b4","Beverages","Cold Coffee",3.49,"Creamy cold coffee with ice cream","Chef Special",8,
     "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&h=300&fit=crop&auto=format"),
    ("b5","Beverages","Mango Shake",3.99,"Thick mango milkshake","Bestseller",8,
     "/static/images/mango_shake.jpg"),
    ("b6","Beverages","Orange Juice",2.99,"Fresh orange juice","",5,
     "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=300&fit=crop&auto=format"),
    ("b7","Beverages","Mojito",4.99,"Virgin mint mojito","New",8,
     "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=500&h=300&fit=crop&auto=format"),
    ("b8","Beverages","Hot Coffee",2.49,"Freshly brewed hot coffee","",8,
     "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&h=300&fit=crop&auto=format"),
    ("b9","Beverages","Green Tea",1.99,"Healthy green tea","",5,
     "/static/images/green_tea.jpg"),
    ("b10","Beverages","Water Bottle",0.99,"Mineral water","Bestseller",3,
     "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&h=300&fit=crop&auto=format"),

    # Breads
    ("br1","Breads","Plain Naan",1.99,"Soft Indian flatbread","",10,
     "/static/images/naan.jpg"),
    ("br2","Breads","Garlic Naan",2.49,"Naan topped with garlic and coriander","Bestseller",10,
     "/static/images/garlic_naan.jpg"),
    ("br3","Breads","Butter Naan",2.29,"Naan brushed with butter","",10,
     "/static/images/Butter_naan.jpg"),
    ("br4","Breads","Tandoori Roti",1.49,"Whole wheat bread cooked in clay oven","Bestseller",10,
     "/static/images/Tandoori_roti.jpg"),
    ("br5","Breads","Sourdough Slice",1.99,"Tangy artisanal bread","New",10,
     "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=300&fit=crop&auto=format"),
    ("br6","Breads","Ciabatta",3.49,"Italian white bread","",12,
     "/static/images/Ciabatta.jpg"),
    ("br7","Breads","Focaccia",4.49,"Italian flatbread with herbs","New",12,
     "/static/images/focaccia.jpg"),
    ("br8","Breads","Dinner Roll",0.99,"Mumbai's special paav","",8,
     "/static/images/Dinner_roll.jpg"),

    # Main Course
    ("m1","Main Course","Margherita Pizza",12.99,"Classic cheese and tomato pizza","",25,
     "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&h=300&fit=crop&auto=format"),
    ("m2","Main Course","Pasta Alfredo",14.99,"Creamy white sauce pasta","Chef Special",20,
     "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&h=300&fit=crop&auto=format"),
    ("m3","Main Course","Grilled Chicken",16.99,"Herb marinated grilled chicken breast","Bestseller",25,
     "/static/images/grilled_chicken.jpg"),
    ("m4","Main Course","Vegetable Biryani",13.49,"Aromatic rice dish with mixed vegetables","",25,
     "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=300&fit=crop&auto=format"),
    ("m5","Main Course","Butter Chicken",15.99,"Rich tomato and butter gravy with chicken","Bestseller",25,
     "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&h=300&fit=crop&auto=format"),
    ("m6","Main Course","Paneer Butter Masala",14.49,"Cottage cheese in rich tomato gravy","Bestseller",25,
     "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&h=300&fit=crop&auto=format"),
    ("m7","Main Course","Fish and Chips",17.99,"Fried battered fish with chips","New",22,
     "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=300&fit=crop&auto=format"),
    ("m9","Main Course","Pad Thai",13.99,"Stir-fried rice noodles with peanuts","Chef Special",20,
     "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500&h=300&fit=crop&auto=format"),
    ("m10","Main Course","Mushroom Risotto",15.49,"Creamy Italian rice dish with mushrooms","Chef Special",22,
     "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=500&h=300&fit=crop&auto=format"),
    ("m11","Main Course","Paneer Tikka",7.99,"Grilled marinated cottage cheese cubes","Bestseller",18,
     "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&h=300&fit=crop&auto=format"),
    ("m12","Main Course","Chicken Wings",8.99,"Spicy fried chicken wings","Chef Special",18,
     "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&h=300&fit=crop&auto=format"),
    ("m13","Main Course","tartare appetizer",3.99,"Finely chopped tuna with seasoning","Chef Special",12,
     "https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=500&h=300&fit=crop&auto=format"),

    # Desserts
    ("d1","Desserts","Chocolate Brownie",5.99,"Warm brownie with fudge sauce","",12,
     "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500&h=300&fit=crop&auto=format"),
    ("d2","Desserts","Vanilla Ice Cream",3.99,"Classic vanilla scoop","",8,
     "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&h=300&fit=crop&auto=format"),
    ("d3","Desserts","Cheesecake",6.49,"New York style cheesecake","Chef Special",10,
     "https://images.unsplash.com/photo-1578775887804-699de7086ff9?w=500&h=300&fit=crop&auto=format"),
    ("d4","Desserts","Tiramisu",6.99,"Italian coffee-flavored dessert","Bestseller",10,
     "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&h=300&fit=crop&auto=format"),
    ("d5","Desserts","Gulab Jamun",4.49,"Indian sweet syrup balls","",10,
     "/static/images/gulab_jamun.jpg"),
    ("d6","Desserts","Apple Pie",5.49,"Warm apple pie with cinnamon","New",12,
     "/static/images/Apple_pie.jpg"),
    ("d7","Desserts","Chocolate Mousse",5.99,"Light and airy chocolate dessert","New",10,
     "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=300&fit=crop&auto=format"),
    ("d8","Desserts","Fruit Salad",4.99,"Mixed fresh seasonal fruits","",8,
     "https://images.unsplash.com/photo-1568158879083-c42860933ed7?w=500&h=300&fit=crop&auto=format"),
    ("d9","Desserts","Panna Cotta",6.49,"Italian cream dessert","New",10,
     "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&h=300&fit=crop&auto=format"),
    ("d10","Desserts","Rasmalai",5.49,"Cottage cheese discs in sweetened milk","New",10,
     "/static/images/Rasmalai.jpg"),
    ("d11","Desserts","Gavla",22.99,"Bhiwandi's special sweet dish","Chef Special",30,
     "/static/images/gavla.jpg"),
]

CATEGORY_ORDER = ["Starters","Beverages","Breads","Main Course","Desserts"]

# ── Haversine distance helper ───────────────────────────────────────────────
def haversine_km(lat1, lon1, lat2, lon2):
    """Return distance in km between two GPS coordinates."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi   = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def delivery_time_mins(distance_km, item_prep=0):
    """
    Total = max(item_prep, FIXED_PREP_TIME) + travel + handoff
    """
    prep   = max(item_prep, FIXED_PREP_TIME)
    travel = distance_km * TRAVEL_PER_KM
    return int(prep + travel + HANDOFF_BUFFER)

# ── DB helpers ─────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS menu_items (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT DEFAULT '',
            tag TEXT DEFAULT '',
            delivery_time INTEGER DEFAULT 15,
            image_url TEXT DEFAULT ''
        )
    """)
    c.executemany("""
        INSERT INTO menu_items (id, category, name, price, description, tag, delivery_time, image_url)
        VALUES (?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET
            category=excluded.category,
            name=excluded.name,
            price=excluded.price,
            description=excluded.description,
            tag=excluded.tag,
            delivery_time=excluded.delivery_time,
            image_url=excluded.image_url
    """, MENU_SEED)
    conn.commit()
    conn.close()

# ── Routes ─────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/walkthrough")
def walkthrough():
    return render_template("walkthrough.html")

# ── Delivery check (called BEFORE showing menu) ────────────────────────────
@app.route("/api/check_delivery", methods=["POST"])
def check_delivery():
    data = request.get_json(force=True)
    try:
        user_lat = float(data["lat"])
        user_lng = float(data["lng"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Invalid coordinates"}), 400

    dist = haversine_km(SERVER_LAT, SERVER_LNG, user_lat, user_lng)
    in_range = dist <= MAX_DELIVERY_KM

    response = {
        "in_range":       in_range,
        "distance_km":    round(dist, 2),
        "max_km":         MAX_DELIVERY_KM,
    }
    if in_range:
        response["estimated_delivery_min"] = delivery_time_mins(dist)
    else:
        response["message"] = "Out of delivery range. We're growing soon!"

    return jsonify(response)

# ── Menu ───────────────────────────────────────────────────────────────────
@app.route("/api/menu")
def get_menu():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM menu_items ORDER BY category"
    ).fetchall()
    conn.close()

    grouped = {cat: [] for cat in CATEGORY_ORDER}
    for r in rows:
        cat = r["category"]
        if cat in grouped:
            grouped[cat].append({
                "id":            r["id"],
                "name":          r["name"],
                "price":         r["price"],
                "description":   r["description"],
                "tag":           r["tag"],
                "delivery_time": r["delivery_time"],
                "image_url":     r["image_url"]
            })
    return jsonify(grouped)

# ── Bill ───────────────────────────────────────────────────────────────────
@app.route("/api/bill", methods=["POST"])
def calculate_bill():
    data        = request.json
    cart        = data.get("cart", [])
    distance_km = float(data.get("distance_km", 0))

    subtotal   = 0
    items      = []
    prep_times = []   # avg kitchen time across all ordered item types

    conn = get_db()
    for cart_item in cart:
        item_id  = cart_item.get("id")
        quantity = cart_item.get("quantity", 1)
        row = conn.execute(
            "SELECT * FROM menu_items WHERE id=?", (item_id,)
        ).fetchone()
        if row:
            item_total = row["price"] * quantity
            subtotal  += item_total
            prep_times.append(row["delivery_time"])
            items.append({
                "name":     row["name"],
                "price":    row["price"],
                "quantity": quantity,
                "total":    round(item_total, 2)
            })
    conn.close()

    # Average prep time of ordered items (not max, not fixed) + 10 mins buffer
    avg_prep = (int(sum(prep_times) / len(prep_times)) if prep_times else FIXED_PREP_TIME) + 10
    eta      = delivery_time_mins(distance_km, avg_prep)

    tax_rate = 0.08
    tax      = subtotal * tax_rate
    total    = subtotal + tax

    return jsonify({
        "items":         items,
        "subtotal":      round(subtotal, 2),
        "tax":           round(tax, 2),
        "total":         round(total, 2),
        "delivery_time": eta,
        "distance_km":   round(distance_km, 2),
        "avg_prep_min":  avg_prep,
        # Server coords sent so frontend can render the Leaflet map
        "server_lat":    SERVER_LAT,
        "server_lng":    SERVER_LNG
    })

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
