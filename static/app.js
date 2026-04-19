document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const menuGrid = document.getElementById('menuGrid');
    const categoryFilter = document.getElementById('categoryFilter');
    const cartBtn = document.getElementById('openCartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartItemsContainer = document.getElementById('cartItems');
    const subtotalAmount = document.getElementById('subtotalAmount');
    const cartCount = document.getElementById('cartCount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    const billModal = document.getElementById('billModal');
    const closeBillBtn = document.getElementById('closeBillBtn');
    const billBody = document.getElementById('billBody');

    const welcomeOverlay = document.getElementById('welcomeOverlay');
    const customerNameInput = document.getElementById('customerName');
    const startOrderingBtn = document.getElementById('startOrderingBtn');

    // State
    let userName = '';
    let menuData = {};
    let cart = []; // Array of {id, name, price, quantity}

    // Welcome Overlay Logic
    document.body.style.overflow = 'hidden'; // Prevent scrolling initially
    startOrderingBtn.addEventListener('click', () => {
        const name = customerNameInput.value.trim();
        if (name) {
            userName = name;
            welcomeOverlay.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
        } else {
            customerNameInput.style.borderColor = 'var(--accent)';
            setTimeout(() => customerNameInput.style.borderColor = '', 1000);
        }
    });

    // Fetch Menu
    fetch('/api/menu')
        .then(res => res.json())
        .then(data => {
            menuData = data;
            initApp();
        })
        .catch(err => {
            menuGrid.innerHTML = '<div class="error" style="text-align:center; width:100%; grid-column: 1 / -1; padding: 50px;">Failed to load menu. Please try again later.</div>';
            console.error('Error fetching menu:', err);
        });

    function initApp() {
        renderCategories();
        renderMenu('All');
    }

    function renderCategories() {
        const categories = ["Starters", "Beverages", "Breads", "Main Course", "Desserts"];
        categories.forEach(cat => {
            if (!menuData[cat]) return; // Fallback if a category is missing
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.dataset.category = cat;
            btn.textContent = cat;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderMenu(cat);
            });
            categoryFilter.appendChild(btn);
        });
        
        // Setup 'All' button
        document.querySelector('.cat-btn[data-category="All"]').addEventListener('click', (e) => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderMenu('All');
        });
    }

    function renderMenu(category) {
        menuGrid.innerHTML = '';
        let itemsToRender = [];

        if (category === 'All') {
            Object.values(menuData).forEach(catItems => {
                itemsToRender = itemsToRender.concat(catItems);
            });
        } else {
            itemsToRender = menuData[category] || [];
        }

        itemsToRender.forEach(item => {
            const el = document.createElement('div');
            el.className = 'menu-item';
            el.innerHTML = `
                <div>
                    <div class="item-header">
                        <span class="item-name">${item.name}</span>
                        <span class="item-price">$${item.price.toFixed(2)}</span>
                    </div>
                    <p class="item-desc">${item.description}</p>
                </div>
                <button class="add-to-cart-btn" onclick="addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price})">
                    <i class="fa-solid fa-plus"></i> Add to Cart
                </button>
            `;
            menuGrid.appendChild(el);
        });
    }

    // Cart Logic
    window.addToCart = function(id, name, price) {
        const existing = cart.find(item => item.id === id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }
        updateCartUI();
        
        // Small animation on cart button
        cartBtn.style.transform = 'scale(1.2)';
        setTimeout(() => cartBtn.style.transform = '', 200);
    };

    window.updateQty = function(id, delta) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            updateCartUI();
        }
    };

    window.removeFromCart = function(id) {
        cart = cart.filter(i => i.id !== id);
        updateCartUI();
    };

    function updateCartUI() {
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;
        let count = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Your cart is empty.</p>';
            checkoutBtn.disabled = true;
        } else {
            checkoutBtn.disabled = false;
            cart.forEach(item => {
                subtotal += item.price * item.quantity;
                count += item.quantity;

                const el = document.createElement('div');
                el.className = 'cart-item';
                el.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQty('${item.id}', -1)"><i class="fa-solid fa-minus"></i></button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQty('${item.id}', 1)"><i class="fa-solid fa-plus"></i></button>
                        <button class="remove-btn" onclick="removeFromCart('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                cartItemsContainer.appendChild(el);
            });
        }

        subtotalAmount.textContent = '$' + subtotal.toFixed(2);
        cartCount.textContent = count;
    }

    // Sidebar Toggle
    cartBtn.addEventListener('click', () => {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('show');
    });

    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    function closeCart() {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('show');
    }

    // Checkout
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return;

        checkoutBtn.textContent = 'Processing...';
        checkoutBtn.disabled = true;

        fetch('/api/bill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart: cart })
        })
        .then(res => res.json())
        .then(data => {
            closeCart();
            showBill(data);
            cart = []; // clear cart
            updateCartUI();
            checkoutBtn.textContent = 'Proceed to Checkout';
        })
        .catch(err => {
            console.error('Checkout error:', err);
            checkoutBtn.textContent = 'Proceed to Checkout';
            checkoutBtn.disabled = false;
            alert('Error generating bill.');
        });
    });

    function showBill(billData) {
        let itemsHtml = '';
        billData.items.forEach(item => {
            itemsHtml += `
                <div class="receipt-item">
                    <span>${item.quantity}x ${item.name}</span>
                    <span>$${item.total.toFixed(2)}</span>
                </div>
            `;
        });

        billBody.innerHTML = `
            <div class="success-icon"><i class="fa-solid fa-circle-check"></i></div>
            <h3 style="text-align: center; margin-bottom: 10px;">Order Successful!</h3>
            <p style="text-align: center; color: var(--text-muted); margin-bottom: 20px;">Thank You, ${userName}!</p>
            ${itemsHtml}
            <div class="receipt-divider"></div>
            <div class="receipt-item">
                <span>Subtotal</span>
                <span>$${billData.subtotal.toFixed(2)}</span>
            </div>
            <div class="receipt-item">
                <span>Tax (8%)</span>
                <span>$${billData.tax.toFixed(2)}</span>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-total">
                <span>Total</span>
                <span>$${billData.total.toFixed(2)}</span>
            </div>
        `;
        billModal.classList.add('show');
    }

    closeBillBtn.addEventListener('click', () => {
        billModal.classList.remove('show');
    });
});
