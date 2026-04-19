from flask import Flask, render_template, jsonify, request

app = Flask(__name__)
app.json.sort_keys = False
app.config['JSON_SORT_KEYS'] = False


MENU = {
    "Starters": [
        {"id": "s1", "name": "Spring Rolls", "price": 5.99, "description": "Crispy vegetable spring rolls"},
        {"id": "s2", "name": "Garlic Bread", "price": 4.99, "description": "Toasted bread with garlic butter and herbs"},
        {"id": "s3", "name": "French Fries", "price": 3.99, "description": "Classic salted french fries"},
        {"id": "s4", "name": "Onion Rings", "price": 4.49, "description": "Golden fried onion rings"},
        {"id": "s5", "name": "Mozzarella Sticks", "price": 6.99, "description": "Cheese sticks with marinara sauce"},
        {"id": "s6", "name": "Bruschetta", "price": 5.49, "description": "Grilled bread rubbed with garlic and topped with tomatoes"},
        {"id": "s7", "name": "Chicken Wings", "price": 8.99, "description": "Spicy buffalo wings"},
        {"id": "s8", "name": "Stuffed Mushrooms", "price": 7.49, "description": "Mushrooms stuffed with cheese and herbs"},
        {"id": "s9", "name": "Nachos", "price": 6.49, "description": "Tortilla chips with melted cheese and jalapenos"},
        {"id": "s10", "name": "Paneer Tikka", "price": 7.99, "description": "Grilled marinated cottage cheese cubes"}
    ],
    "Beverages": [
        {"id": "b1", "name": "Cola", "price": 1.99, "description": "Chilled cola"},
        {"id": "b2", "name": "Lemonade", "price": 2.49, "description": "Freshly squeezed lemon juice"},
        {"id": "b3", "name": "Iced Tea", "price": 2.99, "description": "Peach flavored iced tea"},
        {"id": "b4", "name": "Cold Coffee", "price": 3.49, "description": "Creamy cold coffee with ice cream"},
        {"id": "b5", "name": "Mango Shake", "price": 3.99, "description": "Thick mango milkshake"},
        {"id": "b6", "name": "Orange Juice", "price": 2.99, "description": "Fresh orange juice"},
        {"id": "b7", "name": "Mojito", "price": 4.99, "description": "Virgin mint mojito"},
        {"id": "b8", "name": "Hot Coffee", "price": 2.49, "description": "Freshly brewed hot coffee"},
        {"id": "b9", "name": "Green Tea", "price": 1.99, "description": "Healthy green tea"},
        {"id": "b10", "name": "Water Bottle", "price": 0.99, "description": "Mineral water"}
    ],
    "Breads": [
        {"id": "br1", "name": "Plain Naan", "price": 1.99, "description": "Soft Indian flatbread"},
        {"id": "br2", "name": "Garlic Naan", "price": 2.49, "description": "Naan topped with garlic and coriander"},
        {"id": "br3", "name": "Butter Naan", "price": 2.29, "description": "Naan brushed with butter"},
        {"id": "br4", "name": "Tandoori Roti", "price": 1.49, "description": "Whole wheat bread cooked in clay oven"},
        {"id": "br5", "name": "Pita Bread", "price": 2.99, "description": "Middle Eastern flatbread"},
        {"id": "br6", "name": "Baguette", "price": 3.99, "description": "French stick bread"},
        {"id": "br7", "name": "Sourdough Slice", "price": 1.99, "description": "Tangy artisanal bread"},
        {"id": "br8", "name": "Ciabatta", "price": 3.49, "description": "Italian white bread"},
        {"id": "br9", "name": "Focaccia", "price": 4.49, "description": "Italian flatbread with herbs"},
        {"id": "br10", "name": "Dinner Roll", "price": 0.99, "description": "Soft and fluffy bread roll"}
    ],
    "Main Course": [
        {"id": "m1", "name": "Margherita Pizza", "price": 12.99, "description": "Classic cheese and tomato pizza"},
        {"id": "m2", "name": "Pasta Alfredo", "price": 14.99, "description": "Creamy white sauce pasta"},
        {"id": "m3", "name": "Grilled Chicken", "price": 16.99, "description": "Herb marinated grilled chicken breast"},
        {"id": "m4", "name": "Vegetable Biryani", "price": 13.49, "description": "Aromatic rice dish with mixed vegetables"},
        {"id": "m5", "name": "Butter Chicken", "price": 15.99, "description": "Rich tomato and butter gravy with chicken"},
        {"id": "m6", "name": "Paneer Butter Masala", "price": 14.49, "description": "Cottage cheese in rich tomato gravy"},
        {"id": "m7", "name": "Fish and Chips", "price": 17.99, "description": "Fried battered fish with chips"},
        {"id": "m8", "name": "Beef Steak", "price": 22.99, "description": "Grilled beef steak with vegetables"},
        {"id": "m9", "name": "Pad Thai", "price": 13.99, "description": "Stir-fried rice noodles with peanuts"},
        {"id": "m10", "name": "Mushroom Risotto", "price": 15.49, "description": "Creamy Italian rice dish with mushrooms"}
    ],
    "Desserts": [
        {"id": "d1", "name": "Chocolate Brownie", "price": 5.99, "description": "Warm brownie with fudge sauce"},
        {"id": "d2", "name": "Vanilla Ice Cream", "price": 3.99, "description": "Classic vanilla scoop"},
        {"id": "d3", "name": "Cheesecake", "price": 6.49, "description": "New York style cheesecake"},
        {"id": "d4", "name": "Tiramisu", "price": 6.99, "description": "Italian coffee-flavored dessert"},
        {"id": "d5", "name": "Gulab Jamun", "price": 4.49, "description": "Indian sweet syrup balls"},
        {"id": "d6", "name": "Apple Pie", "price": 5.49, "description": "Warm apple pie with cinnamon"},
        {"id": "d7", "name": "Chocolate Mousse", "price": 5.99, "description": "Light and airy chocolate dessert"},
        {"id": "d8", "name": "Fruit Salad", "price": 4.99, "description": "Mixed fresh seasonal fruits"},
        {"id": "d9", "name": "Panna Cotta", "price": 6.49, "description": "Italian cream dessert"},
        {"id": "d10", "name": "Rasmalai", "price": 5.49, "description": "Cottage cheese discs in sweetened milk"}
    ]
}

# Flatten the menu for easy ID lookup
FLAT_MENU = {item["id"]: item for category in MENU.values() for item in category}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/menu")
def get_menu():
    return jsonify(MENU)

@app.route("/api/bill", methods=["POST"])
def calculate_bill():
    data = request.json
    cart = data.get("cart", [])
    
    subtotal = 0
    items = []
    
    for cart_item in cart:
        item_id = cart_item.get("id")
        quantity = cart_item.get("quantity", 1)
        if item_id in FLAT_MENU:
            menu_item = FLAT_MENU[item_id]
            item_total = menu_item["price"] * quantity
            subtotal += item_total
            items.append({
                "name": menu_item["name"],
                "price": menu_item["price"],
                "quantity": quantity,
                "total": round(item_total, 2)
            })
            
    tax_rate = 0.08 # 8% tax
    tax = subtotal * tax_rate
    total = subtotal + tax
    
    return jsonify({
        "items": items,
        "subtotal": round(subtotal, 2),
        "tax": round(tax, 2),
        "total": round(total, 2)
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
