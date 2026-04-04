// Инициализация Telegram
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

let totalSum = 0;

// --- КОНФИГУРАЦИЯ URL (КЛЮЧИ)
const N8N_WEBHOOK_URL = 'https://tiktiok.xyz/webhook/4f86d599-fee4-49a4-8fb6-69fd6738cefe';
const N8N_REDUCE_STOCK_URL = 'https://tiktiok.xyz/webhook/c1a37c52-a21a-4631-a3fa-96ae2e01468b';
const N8N_REDUCE_STOCK_URL_PROD = 'https://tiktiok.xyz/webhook/4da37afc-37ca-4ea3-9fe0-ffb287465212';

// 1. ЗАГРУЗКА ДАННЫХ
async function loadStore() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.className = 'product-grid';
    container.innerHTML = `<div style="grid-column: 1/-1; padding: 100px 20px; text-align: center; color: #CBA35C;">Loading Boutique...</div>`;

    try {
        const response = await fetch(N8N_WEBHOOK_URL);
        const data = await response.json();
        window.allProducts = Array.isArray(data) ? data : (data ? [data] : []);
        if (window.allProducts.length > 0) {
            showFiltered(window.allProducts);
        } else {
            container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #666;">Колекція оновлюється</p>';
        }
    } catch (error) {
        container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #CBA35C;">Помилка зв\'язку</p>';
    }
}

// 2. ОТРИСОВКА КАРТОЧЕК
function showFiltered(items) {
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = ''; 

    items.forEach(item => {
        if (!item['Название'] || (item['Статус'] && item['Статус'].trim() !== 'Active')) return;

        const id = item['ID'] || `id-${Math.random().toString(36).substr(2, 9)}`;
        const title = String(item['Название']).trim();
        const price = parseInt(String(item['Цена']).replace(/\D/g, '')) || 0;
        const img = item['Фото'] || '';
        const rawDesc = item['Описание'] || 'Преміальний букет зі свіжих квітів.';
        const stock = parseInt(item['Кол-во']) || 0;
        const stockLabel = stock > 0 ? `Залишилось: ${stock} шт.` : `<span style="color:#ff4d4d;">Немає в наявності</span>`;

        const cleanTitle = title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const cleanDesc = rawDesc.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\r?\n|\r/g, " ");

        container.innerHTML += `
            <div class="product-card" data-id="${id}">
                <div class="product-image-container">
                    ${img ? `<img src="${img}" class="product-image" alt="${cleanTitle}" onerror="this.parentElement.innerHTML='🌸';">` : '🌸'}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${title}</h3>
                    <p class="product-price">${price} ₴</p>
                    <p style="font-size: 12px; color: #888; margin-bottom: 10px;">${stockLabel}</p>
                    <button class="details-btn" onclick="openProductDetails('${id}', '${cleanTitle}', '${img}', '${cleanDesc}', ${price})">Докладніше</button>
                    ${stock > 0 ? `
                        <button class="buy-btn" onclick="showCounter(this)">Додати</button>
                        <div class="counter-container" style="display: none;">
                            <button class="count-btn" onclick="changeCount(this, -1)">-</button>
                            <span class="count-value">1</span>
                            <button class="count-btn" onclick="changeCount(this, 1)">+</button>
                        </div>
                    ` : `<button class="buy-btn" disabled style="background:#222; color:#555;">Sold Out</button>`}
                </div>
            </div>`;
    });
}

// 3. МОДАЛКА ПОДРОБНОСТЕЙ
function openProductDetails(id, title, img, desc, price) {
    let detailsModal = document.getElementById('details-modal');
    if (!detailsModal) {
        detailsModal = document.createElement('div');
        detailsModal.id = 'details-modal';
        detailsModal.className = 'cart-overlay';
        document.body.appendChild(detailsModal);
    }
    detailsModal.innerHTML = `
        <div class="cart-container details-container">
            <button class="close-details" onclick="closeDetails()">✕</button>
            <div class="details-img-wrapper"><img src="${img}" class="product-image"></div>
            <h2 style="color:#CBA35C; text-transform: uppercase; font-size: 20px;">${title}</h2>
            <p style="color:#888; font-size: 14px; margin: 15px 0;">${desc}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; border-top: 1px solid #222; padding-top: 20px;">
                <span style="font-size:24px; color:#CBA35C; font-weight:700;">${price} ₴</span>
                <button class="checkout-btn" style="width:auto; padding: 12px 30px; margin:0;" onclick="addToCartFromDetails('${id}');">Додати</button>
            </div>
        </div>`;
    detailsModal.style.display = 'flex';
    setTimeout(() => detailsModal.classList.add('active'), 10);
}

