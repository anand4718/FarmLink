// --- Main Execution on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Functions that run on every page
    updateNavbar();
    handleMobileMenu();
    updateCartIcon();

    // Page-specific functions
    if (document.querySelector('#product-grid')) displayProducts();
    if (document.querySelector('#addProductForm')) handleAddProductForm();
    if (document.querySelector('#category-product-grid')) displayCategoryProducts();
    if (document.querySelector('#login-form')) handleLoginForm();
    if (document.querySelector('.cart-container')) displayCartItems();
    if (document.querySelector('#checkout-form')) handleCheckoutForm();
    if (document.querySelector('#orders-container')) displayOrders();
    
    addGlobalEventListeners();
});


// --- Core Data Management (using localStorage) ---
const AppData = {
    getUser: () => JSON.parse(localStorage.getItem('farmLinkUser')),
    setUser: (user) => localStorage.setItem('farmLinkUser', JSON.stringify(user)),
    logout: () => localStorage.removeItem('farmLinkUser'),
    getCart: () => JSON.parse(localStorage.getItem('farmLinkCart')) || [],
    saveCart: (cart) => localStorage.setItem('farmLinkCart', JSON.stringify(cart)),
    getOrders: () => JSON.parse(localStorage.getItem('farmLinkOrders')) || [],
    saveOrders: (orders) => localStorage.setItem('farmLinkOrders', JSON.stringify(orders)),
};


// --- Dynamic Navigation Bar ---
function updateNavbar() {
    const user = AppData.getUser();
    const navbarContainer = document.getElementById('navbar');
    if (!navbarContainer) return;

    let navHTML = `
        <a href="index.html" class="nav-logo">FarmLink</a>
        <ul class="nav-menu">
            <li class="nav-item"><a href="farmers-list.html" class="nav-link">Farmers</a></li>
            <li class="nav-item"><a href="marketplace.html" class="nav-link">Marketplace</a></li>
            <li class="nav-item"><a href="about.html" class="nav-link">About Us</a></li>
    `;

    if (user) {
        navHTML += `<li class="nav-item"><a href="orders.html" class="nav-link">My Orders</a></li>`;
    }

    navHTML += `</ul><div class="nav-actions">`;

    if (user) {
        navHTML += `<span class="nav-link">Hi, ${user.email.split('@')[0]}</span>
                    <a href="#" id="logout-btn" class="nav-link">Logout</a>`;
    } else {
        navHTML += `<a href="login.html" class="nav-link">Login</a>`;
    }
    
    navHTML += `
            <a href="cart.html" class="nav-cart">
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-count" id="cart-count">0</span>
            </a>
        </div>
        <div class="hamburger">
            <span class="bar"></span><span class="bar"></span><span class="bar"></span>
        </div>
    `;
    navbarContainer.innerHTML = navHTML;
}

function handleMobileMenu() {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");
    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });
    }
}


// --- Global Event Listeners (for dynamically added content) ---
function addGlobalEventListeners() {
    document.body.addEventListener('click', (e) => {
        // Logout button
        if (e.target.id === 'logout-btn') {
            e.preventDefault();
            AppData.logout();
            window.location.href = 'index.html';
        }
        // Add to Cart button
        if (e.target.matches('.add-to-cart-btn')) {
            const card = e.target.closest('.product-card');
            const product = {
                name: card.querySelector('h4').textContent,
                price: card.querySelector('.product-price').textContent,
                image: card.querySelector('img').src
            };
            addToCart(product);
        }
        // Remove from cart button
        if(e.target.matches('.cart-item-remove')) {
            const itemName = e.target.dataset.name;
            removeFromCart(itemName);
        }
    });
}

// --- Login Functionality ---
function handleLoginForm() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        if (email) {
            AppData.setUser({ email: email });
            window.location.href = 'index.html';
        }
    });
}


// --- Cart Functionality ---
function addToCart(product) {
    let cart = AppData.getCart();
    cart.push(product);
    AppData.saveCart(cart);
    updateCartIcon();
    alert(`${product.name} has been added to your cart!`);
}

function removeFromCart(productName) {
    let cart = AppData.getCart();
    cart = cart.filter(item => item.name !== productName);
    AppData.saveCart(cart);
    displayCartItems(); // Re-render the cart page
}

function updateCartIcon() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = AppData.getCart().length;
    }
}

