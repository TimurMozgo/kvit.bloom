let totalSum = 0;
// Твой актуальный URL Webhook из n8n
const N8N_WEBHOOK_URL = 'https://tiktiok.xyz/webhook/4f86d599-fee4-49a4-8fb6-69fd6738cefe';

// 1. ЗАГРУЗКА ДАННЫХ
async function loadStore() {
    try {
        const response = await fetch(N8N_WEBHOOK_URL);
        if (!response.ok) throw new Error('Сеть не отвечает');
        
        const data = await response.json();
        
        // n8n может вернуть либо массив объектов, либо один объект
        const items = Array.isArray(data) ? data : (data ? [data] : []);

        if (items.length > 0) {
            renderProducts(items);
        } else {
            console.warn("Таблиця порожня или данные не пришли");
            document.getElementById('products-container').innerHTML = '<p>Товари тимчасово відсутні</p>';
        }
    } catch (error) {
        console.error('Помилка завантаження:', error);
        document.getElementById('products-container').innerHTML = '<p>Помилка зв\'язку з сервером</p>';
    }
}

// 2. ОТРИСОВКА КАРТОЧЕК
function renderProducts(items) {
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = ''; 

    items.forEach(item => {
        // Убедись, что в Google Таблице колонки называются именно так:
        const title = item['Название'] || 'Без назви';
        const price = item['Цена'] || 0;
        const quantity = parseInt(item['Кол-во']) || 0;
        const img = item['Фото'] || ''; 

        const isOutOfStock = quantity <= 0;

        container.innerHTML += `
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}">
                ${img ? `<img src="${img}" class="product-image" alt="${title}">` : ''}
                <div class="product-info">
                    <h3 class="product-title">${title}</h3>
                    <p class="product-price">${price} ₴</p>
                    <button class="buy-btn" onclick="showCounter(this)" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Немає в наявності' : 'Додати в кошик'}
                    </button>
                    <div class="counter-container" style="display: none; align-items: center; justify-content: center; gap: 10px;">
                        <button class="count-btn" onclick="changeCount(this, -1)">-</button>
                        <span class="count-value">1</span>
                        <button class="count-btn" onclick="changeCount(this, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    });
}

// 3. ЛОГИКА КОРЗИНЫ (оставляем твою, она рабочая)
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
        card.querySelector('.buy-btn').style.display = 'block'; // Вернул блоком для верстки
        countDisplay.innerText = 1;
    } else {
        countDisplay.innerText = newCount;
    }
    updateTotal();
    
    if (document.getElementById('cart-modal')?.classList.contains('active')) {
        totalSum > 0 ? openCart() : closeCart();
    }
}

function updateTotal() {
    const fab = document.getElementById('cart-fab');
    let tempTotal = 0;
    let hasItems = false;

    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const priceText = card.querySelector('.product-price').innerText;
            const price = parseInt(priceText.replace(/\D/g, '')) || 0;
            const count = parseInt(card.querySelector('.count-value').innerText) || 0;
            tempTotal += (price * count);
            hasItems = true;
        }
    });

    totalSum = tempTotal;
    if (fab) fab.style.display = hasItems ? 'flex' : 'none';
}

// 4. МОДАЛКА КОРЗИНЫ (твоя база)
function openCart() {
    const modal = document.getElementById('cart-modal');
    const list = document.getElementById('cart-items-list');
    const totalContainer = document.getElementById('cart-total-container');
    
    if (!modal || !list) return;

    list.innerHTML = ''; 
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);

    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const title = card.querySelector('.product-title').innerText;
            const price = card.querySelector('.product-price').innerText;
            const count = card.querySelector('.count-value').innerText;

            list.innerHTML += `
                <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
                    <div>
                        <div style="font-weight:bold;">${title}</div>
                        <div style="font-size:0.9em; color:#666;">${count} шт. x ${price}</div>
                    </div>
                    <button onclick="deleteProduct('${title}')" style="background:none; border:none; color:red; cursor:pointer; font-size:1.2em;">✕</button>
                </div>
            `;
        }
    });

    if (totalContainer) totalContainer.innerHTML = `Разом: ${totalSum} ₴`;
}

function closeCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function deleteProduct(title) {
    document.querySelectorAll('.product-card').forEach(card => {
        if (card.querySelector('.product-title').innerText === title) {
            card.querySelector('.counter-container').style.display = 'none';
            card.querySelector('.buy-btn').style.display = 'block';
            card.querySelector('.count-value').innerText = 1;
        }
    });
    updateTotal();
    totalSum > 0 ? openCart() : closeCart();
}

// 5. ЗАКАЗ В ТЕЛЕГРАМ
function checkout() {
    let message = "🛒 *Нове замовлення:*\n\n";
    let hasItems = false;
    
    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const title = card.querySelector('.product-title').innerText;
            const count = card.querySelector('.count-value').innerText;
            message += `▪️ *${title}*: ${count} шт.\n`;
            hasItems = true;
        }
    });

    if (!hasItems) return;

    message += `\n💰 *Разом: ${totalSum} ₴*`;
    // Твой контакт в телеграм
    window.location.href = `https://t.me/tinellton?text=${encodeURIComponent(message)}`;
}

window.onload = loadStore;