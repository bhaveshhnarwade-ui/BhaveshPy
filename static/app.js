document.addEventListener('DOMContentLoaded', () => {
    // ── Elements ──────────────────────────────────────────────────────────
    const menuGrid          = document.getElementById('menuGrid');
    const categoryFilter    = document.getElementById('categoryFilter');
    const cartBtn           = document.getElementById('openCartBtn');
    const closeCartBtn      = document.getElementById('closeCartBtn');
    const cartSidebar       = document.getElementById('cartSidebar');
    const cartOverlay       = document.getElementById('cartOverlay');
    const cartItemsEl       = document.getElementById('cartItems');
    const subtotalAmount    = document.getElementById('subtotalAmount');
    const cartCount         = document.getElementById('cartCount');
    const checkoutBtn       = document.getElementById('checkoutBtn');
    const billModal         = document.getElementById('billModal');
    const closeBillBtn      = document.getElementById('closeBillBtn');
    const billBody          = document.getElementById('billBody');
    const welcomeOverlay    = document.getElementById('welcomeOverlay');
    const customerNameInput = document.getElementById('customerName');
    const startOrderingBtn  = document.getElementById('startOrderingBtn');
    const confirmModal      = document.getElementById('confirmModal');
    const confirmOrderBtn   = document.getElementById('confirmOrderBtn');
    const cancelOrderBtn    = document.getElementById('cancelOrderBtn');
    const searchInput       = document.getElementById('searchInput');
    const searchNotice      = document.getElementById('searchNotice');
    const contactModal      = document.getElementById('contactModal');
    const closeContactBtn   = document.getElementById('closeContactBtn');
    const contactNavBtn     = document.getElementById('contactNavBtn');
    const contactFooterBtn  = document.getElementById('contactFooterBtn');
    const outOfRangeOverlay = document.getElementById('outOfRangeOverlay');
    const oorMessage        = document.getElementById('oorMessage');

    // ── State ─────────────────────────────────────────────────────────────
    let userName       = '';
    let menuData       = {};
    let cart           = [];
    let activeCategory = 'All';
    let searchQuery    = '';
    let userLat        = null;   // stored after geolocation
    let userLng        = null;
    let userDistanceKm = 0;
    let deliveryMapInstance = null;  // Leaflet map — reused across receipts


    // ✅ GLOBAL CURRENCY FORMAT FUNCTION
function formatPrice(amount) {
    return '₹' + amount.toLocaleString('en-IN');
}


    // ── Welcome ───────────────────────────────────────────────────────────
    document.body.style.overflow = 'hidden';

    startOrderingBtn.addEventListener('click', () => {
        const name = customerNameInput.value.trim();
        if (name && /^[a-zA-Z\s]+$/.test(name)) {
            userName = name;
            startOrderingBtn.disabled = true;
            startOrderingBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking location…';
            checkUserLocation();
        } else {
            customerNameInput.value = '';
            customerNameInput.placeholder = 'Letters only, please!';
            customerNameInput.style.borderColor = '#ef4444';
            setTimeout(() => {
                customerNameInput.style.borderColor = '';
                customerNameInput.placeholder = 'Your Name';
            }, 2000);
        }
    });

    customerNameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') startOrderingBtn.click();
    });

    // ── Geolocation + Delivery Range Check ────────────────────────────────
    function checkUserLocation() {
        if (!navigator.geolocation) {
            showLocationError("Location services are not supported by your browser. We need your location to deliver.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => callDeliveryAPI(pos.coords.latitude, pos.coords.longitude),
            (err) => { 
                console.warn('Geolocation:', err.message); 
                showLocationError("Please enable location permissions and refresh. We need your location to verify delivery range."); 
            },
            { timeout: 8000, maximumAge: 60000 }
        );
    }

    function callDeliveryAPI(lat, lng) {
        fetch('/api/check_delivery', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ lat, lng })
        })
        .then(r => r.json())
        .then(data => {
            if (data.in_range) {
                // Store coords for the Leaflet map shown AFTER order is placed
                userLat = lat;
                userLng = lng;
                userDistanceKm = data.distance_km || 0;
                proceedToMenu(userDistanceKm);
                // ✅ No ETA shown here — user hasn't ordered yet
            } else {
                showOutOfRange(data.message || "Out of delivery range. We're growing soon!");
            }
        })
        .catch(() => {
            // If the server check fails, we can't verify range.
            showLocationError("Failed to connect to the server to verify your location. Please try again later.");
        });
    }

    function proceedToMenu(distKm) {
        userDistanceKm = distKm;
        welcomeOverlay.classList.add('hidden');
        setTimeout(() => {
            welcomeOverlay.style.display = 'none';
            document.body.style.overflow = '';
        }, 850);
        startOrderingBtn.disabled = false;
        startOrderingBtn.innerHTML = 'Begin Ordering &nbsp;<i class="fa-solid fa-arrow-right"></i>';
        loadMenu();
    }

    function showOutOfRange(msg) {
        welcomeOverlay.classList.add('hidden');
        setTimeout(() => { welcomeOverlay.style.display = 'none'; }, 850);
        document.body.style.overflow = '';
        if (oorMessage) oorMessage.textContent = msg;
        
        // Reset title to out of range just in case
        const title = outOfRangeOverlay.querySelector('h2');
        if (title) title.textContent = "Out of Delivery Range";
        
        outOfRangeOverlay.style.display = 'flex';
    }

    function showLocationError(msg) {
        welcomeOverlay.classList.add('hidden');
        setTimeout(() => { welcomeOverlay.style.display = 'none'; }, 850);
        document.body.style.overflow = '';
        if (oorMessage) oorMessage.textContent = msg;
        
        // Change title to Location Required
        const title = outOfRangeOverlay.querySelector('h2');
        if (title) title.textContent = "Location Required";
        
        outOfRangeOverlay.style.display = 'flex';
        
        // Re-enable button in case they go back
        startOrderingBtn.disabled = false;
        startOrderingBtn.innerHTML = 'Begin Ordering &nbsp;<i class="fa-solid fa-arrow-right"></i>';
    }

    // ── Fetch Menu ────────────────────────────────────────────────────────
    function loadMenu() {
        fetch('/api/menu')
            .then(r => r.json())
            .then(data => { menuData = data; initApp(); })
            .catch(() => {
                menuGrid.innerHTML = '<div class="error-msg"><i class="fa-solid fa-triangle-exclamation"></i> Failed to load menu.</div>';
            });
    }

    function initApp() {
        renderCategories();
        renderMenu();
    }

    // ── Categories (FIXED - NO DUPLICATION) ───────────────────────────────────