function displayCartItems() {
    const cart = AppData.getCart();
    const container = document.getElementById('cart-items-container');
    const summaryContainer = document.getElementById('cart-summary');
    if (!container || !summaryContainer) return;

    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        summaryContainer.style.display = 'none';
        return;
    }
    
    summaryContainer.style.display = 'block';
    container.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        // Extract number from price string like "$4.99 / lb"
        const priceValue = parseFloat(item.price.replace(/[^0-9.-]+/g,""));
        subtotal += priceValue;

        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>${item.price}</p>
                    <button class="cart-item-remove" data-name="${item.name}">Remove</button>
                </div>
            </div>
        `;
    });
    
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + tax;

    summaryContainer.innerHTML = `
        <h3>Order Summary</h3>
        <p><span>Subtotal</span> <span>$${subtotal.toFixed(2)}</span></p>
        <p><span>Tax (5%)</span> <span>$${tax.toFixed(2)}</span></p>
        <p class="total"><span>Total</span> <span>$${total.toFixed(2)}</span></p>
        <a href="checkout.html" class="btn btn-primary btn-full">Proceed to Checkout</a>
    `;
}


// --- Checkout and Order Placement ---
function handleCheckoutForm() {
    const form = document.getElementById('checkout-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = AppData.getUser();
        if (!user) {
            alert('You must be logged in to place an order.');
            window.location.href = 'login.html';
            return;
        }

        const cart = AppData.getCart();
        if(cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 days for delivery

        const newOrder = {
            orderId: `FM${Date.now()}`,
            date: new Date().toLocaleDateString(),
            items: cart,
            status: 'Processing',
            deliveryEstimate: deliveryDate.toLocaleDateString()
        };
        
        let orders = AppData.getOrders();
        orders.unshift(newOrder); // Add to the beginning of the list
        AppData.saveOrders(orders);
        AppData.saveCart([]); // Clear the cart

        alert('Order placed successfully!');
        window.location.href = 'orders.html';
    });
}

// --- Order History Display ---
function displayOrders() {
    const orders = AppData.getOrders();
    const container = document.getElementById('orders-container');
    if (!container) return;
    
    const user = AppData.getUser();
    if (!user) {
        container.innerHTML = '<p>Please <a href="login.html">login</a> to see your orders.</p>';
        return;
    }

    if (orders.length === 0) {
        container.innerHTML = '<p>You have not placed any orders yet.</p>';
        return;
    }

    container.innerHTML = '';
    orders.forEach(order => {
        let itemsHTML = '';
        order.items.forEach(item => {
            itemsHTML += `<p>${item.name} - ${item.price}</p>`;
        });
        
        container.innerHTML += `
            <div class="order-card">
                <div class="order-header">
                    <div><span>Order ID</span> <strong>#${order.orderId}</strong></div>
                    <div><span>Date Placed</span> <strong>${order.date}</strong></div>
                    <div><span>Status</span> <strong class="order-status processing">${order.status}</strong></div>
                    <div><span>Est. Delivery</span> <strong>${order.deliveryEstimate}</strong></div>
                </div>
                <div class="order-item-list">
                    ${itemsHTML}
                </div>
            </div>
        `;
    });
}


// --- Dummy functions from previous steps (to avoid errors) ---
function displayProducts() {}
function handleAddProductForm() {}
// --- Function to display products on the category-products.html page ---
function displayCategoryProducts() {
    const productGrid = document.getElementById('category-product-grid');
    if (!productGrid) {
        return; // Exit if we're not on the category products page
    }

    // A sample database of products.
    // A sample database of products.
const productDatabase = {
    'vegetables': [
        { name: 'Potato', price: '₹120 / kg', image: 'potato.webp' },
        { name: 'tomato', price: '₹50 / bunch', image: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { name: 'capsisum', price: '₹60 / kg', image: 'https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=600' }
    ],
    'fruits': [
        { name: 'Organic Strawberries', price: '₹250 / 250g', image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { name: 'Fresh Blueberries', price: '₹300 / 125g', image: 'https://images.pexels.com/photos/128420/pexels-photo-128420.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { name: 'Red Apples', price: '₹180 / kg', image: 'https://images.pexels.com/photos/209439/pexels-photo-209439.jpeg?auto=compress&cs=tinysrgb&w=600' }
    ],
    'meat': [
        { name: 'Grass-Fed Ribeye', price: '₹800 / 500g', image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { name: ' Chicken', price: '₹350 / kg', image: 'https://images.pexels.com/photos/262967/pexels-photo-262967.jpeg?auto=compress&cs=tinysrgb&w=600' }
    ],
    'dairy': [
        { name: 'Pasture-Raised Eggs', price: '₹150 / dozen', image: 'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=600' },
        { name: 'Artisanal Goat Cheese', price: '₹450 / 100g', image: 'https://images.pexels.com/photos/5185162/pexels-photo-5185162.jpeg?auto=compress&cs=tinysrgb&w=600' }
    ]
};
    // 1. Get the category from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    const categoryTitle = document.getElementById('category-title');
    const categorySubtitle = document.getElementById('category-subtitle');

    if (category && productDatabase[category]) {
        // 2. Update the page title
        categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categorySubtitle.textContent = `Showing the freshest picks for ${category}.`;
        
        // 3. Get the products for the selected category
        const productsToDisplay = productDatabase[category];
        productGrid.innerHTML = ''; // Clear any existing content

        // 4. Create and display a card for each product
        productsToDisplay.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'card product-card';
            // IMPORTANT: The button now has the 'add-to-cart-btn' class
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <div class="card-body">
                    <h4>${product.name}</h4>
                    <p class="product-price">${product.price}</p>
                    <button class="btn btn-primary add-to-cart-btn">Add to Cart</button>
                </div>
            `;
            productGrid.appendChild(productCard);
        });
    } else {
        // Handle case where category is not found
        categoryTitle.textContent = 'No Products Found';
        categorySubtitle.textContent = 'Please select a valid category from our homepage.';
    }
}