function addToCartFromDetails(id) {
    const card = document.querySelector(`.product-card[data-id="${id}"]`);
    if (card) {
        const buyBtn = card.querySelector('.buy-btn');
        if (buyBtn && buyBtn.style.display !== 'none') {
            showCounter(buyBtn);
        } else {
            const plusBtn = card.querySelector('.count-btn:last-child');
            if (plusBtn) changeCount(plusBtn, 1);
        }
        closeDetails();
    }
}

function closeDetails() {
    const modal = document.getElementById('details-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

// 4. ЛОГИКА СЧЕТЧИКОВ
function showCounter(btn) {
    const card = btn.closest('.product-card');
    const counter = card.querySelector('.counter-container');
    btn.style.display = 'none';
    counter.style.display = 'flex'; 
    card.querySelector('.count-value').innerText = 1;
    updateTotal();
}

function changeCount(btn, delta) {
    const card = btn.closest('.product-card');
    const countDisplay = card.querySelector('.count-value');
    let currentCount = parseInt(countDisplay.innerText) || 1;
    let newCount = currentCount + delta;
    if (newCount <= 0) {
        card.querySelector('.counter-container').style.display = 'none';
        card.querySelector('.buy-btn').style.display = 'block';
        countDisplay.innerText = 1;
    } else {
        countDisplay.innerText = newCount;
    }
    updateTotal();
    renderCartItems();
}

function updateTotal() {
    const fab = document.getElementById('cart-fab');
    const fabCount = document.getElementById('fab-count');
    const totalContainer = document.getElementById('cart-total-value');
    let tempTotal = 0, totalItemsCount = 0;
    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const price = parseInt(card.querySelector('.product-price').innerText.replace(/\D/g, '')) || 0;
            const count = parseInt(card.querySelector('.count-value').innerText) || 0;
            tempTotal += (price * count);
            totalItemsCount += count;
        }
    });
    totalSum = tempTotal;
    if (fab) {
        fab.style.display = totalItemsCount > 0 ? 'flex' : 'none';
        if (fabCount) fabCount.innerText = totalItemsCount;
    }
    if (totalContainer) totalContainer.innerText = `${totalSum} ₴`;
}

// 5. КОРЗИНА
function openCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    document.getElementById('cart-stage-1').style.display = 'block';
    document.getElementById('cart-stage-2').style.display = 'none';
    renderCartItems();
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function goToCheckout() {
    if (totalSum <= 0) return;
    document.getElementById('cart-stage-1').style.display = 'none';
    document.getElementById('cart-stage-2').style.display = 'block';
}

function backToCart() {
    document.getElementById('cart-stage-2').style.display = 'none';
    document.getElementById('cart-stage-1').style.display = 'block';
}

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    if (!list) return;
    list.innerHTML = ''; 
    let hasItems = false;
    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const id = card.getAttribute('data-id');
            const title = card.querySelector('.product-title').innerText.trim();
            const price = card.querySelector('.product-price').innerText;
            const count = card.querySelector('.count-value').innerText;
            const img = card.querySelector('.product-image')?.src || '';
            hasItems = true;
            list.innerHTML += `
                <div class="cart-item-row">
                    <div class="cart-item-info">
                        <img src="${img}" class="cart-item-mini-img" onerror="this.src='🌸'">
                        <div class="cart-item-text">
                            <span class="cart-item-title">${title}</span>
                            <span class="cart-item-details">${count} шт. x ${price}</span>
                        </div>
                    </div>
                    <button class="remove-item-btn" onclick="deleteProductById('${id}')">✕</button>
                </div>`;
        }
    });
    if (!hasItems) closeCart();
}