function renderCategories() {

function setCategory(cat) {
    activeCategory = cat;

    // Reset search when category is clicked
    searchInput.value = '';
    searchQuery = '';
    searchNotice.style.display = 'none';

    renderMenu();
}

    // ✅ Remove all buttons except "All"
    const allBtn = categoryFilter.querySelector('[data-category="All"]');
    categoryFilter.innerHTML = '';
    categoryFilter.appendChild(allBtn);

    const cats = Object.keys(menuData);

    cats.forEach(cat => {
        if (!menuData[cat]) return;

        const btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.dataset.category = cat;
        btn.textContent = cat;

        btn.addEventListener('click', () => {
            setCategory(cat);

            categoryFilter.querySelectorAll('.cat-btn')
                .forEach(b => b.classList.remove('active'));

            btn.classList.add('active');
        });

        categoryFilter.appendChild(btn);
    });

    // ✅ Ensure "All" button works properly
    allBtn.addEventListener('click', (e) => {
        setCategory('All');

        categoryFilter.querySelectorAll('.cat-btn')
            .forEach(b => b.classList.remove('active'));

        e.target.classList.add('active');
    });
}
    // ── Search ────────────────────────────────────────────────────────────
    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        if (searchQuery) {
            categoryFilter.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            categoryFilter.querySelector('[data-category="All"]').classList.add('active');
            activeCategory = 'All';
        } else {
            searchNotice.style.display = 'none';
        }
        renderMenu();
    });

    // ── Render Menu ───────────────────────────────────────────────────────
    function renderMenu() {
        menuGrid.innerHTML = '';
        let items = [];
        if (activeCategory === 'All') {
            Object.values(menuData).forEach(arr => items = items.concat(arr));
        } else {
            items = menuData[activeCategory] || [];
        }

        if (searchQuery) {
            items = items.filter(i =>
                i.name.toLowerCase().includes(searchQuery) ||
                i.description.toLowerCase().includes(searchQuery)
            );
            searchNotice.style.display = 'block';
            searchNotice.innerHTML = items.length === 0
                ? `<i class="fa-solid fa-magnifying-glass"></i> No dishes found for "<strong>${searchQuery}</strong>"`
                : `<i class="fa-solid fa-magnifying-glass"></i> Showing <strong>${items.length}</strong> result(s) for "<strong>${searchQuery}</strong>"`;
        }

        if (items.length === 0 && !searchQuery) {
            menuGrid.innerHTML = '<div class="error-msg">No items in this category.</div>';
            return;
        }

        items.forEach(item => {
            const tagClass = item.tag === 'Bestseller' ? 'bestseller'
                           : item.tag === 'Chef Special' ? 'chef-special'
                           : item.tag === 'New' ? 'new' : '';
            const tagIcon  = item.tag === 'Bestseller' ? '🥇'
                           : item.tag === 'Chef Special' ? '👨‍🍳'
                           : item.tag === 'New' ? '✨' : '';
            const tagHtml  = item.tag ? `<span class="item-tag ${tagClass}">${tagIcon} ${item.tag}</span>` : '';
            const imgUrl   = item.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=300&fit=crop&auto=format';

            const el = document.createElement('div');
            el.className = 'menu-item';
            el.innerHTML = `
                <div class="item-img-wrap">
                    <img class="item-img" src="${imgUrl}" alt="${item.name}" loading="lazy"
                         onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=300&fit=crop&auto=format'">
                    ${tagHtml}
                </div>
                <div class="item-body">
                    <div class="item-header">
                        <span class="item-name">${item.name}</span>
                        <span class="item-price">${formatPrice(item.price)}</span>
                    </div>
                    <div class="item-meta">
                        <span class="item-delivery"><i class="fa-solid fa-clock"></i> ~${item.delivery_time} mins prep</span>
                    </div>
                    <p class="item-desc">${item.description}</p>
                    <button class="add-to-cart-btn" onclick="addToCart('${item.id}','${item.name.replace(/'/g,"\\'")}',${item.price})">
                        <i class="fa-solid fa-plus"></i> Add to Cart
                    </button>
                </div>
            `;
            menuGrid.appendChild(el);
        });
    }

    // ── Cart Logic ────────────────────────────────────────────────────────
    window.addToCart = (id, name, price) => {
        const ex = cart.find(i => i.id === id);
        if (ex) { ex.quantity += 1; }
        else { cart.push({ id, name, price, quantity: 1 }); }
        updateCartUI();
        cartBtn.style.transform = 'scale(1.25)';
        setTimeout(() => cartBtn.style.transform = '', 220);
    };

    window.updateQty = (id, delta) => {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
            updateCartUI();
        }
    };

    window.removeFromCart = id => {
        cart = cart.filter(i => i.id !== id);
        updateCartUI();
    };

    function updateCartUI() {
        cartItemsEl.innerHTML = '';
        let subtotal = 0, count = 0;
        if (cart.length === 0) {
            cartItemsEl.innerHTML = '<p class="empty-cart-msg"><i class="fa-regular fa-face-sad-tear"></i><br>Your cart is empty.</p>';
            checkoutBtn.disabled = true;
        } else {
            checkoutBtn.disabled = false;
            cart.forEach(item => {
                subtotal += item.price * item.quantity;
                count    += item.quantity;
                const el = document.createElement('div');
                el.className = 'cart-item';
                el.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQty('${item.id}',-1)"><i class="fa-solid fa-minus"></i></button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQty('${item.id}',1)"><i class="fa-solid fa-plus"></i></button>
                        <button class="remove-btn" onclick="removeFromCart('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                cartItemsEl.appendChild(el);
            });
        }
        subtotalAmount.textContent = formatPrice(subtotal);
        cartCount.textContent = count;
    }

    // ── Sidebar Toggle ────────────────────────────────────────────────────
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

    // ── Checkout Flow ─────────────────────────────────────────────────────
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return;
        confirmModal.classList.add('show');
    });
    cancelOrderBtn.addEventListener('click', () => confirmModal.classList.remove('show'));

    confirmOrderBtn.addEventListener('click', () => {
        confirmModal.classList.remove('show');
        closeCart();
        confirmOrderBtn.textContent = 'Placing Order…';
        confirmOrderBtn.disabled = true;

    // 🕒 Check if user is late BEFORE sending request
    const pickupTime = localStorage.getItem("pickupTime");
    const now = Date.now();

    let isUserLate = false;
    if (pickupTime && now > pickupTime) {
        isUserLate = true;
    }

    fetch('/api/bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cart: cart,
            distance_km: userDistanceKm,
            is_late: isUserLate   // 👈 HERE
        })
    })
    .then(r => r.json())
    .then(data => {
        // 🕒 Store pickup time using ETA
        const eta = data.delivery_time;  // already coming from backend
        const pickupTime = Date.now() + (eta * 60 * 1000);
        localStorage.setItem("pickupTime", pickupTime);
        showBill(data);
        cart = [];
        updateCartUI();
        confirmOrderBtn.textContent = 'Yes, Place Order';
        confirmOrderBtn.disabled = false;
        })
    .catch(() => {
            alert('Error generating bill.');
            confirmOrderBtn.textContent = 'Yes, Place Order';
            confirmOrderBtn.disabled = false;
            billBody.innerHTML = `...`;
        });
    });

    // ── Bill / Receipt with Leaflet Map ───────────────────────────────────
    function showBill(data) {
        let itemsHtml = '';
        data.items.forEach(item => {
            itemsHtml += `
                <div class="receipt-item">
                    <span>${item.quantity}× ${item.name}</span>
                    <span>${formatPrice(item.total)}</span>
                </div>`;
        });

        const eta      = data.delivery_time || 20;   // FIX 1: was data.pickup_time (undefined) — backend key is delivery_time
        const dist     = data.distance_km   || 0;
        const avgPrep  = data.avg_prep_min  || 15;
        const distLabel = dist > 0 ? ` &nbsp;·&nbsp; ${dist.toFixed(1)} km` : '';
        const mapsLink = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${data.server_lat},${data.server_lng}&travelmode=driving`;
        
        billBody.innerHTML = `
            <div class="success-icon"><i class="fa-solid fa-circle-check"></i></div>
            <h3 style="text-align:center;margin-bottom:6px;color:var(--text-main);
                font-family:'Cormorant Garamond',serif;font-size:1.5rem;">Order Placed!</h3>
            <p style="text-align:center;color:var(--text-muted);margin-bottom:20px;">
                Thank you, <strong style="color:var(--primary)">${userName}</strong>!
            </p>
            ${itemsHtml}
            <div class="receipt-divider"></div>
            <div class="receipt-item"><span>Subtotal</span><span>${formatPrice(data.subtotal)}</span></div>
            <div class="receipt-item"><span>Tax (8%)</span><span>${formatPrice(data.tax)}</span></div>
            ${data.penalty > 0 ? `
                <div class="receipt-item" style="color:#ef4444;">
                    <span>Late Pickup Fine</span>
                    <span>₹${data.penalty}</span>
                </div>` : ''}
            <div class="receipt-divider"></div>
            <div class="receipt-total"><span>Total</span><span>${formatPrice(data.total)}</span></div>

            <div class="delivery-banner">
                <i class="fa-solid fa-motorcycle"></i>
                <div>
                    <p><strong>Pickup after:</strong> ~${eta} minutes</p>
                    <p>Follow the route below to reach the restaurant.</p>
                    <p style="font-size:.78rem;margin-top:4px;opacity:.7;">
                        Avg kitchen prep ${avgPrep} min
                        + travel ${dist > 0 ? (dist * 3).toFixed(0) : '0'} min
                        + 5 min handoff
                    </p>
                </div>
            </div>

            ${(data.server_lat && userLat) ? `
            <div class="map-section">
                <div class="map-label">
                    <i class="fa-solid fa-map-location-dot"></i> "Route to Restaurant"
                </div>
                <div id="deliveryMap"></div>
                <div class="map-legend">
                    <span><span class="legend-dot restaurant"></span> Restaurant</span>
                    <span><span class="legend-dot user"></span> Your Location</span>
                </div>
            </div>

            <a href="${mapsLink}" target="_blank" class="navigate-btn">
                <i class="fa-solid fa-location-arrow"></i> Navigate via Google Maps
            </a>
            ` : ''}
        `;

        billModal.classList.add('show');

        // FIX 2: Destroy existing map instance BEFORE creating a new one
        // (was placed after initMap call — too late, caused "already initialized" error)
        if (deliveryMapInstance) {
            deliveryMapInstance.remove();
            deliveryMapInstance = null;
        }

        // Init Leaflet map after the modal is visible and DOM is painted
        if (data.server_lat && userLat) {
            setTimeout(() => {
                initMap(data.server_lat, data.server_lng, userLat, userLng);
            }, 100);
        }
    }

    // FIX 3: Moved closeBillBtn listener OUTSIDE showBill() — was inside,
    // causing duplicate listeners to stack up on every order placed
    closeBillBtn.addEventListener('click', () => {
        billModal.classList.remove('show');
    });

    function initMap(resLat, resLng, userLat, userLng) {
        // FIX 4: Removed the erroneous second destroy block that was INSIDE
        // initMap() and killed the map immediately after creating it

        deliveryMapInstance = L.map('deliveryMap').setView([userLat, userLng], 13);

        // FIX 5: All .addTo(map) replaced with .addTo(deliveryMapInstance)
        // `map` was never defined — the variable is named deliveryMapInstance
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(deliveryMapInstance);

        // ── Custom gold icon for restaurant ──────────────────────────────
        const restaurantIcon = L.divIcon({
            className: '',
            html: `<div class="map-pin restaurant-pin"><i class="fa-solid fa-utensils"></i></div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -40]
        });

        // ── Custom blue icon for user ─────────────────────────────────────
        const userIcon = L.divIcon({
            className: '',
            html: `<div class="map-pin user-pin"><i class="fa-solid fa-house"></i></div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -36]
        });

        const restaurantMarker = L.marker([resLat, resLng], { icon: restaurantIcon })
            .addTo(deliveryMapInstance)
            .bindPopup('<strong>🍽 Gourmet Bites</strong><br>Pickup Location');

        const userMarker = L.marker([userLat, userLng], { icon: userIcon })
            .addTo(deliveryMapInstance)
            .bindPopup(`<strong>📍 Your Location</strong>`);

        // Dashed delivery route line
        L.polyline([[resLat, resLng], [userLat, userLng]], {
            color: '#c9a84c',
            weight: 3,
            opacity: 0.85,
            dashArray: '8, 6'
        }).addTo(deliveryMapInstance);

        // Fit map to show both markers with padding
        const bounds = L.latLngBounds([[resLat, resLng], [userLat, userLng]]);
        deliveryMapInstance.fitBounds(bounds, { padding: [30, 30] });

        // Force re-render in case modal caused layout shift
        deliveryMapInstance.invalidateSize();
    }

    // ── Contact Modal ─────────────────────────────────────────────────────
    function openContact() { contactModal.classList.add('show'); }
    closeContactBtn.addEventListener('click', () => contactModal.classList.remove('show'));
    contactNavBtn.addEventListener('click', openContact);
    if (contactFooterBtn) contactFooterBtn.addEventListener('click', e => {
        e.preventDefault(); openContact();
    });

    // Close modals on backdrop click
    [confirmModal, billModal, contactModal].forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) modal.classList.remove('show');
        });
    });
});