let totalSum = 0;
// Твой URL Webhook из n8n (Production!)
const N8N_WEBHOOK_URL = 'https://tiktiok.xyz/webhook/4f86d599-fee4-49a4-8fb6-69fd6738cefe';

// 1. ЗАГРУЗКА ДАННЫХ
async function loadStore() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = '<div class="skeleton" style="height: 300px; width: 100%;"></div>'; // Skeleton loader

    try {
        const response = await fetch(N8N_WEBHOOK_URL);
        if (!response.ok) throw new Error('Сеть не отвечает');
        
        const data = await response.json();
        
        // n8n может вернуть массив или объект
        const items = Array.isArray(data) ? data : (data ? [data] : []);

        if (items.length > 0) {
            renderProducts(items);
        } else {
            container.innerHTML = '<p style="text-align:center; padding:50px;">Товари тимчасово відсутні 🌸</p>';
        }
    } catch (error) {
        console.error('Помилка завантаження:', error);
        container.innerHTML = '<p style="text-align:center; color:red; padding:50px;">Помилка зв\'язку з сервером. Спробуйте оновити сторінку.</p>';
    }
}

// 2. ОТРИСОВКА КАРТОЧЕК
// 2. ОТРИСОВКА КАРТОЧЕК
function renderProducts(items) {
    const container = document.getElementById('products-container');
    if (!container) return;

    // Принудительно ставим класс сетки для 4 колонок на ПК
    container.className = 'product-grid'; 
    container.innerHTML = ''; 

    items.forEach(item => {
        const title = item['Название'] || 'Без назви';
        const price = parseInt(item['Цена']) || 0;
        const quantity = parseInt(item['Кол-во']) || 0;
        const img = item['Фото'] || ''; 

        // Если товара 0 или меньше — ВООБЩЕ не рисуем его (скрываем)
        if (quantity <= 0) return;

        container.innerHTML += `
            <div class="product-card">
                <div class="product-image-container">
                    ${img ? 
                        `<img src="${img}" class="product-image" alt="${title}" onerror="this.src='https://via.placeholder.com/300x300?text=KVIT.BLOOM';">` : 
                        '<div class="product-image" style="background:#f9f9f9; display:flex; align-items:center; justify-content:center; height:100%;">🌸</div>'
                    }
                </div>
                <div class="product-info">
                    <h3 class="product-title">${title}</h3>
                    <p class="product-price">${price} ₴</p>
                    <button class="buy-btn" onclick="showCounter(this)">
                        Додати в кошик
                    </button>
                    <div class="counter-container" style="display: none;">
                        <button class="count-btn" onclick="changeCount(this, -1)">-</button>
                        <span class="count-value">1</span>
                        <button class="count-btn" onclick="changeCount(this, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    });

    // Если после фильтрации (скрытия нулей) товаров не осталось
    if (container.innerHTML === '') {
        container.innerHTML = '<p style="text-align:center; width:100%; padding:50px;">На жаль, всі товари розпродані 🌸</p>';
    }
}

// 3. ЛОГИКА КОРЗИНЫ
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
    
    // Если корзина открыта - обновляем её содержимое
    if (document.getElementById('cart-modal')?.classList.contains('active')) {
        totalSum > 0 ? openCart() : closeCart();
    }
}

function updateTotal() {
    const fab = document.getElementById('cart-fab');
    let tempTotal = 0;
    let countItems = 0;

    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const price = parseInt(card.querySelector('.product-price').innerText.replace(/\D/g, '')) || 0;
            const count = parseInt(card.querySelector('.count-value').innerText) || 0;
            tempTotal += (price * count);
            countItems += count;
        }
    });

    totalSum = tempTotal;
    if (fab) {
        fab.style.display = countItems > 0 ? 'flex' : 'none';
        fab.innerText = countItems > 0 ? `🛒 ${countItems}` : '';
    }
}

// 4. МОДАЛКА КОРЗИНЫ
function openCart() {
    const modal = document.getElementById('cart-modal');
    const list = document.getElementById('cart-items-list');
    const totalContainer = document.getElementById('cart-total-value');
    
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
                <div class="cart-item">
                    <div>
                        <div style="font-weight:bold;">${title}</div>
                        <div style="font-size:0.9em; color:#666;">${count} шт. x ${price}</div>
                    </div>
                    <button onclick="deleteProduct('${title}')" style="background:none; border:none; color:red; cursor:pointer; font-size:1.2em;">✕</button>
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
    window.location.href = `https://t.me/tinellton?text=${encodeURIComponent(message)}`;
}

window.onload = loadStore;