/* ФИНАЛЬНЫЙ СКРИПТ: KVIT.BLOOM 
   Luxury Edition: Сетка, Фильтры, Корзина, Остатки и Подробности
*/

let totalSum = 0;
const N8N_WEBHOOK_URL = 'https://tiktiok.xyz/webhook/4f86d599-fee4-49a4-8fb6-69fd6738cefe';
const N8N_REDUCE_STOCK_URL = 'https://tiktiok.xyz/webhook/613a3f51-2e98-4f32-81e5-ebadd7f583eb'; 

// 1. ЗАГРУЗКА ДАННЫХ
async function loadStore() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.className = 'product-grid';
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
        if (!item['Название']) return;
        if (item['Статус'] && item['Статус'].trim() !== 'Active') return;

        const id = item['ID'] || `id-${Math.random().toString(36).substr(2, 9)}`;
        const title = String(item['Название']).trim();
        const price = parseInt(String(item['Цена']).replace(/\D/g, '')) || 0;
        const img = item['Фото'] || '';
        const rawDesc = item['Описание'] || 'Преміальний букет зі свіжих квітів.';

        // Экранируем всё, что может сломать кнопку (особенно для Нежности)
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
                    
                    <button class="details-btn" onclick="openProductDetails('${cleanTitle}', '${img}', '${cleanDesc}', ${price})">Докладніше</button>
                    
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

// И обнови саму функцию открытия, чтобы картинка была в обертке
function openProductDetails(title, img, desc, price) {
    let modal = document.getElementById('details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'details-modal';
        modal.className = 'cart-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="cart-container">
            <button class="close-details" onclick="closeDetails()">✕</button>
            <div class="details-img-wrapper">
                <img src="${img}">
            </div>
            <h2 style="color:#CBA35C; font-size:18px; text-transform:uppercase;">${title}</h2>
            <p style="color:#AAA; font-size:14px; line-height:1.6;">${desc}</p>
            <div class="details-footer">
                <span style="font-size:22px; color:#CBA35C; font-weight:700;">${price} ₴</span>
                <button class="checkout-btn" style="width:auto; margin:0; padding:10px 20px;" onclick="closeDetails()">Закрити</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeDetails() {
    const modal = document.getElementById('details-modal');
    if(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

// 3. МОДАЛКА ПОДРОБНОСТЕЙ
function openProductDetails(title, img, desc, price) {
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
            <div class="product-image-container" style="aspect-ratio: 1/1; margin-bottom: 20px;">
                <img src="${img}" class="product-image" style="border-radius: 8px;">
            </div>
            <h2 style="color:#CBA35C; text-transform: uppercase; letter-spacing: 2px; font-size: 20px;">${title}</h2>
            <p style="color:#888; line-height: 1.6; font-size: 14px; margin: 15px 0;">${desc}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:30px; border-top: 1px solid #222; padding-top: 20px;">
                <span style="font-size:24px; color:#CBA35C; font-weight:700;">${price} ₴</span>
                <button class="checkout-btn" style="width:auto; padding: 12px 30px; margin:0;" onclick="closeDetails()">Закрити</button>
            </div>
        </div>
    `;

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
    const modal = document.getElementById('cart-modal');
    if (modal && modal.classList.contains('active')) renderCartItems();
}

// 5. ОБНОВЛЕНИЕ ИТОГОВ
function updateTotal() {
    const fab = document.getElementById('cart-fab');
    const fabCount = document.getElementById('fab-count');
    const totalContainer = document.getElementById('cart-total-value');
    
    let tempTotal = 0;
    let totalItemsCount = 0;

    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const priceText = card.querySelector('.product-price').innerText;
            const price = parseInt(priceText.replace(/\D/g, '')) || 0;
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

// 6. КОРЗИНА
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
                    <button onclick="deleteProductById('${id}')" style="color:#CBA35C; background:none; border:none; cursor:pointer; font-size:1.5em;">✕</button>
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

// 7. ЗАКАЗ
function goToCheckout() {
    if (totalSum <= 0) return;
    document.getElementById('cart-stage-1').style.display = 'none';
    document.getElementById('cart-stage-2').style.display = 'block';
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
    
    fetch(N8N_REDUCE_STOCK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems, customer: name, phone: phone })
    }).catch(e => console.error("Ошибка n8n:", e));

    window.location.href = `https://t.me/tinellton?text=${encodeURIComponent(message)}`;
}

// 8. ФИЛЬТРЫ
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
    if (event.target.id === 'cart-modal' || event.target.id === 'details-modal') {
        closeCart();
        closeDetails();
    }
};

window.onload = loadStore;