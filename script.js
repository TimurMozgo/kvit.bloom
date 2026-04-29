// 1. Инициализация Telegram
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

let totalSum = 0;

// Конфиг вебхуков

const N8N_WEBHOOK_URL = 'https://tiktiok.xyz/webhook/4f86d599-fee4-49a4-8fb6-69fd6738cefe';
const N8N_REDUCE_STOCK_URL = 'https://tiktiok.xyz/webhook-test/c1a37c52-a21a-4631-a3fa-96ae2e01468b';

// 2 ПОИСК ЦВЕТОВ В ПОИСКОВОЙ ЛЕНТЕ
function handleSearch() {
    const query = document.getElementById('product-search').value.toLowerCase();
    
    // Глобальная переменная allProducts с данными из таблицы
    if (typeof allProducts === 'undefined') return;

    const filtered = allProducts.filter(item => {
        // Проверяем ключи как они идут из таблицы (с большой буквы)
        const name = String(item['Название'] || item['name'] || '').toLowerCase();
        const desc = String(item['Описание'] || '').toLowerCase();
        return name.includes(query) || desc.includes(query);
    });

    showFiltered(filtered);
}

// 3. ЗАГРУЗКА ДАННЫХ
async function loadStore() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.className = 'product-grid';
    container.innerHTML = `<div style="grid-column: 1/-1; padding: 100px 20px; text-align: center; color: #CBA35C;">Loading Boutique...</div>`;

    try {
        const response = await fetch(N8N_WEBHOOK_URL);
        const data = await response.json();
        
        // n8n может отдавать массив напрямую или объект. Приводим к массиву.
        window.allProducts = Array.isArray(data) ? data : (data.products ? data.products : [data]);
        
        if (window.allProducts.length > 0) {
            showFiltered(window.allProducts);
        } else {
            container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #666;">Колекція оновлюється</p>';
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #CBA35C;">Помилка зв\'язку</p>';
    }
}

// 4. ОТРИСОВКА КАРТОЧЕК

function showFiltered(items) {
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = ''; 

    items.forEach(item => {
        // 1. Маппинг названия и статуса
        const title = (item['Название'] || item['name'] || '').toString().trim();
        const status = (item['Статус'] || item['status'] || '').toString().trim();
        
        if (!title || (status !== 'Active')) return;

        // 2. УМНЫЙ ПОДСЧЕТ ОСТАТКА (Stock)
        // Добавил твой вариант 'Кол - во' (с пробелами), который виден на скрине таблицы
        let rawStock = item['Кол - во'] || item['Кол-во'] || item['Количество'] || item['quantity'] || '0';
        
        // Очищаем от лишнего и превращаем в число
        const stock = parseInt(String(rawStock).replace(/\D/g, '')) || 0;

        // 3. Остальные данные
        const id = item['ID'] || item['id'] || `id-${Math.random().toString(36).substr(2, 9)}`;
        const price = parseInt(String(item['Цена'] || item['price'] || '0').replace(/\D/g, '')) || 0;
        const img = item['Фото'] || item['photo'] || '';
        const rawDesc = item['Описание'] || item['description'] || 'Преміальний букет зі свіжих квітів.';
        
        const cleanTitle = title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const cleanDesc = rawDesc.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\r?\n|\r/g, " ");

        container.innerHTML += `
            <div class="product-card" data-id="${id}">
                <div class="product-image-container">
                    ${img ? `<img src="${img}" class="product-image" alt="${cleanTitle}">` : '🌸'}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${title}</h3>
                    <p class="product-price">${price} ₴</p>
                    
                    <button class="details-btn" onclick="openProductDetails('${id}', '${cleanTitle}', '${img}', '${cleanDesc}', ${price})">Докладніше</button>
                    
                    <div class="buy-section" style="margin-top: 10px;">
                        ${stock > 0 ? `
                            <button class="buy-btn" onclick="showCounter(this)">Додати</button>
                            <div class="counter-container" style="display: none; justify-content: center; align-items: center; gap: 8px;">
                                <button class="count-btn" onclick="changeCount(this, -1)">-</button>
                                <span class="count-value">1</span>
                                <button class="count-btn" onclick="changeCount(this, 1)">+</button>
                            </div>
                        ` : `<button class="buy-btn" disabled style="background:#222; color:#555;">Sold Out</button>`}
                    </div>
                </div>
            </div>`;
    });
}