function deleteProductById(id) {
    const card = document.querySelector(`.product-card[data-id="${id}"]`);
    if (card) {
        card.querySelector('.counter-container').style.display = 'none';
        card.querySelector('.buy-btn').style.display = 'block';
        card.querySelector('.count-value').innerText = 1;
    }
    updateTotal();
    renderCartItems();
}

// 6. ФУНКЦИЯ ПЛАШКИ УСПЕХА 
function showSuccessOrder() {
    // Жестко вырубаем корзину без анимаций, чтобы она не перекрывала экран
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.style.display = 'none'; 
        cartModal.classList.remove('active');
    }

    let overlay = document.getElementById('success-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'success-overlay';
        document.body.appendChild(overlay);
    }

    // Вливаем стили напрямую через JS (z-index: 999999), чтобы пробить любые слои!
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
    overlay.style.zIndex = '999999'; 
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    // Внутрянка твоей плашки со встроенными стилями
    overlay.innerHTML = `
    <div style="background:#111; padding:40px 20px; border-radius:20px; border:1px solid #CBA35C; text-align:center; max-width: 300px; width: 90%;">
        <div style="font-size:50px; margin-bottom:20px;">✨</div>
        <h2 style="color:#CBA35C; font-size:22px; margin-bottom:10px; text-transform:uppercase;">Дякуємо за вибір!</h2>
        <p style="color:#888; margin-bottom:25px; line-height:1.5;">
            Ваше замовлення прийнято.<br>
            Флорист вже почав створювати ваш ідеальний букет. 🌸
        </p>
        <button onclick="location.reload()" style="background:#CBA35C; color:#000; border:none; padding:12px 30px; border-radius:10px; font-weight:bold; width:100%; cursor:pointer;">Зрозуміло</button>
    </div>`;
}

// --- 7. ФИНАЛЬНЫЙ ЗАКАЗ ---
async function finalCheckout() {
    const nameInput = document.getElementById('customer-name').value.trim();
    const phoneInput = document.getElementById('customer-phone').value.trim();

    if (!nameInput || !phoneInput) {
        alert("Будь ласка, введіть ім'я та номер телефону 🌸");
        return;
    }

    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user || {};
    
    const tgId = user.id || 'Не указан';
    const tgUsername = user.username ? `@${user.username}` : 'Нет юзернейма';
    const tgFullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Скрыто';

    let cartItems = [];
    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const title = card.querySelector('.product-title').innerText.trim();
            const count = parseInt(card.querySelector('.count-value').innerText);
            cartItems.push({ name: title, quantity: count });
        }
    });

    const orderData = {
        customer_name: nameInput,
        customer_phone: phoneInput,
        tg_id: tgId,
        tg_username: tgUsername,
        tg_display_name: tgFullName,
        order_list: cartItems.map(i => `${i.name} (${i.quantity} шт)`).join(', '),
        items: cartItems, 
        total_sum: totalSum + " ₴",
        timestamp: new Date().toLocaleString('uk-UA')
    };

    // СНАЧАЛА ЖЕСТКО ВЫЗЫВАЕМ ПЛАШКУ (чтобы клиент сразу её увидел)
    showSuccessOrder();

    // ЗАТЕМ ФОНОМ СТРЕЛЯЕМ ДАННЫМИ (без зависаний браузера)
    fetch(N8N_REDUCE_STOCK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    }).catch(e => console.log("Аудитор в деле"));

    fetch(N8N_REDUCE_STOCK_URL_PROD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    }).catch(e => console.log("Админ в деле"));
}

// 8. ФИЛЬТРЫ И ИНИЦИАЛИЗАЦИЯ
function filterProducts(category, btn) {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const titleEl = document.getElementById('current-category-title');
    if (titleEl) titleEl.innerText = category === 'Все' ? 'Всі товари' : category;
    if (!window.allProducts) return;
    const filtered = category === 'Все' ? window.allProducts : window.allProducts.filter(item => (item['Категория'] || '').trim().toLowerCase() === category.toLowerCase());
    showFiltered(filtered);
}

window.onclick = (event) => {
    if (event.target.id === 'cart-modal' || event.target.id === 'details-modal') {
        closeCart();
        closeDetails();
    }
};

window.onload = loadStore;