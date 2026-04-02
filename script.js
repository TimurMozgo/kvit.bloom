/* ФИНАЛЬНЫЙ СКРИПТ: KVIT.BLOOM 
  Исправлено: Сетка, Фильтры, Корзина и защита от ошибок
*/

let totalSum = 0;
const N8N_WEBHOOK_URL = 'https://tiktiok.xyz/webhook/4f86d599-fee4-49a4-8fb6-69fd6738cefe';
const N8N_REDUCE_STOCK_URL = 'https://tiktiok.xyz/webhook/613a3f51-2e98-4f32-81e5-ebadd7f583eb'; 

// 1. ЗАГРУЗКА ДАННЫХ (Luxury Version)
async function loadStore() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.className = 'product-grid';
    // Заменяем скелетон на стильную надпись LOADING в золотом цвете
    container.innerHTML = `
        <div style="grid-column: 1/-1; padding: 100px 20px; text-align: center; color: #CBA35C; text-transform: uppercase; letter-spacing: 5px; font-weight: 300; font-size: 14px;">
            <div class="skeleton" style="height: 2px; width: 50px; margin: 0 auto 20px;"></div>
            Loading Boutique
        </div>`;

    try {
        const response = await fetch(N8N_WEBHOOK_URL);
        const data = await response.json();
        
        window.allProducts = Array.isArray(data) ? data : (data ? [data] : []);

        if (window.allProducts.length > 0) {
            showFiltered(window.allProducts);
        } else {
            // Если товаров нет — пишем это строго и без эмодзи
            container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding:100px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Колекція оновлюється</p>';
        }
    } catch (error) {
        console.error("Помилка мережі:", error);
        container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding:100px; color: #CBA35C; text-transform: uppercase; letter-spacing: 2px;">Тимчасова помилка зв\'язку</p>';
    }
}

// 2. ОТРИСОВКА КАРТОЧЕК
function showFiltered(items) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = ''; 

    items.forEach(item => {
        // Пропускаем пустые строки или неактивные товары
        if (!item['Название']) return;
        if (item['Статус'] && item['Статус'].trim() !== 'Active') return;

        // Чистим данные
        const id = item['ID'] || `id-${Math.random().toString(36).substr(2, 9)}`;
        const title = String(item['Название']).trim();
        const price = parseInt(String(item['Цена']).replace(/\D/g, '')) || 0;
        const img = item['Фото'] || ''; 

        container.innerHTML += `
            <div class="product-card" data-id="${id}">
                <div class="product-image-container">
                    ${img ? `<img src="${img}" class="product-image" alt="${title}" onerror="this.parentElement.innerHTML='🌸';">` : '🌸'}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${title}</h3>
                    <p class="product-price">${price} ₴</p>
                    <button class="buy-btn" onclick="showCounter(this)">Додати</button>
                    <div class="counter-container" style="display: none;">
                        <button class="count-btn" onclick="changeCount(this, -1)">-</button>
                        <span class="count-value">1</span>
                        <button class="count-btn" onclick="changeCount(this, 1)">+</button>
                    </div>
                </div>
            </div>`;
    });
}

// 3. ЛОГИКА СЧЕТЧИКОВ И КНОПОК
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
    
    // Если корзина открыта — обновляем список в ней на лету
    const modal = document.getElementById('cart-modal');
    if (modal && modal.classList.contains('active')) {
        renderCartItems();
    }
}

// 4. ОБНОВЛЕНИЕ ИТОГОВ
function updateTotal() {
    const fab = document.getElementById('cart-fab');
    const fabCount = document.getElementById('fab-count');
    const totalContainer = document.getElementById('cart-total-value');
    
    let tempTotal = 0;
    let totalItemsCount = 0;

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

// 5. КОРЗИНА И МОДАЛКА
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
                <div class="cart-item">
                    <div><b>${title}</b><br><small>${count} шт. x ${price}</small></div>
                    <button onclick="deleteProductById('${id}')" style="color:#ff4d4d; background:none; border:none; cursor:pointer; font-size:1.5em; padding:5px;">✕</button>
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

function closeCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
}

// 6. ОФОРМЛЕНИЕ ЗАКАЗА
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
    
    // Отправляем в n8n (не ждем ответа, чтобы быстрее перекинуть в ТГ)
    fetch(N8N_REDUCE_STOCK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems, customer: name, phone: phone })
    }).catch(e => console.error("Ошибка n8n:", e));

    window.location.href = `https://t.me/tinellton?text=${encodeURIComponent(message)}`;
}

// 7. ФИЛЬТРАЦИЯ (С ИСПРАВЛЕНИЕМ ДЛЯ "ВСЕ")
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

// Закрытие модалки по клику на фон
window.onclick = (event) => {
    const modal = document.getElementById('cart-modal');
    if (event.target === modal) closeCart();
};

// Запуск при загрузке
window.onload = loadStore;