// 5. МОДАЛКА ПОДРОБНОСТЕЙ
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

function closeDetails() {
    const modal = document.getElementById('details-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
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

// 6. ЛОГИКА СЧЕТЧИКОВ
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
    if (document.getElementById('cart-modal')?.style.display === 'flex') {
        renderCartItems();
    }
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

// 7. КОРЗИНА
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

// НОВАЯ ФУНКЦИЯ: Рендер товаров с кнопками +/- и красивым ID
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
                <div class="cart-item-row" id="cart-item-render-${id}">
                    <div class="cart-item-info">
                        <img src="${img}" class="cart-item-mini-img" onerror="this.src='🌸'">
                        <div class="cart-item-text">
                            <span class="cart-item-title">${title}</span>
                            <div class="cart-item-controls">
                                <button class="qty-btn" onclick="changeQtyInCart('${id}', -1)">-</button>
                                <span class="qty-value">${count} шт.</span>
                                <button class="qty-btn" onclick="changeQtyInCart('${id}', 1)">+</button>
                                <span class="cart-item-price">x ${price}</span>
                            </div>
                        </div>
                    </div>
                    <button class="remove-item-btn" onclick="animateRemove('${id}')">✕</button>
                </div>`;
        }
    });
    if (!hasItems) closeCart();
}

// НОВАЯ ФУНКЦИЯ: Управление из корзины
function changeQtyInCart(id, delta) {
    const card = document.querySelector(`.product-card[data-id="${id}"]`);
    if (card) {
        const btn = delta > 0 ? card.querySelector('.count-btn:last-child') : card.querySelector('.count-btn:first-child');
        changeCount(btn, delta);
    }
}

// НОВАЯ ФУНКЦИЯ: Плавное исчезновение (800мс)

function animateRemove(id) {
    const element = document.getElementById(`cart-item-render-${id}`);
    if (element) {
        element.classList.add('cart-item-fade-out'); 
        
        // Ждем чуть меньше, чтобы верстка не дергалась
        setTimeout(() => {
            deleteProductById(id);
        }, 550); // чуть быстрее, чем сама анимация в CSS
    }
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

// 8. ОФОРМЛЕНИЕ ЗАКАЗА

// 8. ОФОРМЛЕНИЕ ЗАКАЗА
function goToCheckout() {
    if (totalSum <= 0) return;
    document.getElementById('cart-stage-1').style.display = 'none';
    document.getElementById('cart-stage-2').style.display = 'block';
}

function backToCart() {
    document.getElementById('cart-stage-2').style.display = 'none';
    document.getElementById('cart-stage-1').style.display = 'block';
}

function showSuccessOrder() {
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

    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:999999; display:flex; align-items:center; justify-content:center;';
    overlay.innerHTML = `
    <div style="background:#111; padding:40px 20px; border-radius:20px; border:1px solid #CBA35C; text-align:center; max-width: 300px; width: 90%;">
        <div style="font-size:50px; margin-bottom:20px;">✨</div>
        <h2 style="color:#CBA35C; font-size:22px; margin-bottom:10px; text-transform:uppercase;">Дякуємо за вибір!</h2>
        <p style="color:#888; margin-bottom:25px; line-height:1.5;">Ваше замовлення прийнято.<br>Флорист вже почав створювати ваш ідеальный букет. 🌸</p>
        <button onclick="location.reload()" style="background:#CBA35C; color:#000; border:none; padding:12px 30px; border-radius:10px; font-weight:bold; width:100%; cursor:pointer;">Зрозуміло</button>
    </div>`;
}

async function finalCheckout() {
    const nameInput = document.getElementById('customer-name').value.trim();
    const phoneInput = document.getElementById('customer-phone').value.trim();
    
    // Твой актуальный вебхук
    const ADMIN_WEBHOOK = 'https://tiktiok.xyz/webhook/4da37afc-37ca-4ea3-9fe0-ffb287465212';

    if (!nameInput || !phoneInput) {
        alert("Будь ласка, введіть ім'я та номер телефону 🌸");
        return;
    }

    const orderItems = [];
    let calculatedTotal = 0; // Переменная для честной математики

    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const title = card.querySelector('.product-title').innerText.trim();
            const count = parseInt(card.querySelector('.count-value').innerText) || 0;
            
            // Вытаскиваем только цифры из цены (убираем "₴" и пробелы)
            const priceText = card.querySelector('.product-price').innerText;
            const pricePerUnit = parseInt(priceText.replace(/\D/g, '')) || 0;

            if (count > 0) {
                const subtotal = pricePerUnit * count;
                calculatedTotal += subtotal; // Плюсуем к итогу

                orderItems.push({
                    id: card.getAttribute('data-id'),
                    name: title,
                    count: count,
                    price_unit: pricePerUnit,
                    subtotal: subtotal
                });
            }
        }
    });

    const orderData = {
        customer_name: nameInput,
        customer_phone: phoneInput,
        order_list: orderItems.map(i => `${i.name} (${i.count} шт)`).join(', '),
        details: orderItems,
        total_sum: calculatedTotal + " ₴", // Отправляем ПРАВИЛЬНУЮ сумму
        tg_user_id: tg.initDataUnsafe?.user?.id || 'unknown',
        tg_username: tg.initDataUnsafe?.user?.username || 'none',
        timestamp: new Date().toLocaleString('uk-UA')
    };

    // Показываем успех
    showSuccessOrder(); 

    // Отправляем Аудитору
    try {
        await fetch(ADMIN_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        console.log('Order sent successfully with total:', calculatedTotal);
    } catch (e) {
        console.error('Failed to send order', e);
    }
}

// 9. АНИМАЦИЯ ПОЯВЛЕНИЯ И УДАЛЕНИЯ ПУЛЬСИРОВАННОЙ КНОПКИ (ЧАТ)
function startChatPulse() {
    const fab = document.querySelector('.floric-fab');
    const menu = document.querySelector('.contact-menu');
    if (!fab) return;

    function toggleFab() {
        // 1. Показываем кнопку
        fab.classList.add('visible');

        // 2. Через 20 секунд прячем обратно
        setTimeout(() => {
            fab.classList.remove('visible');
            // Если меню было открыто — закрываем его при исчезновении кнопки
            if (menu) menu.style.display = 'none'; 
        }, 20000); // 20 сек (можешь поставить 30000 для 30 сек)
    }

    // Запускаем первый раз сразу
    toggleFab();

    // Ставим интервал на 1 минуту (60000 мс)
    setInterval(toggleFab, 60000);
}

// Запускаем функцию
document.addEventListener('DOMContentLoaded', startChatPulse);

// 10. ВСПОМОГАТЕЛЬНОЕ
function toggleWishlist(productId, btnElement) {
    let favorites = JSON.parse(localStorage.getItem('wishlist')) || [];
    if (favorites.includes(productId)) {
        favorites = favorites.filter(id => id !== productId);
        btnElement.classList.remove('active');
    } else {
        favorites.push(productId);
        btnElement.classList.add('active');
        if (window.navigator.vibrate) window.navigator.vibrate(20);
    }
    localStorage.setItem('wishlist', JSON.stringify(favorites));
}

function toggleContactMenu() {
    const menu = document.getElementById('contact-menu');
    menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
}

window.addEventListener('click', function(e) {
    const menu = document.getElementById('contact-menu');
    const fab = document.querySelector('.floric-fab');
    if (menu && !menu.contains(e.target) && fab && !fab.contains(e.target)) {
        menu.style.display = 'none';
    }
    if (e.target.id === 'cart-modal' || e.target.id === 'details-modal') {
        closeCart();
        closeDetails();
    }
});

window.onload = loadStore;