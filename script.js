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

    window.allProducts = items; 
    container.className = 'product-grid'; 
    showFiltered(items);
}

function showFiltered(items) {
    const container = document.getElementById('products-container');
    container.innerHTML = ''; 

    items.forEach(item => {
        const id = item['ID'] || Math.random(); // Используем ID из таблицы
        const title = (item['Название'] || 'Без назви').trim();
        const price = parseInt(item['Цена']) || 0;
        const quantity = parseInt(item['Кол-во']) || 0;
        const status = item['Статус'] || 'Active';
        const img = item['Фото'] || ''; 

        if (quantity <= 0 || status !== 'Active') return;

        container.innerHTML += `
            <div class="product-card" data-id="${id}">
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
    
    // Обновляем список в корзине только если модалка открыта
    const modal = document.getElementById('cart-modal');
    if (modal && modal.classList.contains('active')) {
        renderCartItems();
    }
}

// 4. ОБНОВЛЕНИЕ СУММЫ (БЕЗ ПЕРЕРИСОВКИ ВСЕГО)
function updateTotal() {
    const fab = document.getElementById('cart-fab');
    const fabCount = document.getElementById('fab-count');
    const totalContainer = document.getElementById('cart-total-value');
    
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
    
    if (totalContainer) {
        totalContainer.innerText = `${totalSum} ₴`;
    }
}

// 5. МОДАЛКА И КОРЗИНА
function openCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;

    document.getElementById('cart-stage-1').style.display = 'block';
    document.getElementById('cart-stage-2').style.display = 'none';
    
    renderCartItems();

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
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
            hasItems = true;

            list.innerHTML += `
                <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;">
                    <div><b>${title}</b><br><small>${count} шт. x ${price}</small></div>
                    <button onclick="deleteProductById('${id}')" style="color:#ff4d4d; background:none; border:none; cursor:pointer; font-size:1.5em; padding:5px;">✕</button>
                </div>
            `;
        }
    });

    if (!hasItems) closeCart();
}

function closeCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
}

// Удаление по ID — теперь работает железно
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

// 6. ОТПРАВКА ДАННЫХ В N8N
async function sendReduceStockRequest(items) {
    try {
        await fetch(N8N_REDUCE_STOCK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart: items }) // Упростил структуру для n8n
        });
    } catch (error) {
        console.error("Ошибка списания:", error);
    }
}

// 7. ЛОГИКА ОФОРМЛЕНИЯ ЗАКАЗА
function goToCheckout() {
    if (totalSum <= 0) return;
    document.getElementById('cart-stage-1').style.display = 'none';
    document.getElementById('cart-stage-2').style.display = 'block';
}

function backToCart() {
    document.getElementById('cart-stage-1').style.display = 'block';
    document.getElementById('cart-stage-2').style.display = 'none';
}

async function finalCheckout() {
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address')?.value.trim() || "";

    if (!name || !phone) {
        alert("Будь ласка, введіть ім'я та номер телефону 🌸");
        return;
    }

    let message = `👤 *Клієнт:* ${name}\n📞 *Телефон:* ${phone}\n`;
    if (address) message += `📍 *Адреса:* ${address}\n`;
    message += `\n🛒 *Замовлення:*\n`;

    let cartItems = [];
    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const title = card.querySelector('.product-title').innerText.trim();
            const count = parseInt(card.querySelector('.count-value').innerText);
            message += `▪️ *${title}*: ${count} шт.\n`;
            cartItems.push({ name: title, quantity: count, id: card.getAttribute('data-id') });
        }
    });

    message += `\n💰 *Разом: ${totalSum} ₴*`;
    
    await sendReduceStockRequest(cartItems);
    window.location.href = `https://t.me/tinellton?text=${encodeURIComponent(message)}`;
}

// 8. ФИЛЬТРАЦИЯ
function filterProducts(category, btn) {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const titleEl = document.getElementById('current-category-title');
    if (titleEl) titleEl.innerText = category === 'Все' ? 'Всі товари' : category;

    if (!window.allProducts) return;

    if (category === 'Все') {
        showFiltered(window.allProducts);
    } else {
        const filtered = window.allProducts.filter(item => 
            (item['Категория'] || '').trim().toLowerCase() === category.toLowerCase()
        );
        showFiltered(filtered);
    }
}

window.onclick = (event) => {
    if (event.target === document.getElementById('cart-modal')) closeCart();
};

window.onload = loadStore;