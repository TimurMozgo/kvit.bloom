let totalSum = 0;
const N8N_WEBHOOK_URL = 'https://tiktiok.xyz/webhook/4f86d599-fee4-49a4-8fb6-69fd6738cefe';
const N8N_REDUCE_STOCK_URL = 'https://tiktiok.xyz/webhook/613a3f51-2e98-4f32-81e5-ebadd7f583eb'; 

// 1. ЗАГРУЗКА ДАННЫХ
async function loadStore() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = '<div class="skeleton" style="height: 300px; width: 100%;"></div>';

    try {
        const response = await fetch(N8N_WEBHOOK_URL);
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data ? [data] : []);

        if (items.length > 0) {
            renderProducts(items);
        } else {
            container.innerHTML = '<p style="text-align:center; padding:50px;">Товари тимчасово відсутні 🌸</p>';
        }
    } catch (error) {
        container.innerHTML = '<p style="text-align:center; padding:50px;">Помилка зв\'язку з сервером.</p>';
    }
}

// 2. ОТРИСОВКА КАРТОЧЕК
function renderProducts(items) {
    const container = document.getElementById('products-container');
    if (!container) return;

    container.className = 'product-grid'; 
    container.innerHTML = ''; 

    items.forEach(item => {
        const title = (item['Название'] || 'Без назви').trim(); // Убираем лишние пробелы сразу
        const price = parseInt(item['Цена']) || 0;
        const quantity = parseInt(item['Кол-во']) || 0;
        const status = item['Статус'] || 'Active';
        const img = item['Фото'] || ''; 

        if (quantity <= 0 || status !== 'Active') return;

        container.innerHTML += `
            <div class="product-card" data-title="${title}">
                <div class="product-image-container">
                    ${img ? `<img src="${img}" class="product-image" alt="${title}" onerror="this.src='https://via.placeholder.com/300x300?text=🌸';">` : '🌸'}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${title}</h3>
                    <p class="product-price">${price} ₴</p>
                    <button class="buy-btn" onclick="showCounter(this)">Додати в кошик</button>
                    <div class="counter-container" style="display: none;">
                        <button class="count-btn" onclick="changeCount(this, -1)">-</button>
                        <span class="count-value">1</span>
                        <button class="count-btn" onclick="changeCount(this, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    });
}

// 3. ЛОГИКА СЧЕТЧИКОВ
function showCounter(btn) {
    const card = btn.closest('.product-card');
    const counter = card.querySelector('.counter-container');
    btn.style.display = 'none';
    counter.style.display = 'flex'; 
    updateTotal();
}

function changeCount(btn, delta) {
    const card = btn.closest('.product-card');
    const countDisplay = card.querySelector('.count-value');
    let newCount = (parseInt(countDisplay.innerText) || 0) + delta;

    if (newCount <= 0) {
        card.querySelector('.counter-container').style.display = 'none';
        card.querySelector('.buy-btn').style.display = 'block';
        countDisplay.innerText = 1;
    } else {
        countDisplay.innerText = newCount;
    }
    updateTotal();
    
    // Исправлено: проверка через style.display, чтобы работало надежнее
    const modal = document.getElementById('cart-modal');
    if (modal && (modal.classList.contains('active') || modal.style.display === 'flex')) {
        totalSum > 0 ? renderCartItems() : closeCart();
    }
}

// 4. ОБНОВЛЕНИЕ КРУГА (FAB) И СУММЫ
function updateTotal() {
    const fab = document.getElementById('cart-fab');
    const fabCount = document.getElementById('fab-count');
    let tempTotal = 0;
    let totalItems = 0;

    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const priceText = card.querySelector('.product-price').innerText;
            const price = parseInt(priceText.replace(/\D/g, '')) || 0;
            const count = parseInt(card.querySelector('.count-value').innerText) || 0;
            tempTotal += (price * count);
            totalItems += count;
        }
    });

    totalSum = tempTotal;

    if (fab) {
        fab.style.display = totalItems > 0 ? 'flex' : 'none';
        if (fabCount) fabCount.innerText = totalItems;
    }
}

// 5. МОДАЛКА И КОРЗИНА
function openCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;

    const s1 = document.getElementById('cart-stage-1');
    const s2 = document.getElementById('cart-stage-2');
    
    if(s1) s1.style.display = 'block';
    if(s2) s2.style.display = 'none';
    
    renderCartItems();

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    const totalContainer = document.getElementById('cart-total-value');
    if (!list) return;

    list.innerHTML = ''; 
    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const title = card.querySelector('.product-title').innerText.trim();
            const price = card.querySelector('.product-price').innerText;
            const count = card.querySelector('.count-value').innerText;

            list.innerHTML += `
                <div class="cart-item">
                    <div><b>${title}</b><br><small>${count} шт. x ${price}</small></div>
                    <button onclick="deleteProduct('${title.replace(/'/g, "\\'")}')" style="color:red; background:none; border:none; cursor:pointer; font-size:1.2em;">✕</button>
                </div>
            `;
        }
    });

    if (totalContainer) totalContainer.innerText = `${totalSum} ₴`;
}

function closeCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            const s1 = document.getElementById('cart-stage-1');
            const s2 = document.getElementById('cart-stage-2');
            if(s1) s1.style.display = 'block';
            if(s2) s2.style.display = 'none';
        }, 300);
    }
}

function deleteProduct(title) {
    // Ищем карточку, сравнивая очищенные от пробелов заголовки
    document.querySelectorAll('.product-card').forEach(card => {
        const cardTitle = card.querySelector('.product-title').innerText.trim();
        if (cardTitle === title.trim()) {
            card.querySelector('.counter-container').style.display = 'none';
            card.querySelector('.buy-btn').style.display = 'block';
            card.querySelector('.count-value').innerText = 1;
        }
    });
    updateTotal();
    totalSum > 0 ? renderCartItems() : closeCart();
}

// 6. ОТПРАВКА ДАННЫХ В N8N
async function sendReduceStockRequest(items) {
    try {
        await fetch(N8N_REDUCE_STOCK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: { cart: items } })
        });
    } catch (error) {
        console.error("Ошибка списания:", error);
    }
}

// 7. ЛОГИКА ОФОРМЛЕНИЯ ЗАКАЗА
function goToCheckout() {
    if (totalSum <= 0) {
        alert("Кошик порожній 🌸");
        return;
    }
    const s1 = document.getElementById('cart-stage-1');
    const s2 = document.getElementById('cart-stage-2');
    if(s1) s1.style.display = 'none';
    if(s2) s2.style.display = 'block';
}

function backToCart() {
    const s1 = document.getElementById('cart-stage-1');
    const s2 = document.getElementById('cart-stage-2');
    if(s1) s1.style.display = 'block';
    if(s2) s2.style.display = 'none';
}

async function finalCheckout() {
    const nameEl = document.getElementById('customer-name');
    const phoneEl = document.getElementById('customer-phone');
    const addrEl = document.getElementById('customer-address');

    if (!nameEl || !phoneEl) return;

    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const address = addrEl ? addrEl.value.trim() : "";

    if (!name || !phone) {
        alert("Будь ласка, введіть ім'я та номер телефону 🌸");
        return;
    }

    let message = `👤 *Клієнт:* ${name}\n`;
    message += `📞 *Телефон:* ${phone}\n`;
    if (address) message += `📍 *Адреса:* ${address}\n\n`;
    message += `🛒 *Замовлення:*\n`;

    let cartItemsForN8n = [];
    
    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const title = card.querySelector('.product-title').innerText.trim();
            const count = parseInt(card.querySelector('.count-value').innerText);
            message += `▪️ *${title}*: ${count} шт.\n`;
            cartItemsForN8n.push({ name: title, quantity: count });
        }
    });

    await sendReduceStockRequest(cartItemsForN8n);
    message += `\n💰 *Разом: ${totalSum} ₴*`;
    window.location.href = `https://t.me/tinellton?text=${encodeURIComponent(message)}`;
}

window.onclick = function(event) {
    const modal = document.getElementById('cart-modal');
    if (event.target === modal) closeCart();
}

window.onload = loadStore;