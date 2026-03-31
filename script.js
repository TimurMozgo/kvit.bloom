let totalSum = 0;
const N8N_WEBHOOK_URL = 'https://tiktiok.xyz/webhook/4f86d599-fee4-49a4-8fb6-69fd6738cefe';
const ORDER_AUDIT_URL = 'ССЫЛКА_ДЛЯ_ЗАКАЗОВ_ИЗ_N8N'; // Сюда будут падать заказы в таблицу

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
        const title = item['Название'] || 'Без назви';
        const price = parseInt(item['Цена']) || 0;
        const quantity = parseInt(item['Кол-во']) || 0;
        const img = item['Фото'] || ''; 

        if (quantity <= 0) return;

        container.innerHTML += `
            <div class="product-card">
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

// 3. ЛОГИКА
function showCounter(btn) {
    const card = btn.closest('.product-card');
    const counter = card.querySelector('.counter-container');
    btn.style.display = 'none';
    counter.style.display = 'flex'; 
    updateTotal();
    openCart(); // Сразу открываем корзину, чтобы человек видел, что добавил
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
    openCart();
}

function updateTotal() {
    let tempTotal = 0;
    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const price = parseInt(card.querySelector('.product-price').innerText.replace(/\D/g, '')) || 0;
            const count = parseInt(card.querySelector('.count-value').innerText) || 0;
            tempTotal += (price * count);
        }
    });
    totalSum = tempTotal;
}

// 4. КОРЗИНА (УБРАЛИ ЛИШНИЕ ИКОНКИ)
function openCart() {
    const modal = document.getElementById('cart-modal');
    const list = document.getElementById('cart-items-list');
    const totalContainer = document.getElementById('cart-total-value');
    
    if (!modal || !list || totalSum === 0) return;

    list.innerHTML = ''; 
    modal.style.display = 'flex';
    modal.classList.add('active');

    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const title = card.querySelector('.product-title').innerText;
            const price = card.querySelector('.product-price').innerText;
            const count = card.querySelector('.count-value').innerText;

            list.innerHTML += `
                <div class="cart-item">
                    <div><b>${title}</b><br><small>${count} шт. x ${price}</small></div>
                    <button onclick="deleteProduct('${title}')" style="color:red; background:none; border:none; cursor:pointer;">✕</button>
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

// 5. ФИНАЛЬНЫЙ ЧЕКАУТ
async function checkout() {
    let message = "🛒 *Нове замовлення:*\n\n";
    let orderData = [];
    
    document.querySelectorAll('.product-card').forEach(card => {
        const counter = card.querySelector('.counter-container');
        if (counter && counter.style.display === 'flex') {
            const title = card.querySelector('.product-title').innerText;
            const count = card.querySelector('.count-value').innerText;
            message += `▪️ *${title}*: ${count} шт.\n`;
            orderData.push({ title, count });
        }
    });

    if (orderData.length === 0) return;

    // АУДИТ В ТАБЛИЦУ (тихо, в фоне)
    try {
        fetch(ORDER_AUDIT_URL, {
            method: 'POST',
            body: JSON.stringify({ items: orderData, total: totalSum })
        });
    } catch(e) {}

    message += `\n💰 *Разом: ${totalSum} ₴*`;
    window.location.href = `https://t.me/tinellton?text=${encodeURIComponent(message)}`;
}

window.onload = loadStore;