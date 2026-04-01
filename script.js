let totalSum = 0;
const N8N_WEBHOOK_URL = 'https://tiktiok.xyz/webhook/4f86d599-fee4-49a4-8fb6-69fd6738cefe';
const N8N_REDUCE_STOCK_URL = 'https://tiktiok.xyz/webhook/613a3f51-2e98-4f32-81e5-ebadd7f583eb'; 

async function loadStore() {
    const container = document.getElementById('products-container');
    if (!container) return;
    try {
        const response = await fetch(N8N_WEBHOOK_URL);
        const data = await response.json();
        renderProducts(Array.isArray(data) ? data : [data]);
    } catch (e) { console.error(e); }
}

function renderProducts(items) {
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = ''; 
    items.forEach(item => {
        const title = item['Название'] || 'Без назви';
        const price = parseInt(item['Цена']) || 0;
        const quantity = parseInt(item['Кол-во']) || 0;
        const status = item['Статус'] || 'Active';
        const img = item['Фото'] || ''; 
        if (quantity <= 0 || status !== 'Active') return;
        container.innerHTML += `
            <div class="product-card" data-title="${title}">
                <img src="${img}" class="product-image">
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

function showCounter(btn) {
    btn.style.display = 'none';
    btn.nextElementSibling.style.display = 'flex';
    updateTotal();
}

function changeCount(btn, delta) {
    const val = btn.parentElement.querySelector('.count-value');
    let count = parseInt(val.innerText) + delta;
    if (count <= 0) {
        btn.parentElement.style.display = 'none';
        btn.parentElement.previousElementSibling.style.display = 'block';
        val.innerText = 1;
    } else { val.innerText = count; }
    updateTotal();
    
    // Проверка: если корзина открыта, обновляем её содержимое
    const modal = document.getElementById('cart-modal');
    if (modal && modal.style.display === 'flex') renderCartItems();
}

function updateTotal() {
    let tempTotal = 0;
    let itemsCount = 0;
    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const price = parseInt(card.querySelector('.product-price').innerText) || 0;
            const count = parseInt(card.querySelector('.count-value').innerText) || 0;
            tempTotal += (price * count);
            itemsCount += count;
        }
    });
    totalSum = tempTotal;
    const fab = document.getElementById('cart-fab');
    if (fab) {
        fab.style.display = itemsCount > 0 ? 'flex' : 'none';
        const fabCount = document.getElementById('fab-count');
        if (fabCount) fabCount.innerText = itemsCount;
    }
}

// КОРЗИНА И УДАЛЕНИЕ
function openCart() {
    const modal = document.getElementById('cart-modal');
    const stage1 = document.getElementById('cart-stage-1');
    const stage2 = document.getElementById('cart-stage-2');
    
    if (!modal || !stage1 || !stage2) return;

    stage1.style.display = 'block';
    stage2.style.display = 'none';
    
    renderCartItems();
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    const totalVal = document.getElementById('cart-total-value');
    if (!list) return;

    list.innerHTML = '';
    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const title = card.querySelector('.product-title').innerText;
            const count = card.querySelector('.count-value').innerText;
            const price = card.querySelector('.product-price').innerText;
            list.innerHTML += `
                <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding: 5px; border-bottom: 1px solid #eee;">
                    <div><b>${title}</b><br><small>${count} шт. x ${price}</small></div>
                    <button onclick="deleteProduct('${title}')" style="color:red; background:none; border:none; font-size:20px; cursor:pointer; padding: 5px;">✕</button>
                </div>`;
        }
    });
    
    if (totalVal) totalVal.innerText = totalSum + ' ₴';
    if (totalSum === 0) closeCart();
}

function deleteProduct(title) {
    document.querySelectorAll('.product-card').forEach(card => {
        if (card.querySelector('.product-title').innerText === title) {
            const counter = card.querySelector('.counter-container');
            const buyBtn = card.querySelector('.buy-btn');
            const countVal = card.querySelector('.count-value');
            
            if (counter) counter.style.display = 'none';
            if (buyBtn) buyBtn.style.display = 'block';
            if (countVal) countVal.innerText = 1;
        }
    });
    updateTotal();
    renderCartItems();
}

function closeCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

// ОФОРМЛЕНИЕ
function goToCheckout() {
    const s1 = document.getElementById('cart-stage-1');
    const s2 = document.getElementById('cart-stage-2');
    if (s1 && s2) {
        s1.style.display = 'none';
        s2.style.display = 'block';
    }
}

function backToCart() {
    const s1 = document.getElementById('cart-stage-1');
    const s2 = document.getElementById('cart-stage-2');
    if (s1 && s2) {
        s1.style.display = 'block';
        s2.style.display = 'none';
    }
}

async function finalCheckout() {
    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const addrInput = document.getElementById('customer-address');
    
    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = addrInput ? addrInput.value.trim() : '';

    if (!name || !phone) return alert("Заповніть ім'я та телефон! 🌸");

    let cartItems = [];
    let messageItems = "";
    
    document.querySelectorAll('.product-card').forEach(card => {
        if (card.querySelector('.counter-container').style.display === 'flex') {
            const title = card.querySelector('.product-title').innerText;
            const qty = parseInt(card.querySelector('.count-value').innerText);
            cartItems.push({ name: title, quantity: qty });
            messageItems += `▪️ ${title}: ${qty} шт.\n`;
        }
    });

    // Отправка в n8n
    await fetch(N8N_REDUCE_STOCK_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ body: { cart: cartItems } })
    });

    // Формируем сообщение для ТГ
    const fullMessage = `👤 Клієнт: ${name}\n📞 Тел: ${phone}\n📍 Адреса: ${address}\n\n🛒 Замовлення:\n${messageItems}\n💰 Разом: ${totalSum} ₴`;
    
    window.location.href = `https://t.me/tinellton?text=${encodeURIComponent(fullMessage)}`;
}

// Закрытие при клике на темный фон
window.onclick = function(event) {
    const modal = document.getElementById('cart-modal');
    if (event.target === modal) closeCart();
}

window.onload = loadStore;