const testReviews = [
    { name: "Андрій", text: "Замовляв троянди для дівчини. Квіти свіжі, пахнуть на всю кімнату! Доставили вчасно, майстер справжній профі, допоміг вибрати найкращий варіант під мій бюджет. Буду звертатися ще обов'язково!" },
    { name: "Олена", text: "Дуже дякую за оперативну доставку в таку рань! Букет був просто неймовірний, квіти трималися дуже довго. Сервіс на найвищому рівні, тепер буду вашим постійним клієнтом." },
    { name: "Іван", text: "Букет був величезний, дружина в захваті. Рекомендую! Дуже зручно, що можна все оформити онлайн і не переживати за якість. Майстри знають свою справу на всі 100%." },
    { name: "Тетяна", text: "Ніжні кольори, свіжий аромат. Все на вищому рівні. Окреме дякую за підказку щодо догляду за квітами, вони радували око більше тижня!" },
    { name: "Максим", text: "Зручно платити, швидко привозять. 10/10. Весь процес від замовлення до отримання пройшов гладко і без жодних затримок." },
    { name: "Юлія", text: "Замовляю не перший раз, стабільно якісно. Квіти завжди свіжі, а оформлення просто вишка. Кращий квітковий у нашому місті." },
    { name: "Віктор", text: "Флористи — майстри своєї справи. Букет-шедевр. Потрібно було щось особливе на ювілей, і хлопці перевершили всі мої очікування." },
    { name: "Анна", text: "Квіти як з картинки! Дуже дякую за настрій. Доставка була хвилина в хвилину, кур'єр дуже ввічливий. Ви молодці!" },
    { name: "Дмитро", text: "Все чітко, без зайвих питань. Майстер — профі. Потрібно було терміново зібрати композицію, зробили за 20 хвилин і просто ідеально." },
    { name: "Катерина", text: "Чудовий вибір і дуже приємні ціни. Тепер за квітами тільки до вас, бо тут відчувається любов до своєї справи в кожній пелюстці." }
];

function initReviews() {
    const track = document.getElementById('reviews-track');
    const leaveBtn = document.querySelector('.leave-review-btn');
    
    // 1. Генерируем карточки
    const reviewHTML = testReviews.map(rev => `
        <div class="review-card">
            <div class="review-header">
                <h4 class="review-name">${rev.name}</h4>
                <div class="review-stars-group">★★★★★</div>
            </div>
            <p class="review-text">${rev.text}</p>
            <button class="read-more-btn" onclick="openModal('${rev.name}', '${rev.text.replace(/'/g, "\\'")}')">Читати повністю →</button>
        </div>
    `).join('');

    // Дублируем для бесконечного скролла
    track.innerHTML = reviewHTML + reviewHTML;

    // 2. Пауза при наведении (исправлено для JS управления)
    track.addEventListener('mouseenter', () => {
        if (!document.getElementById('modalOverlay').classList.contains('active')) {
            track.style.animationPlayState = 'paused';
        }
    });

    track.addEventListener('mouseleave', () => {
        if (!document.getElementById('modalOverlay').classList.contains('active')) {
            track.style.animationPlayState = 'running';
        }
    });

    // 3. Создаем структуру модалки, если её нет
    if (!document.getElementById('modalOverlay')) {
        const modalTemplate = `
            <div class="modal-overlay" id="modalOverlay" onclick="closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <span class="close-modal" onclick="closeModal()">&times;</span>
                    <div id="modalBody">
                        <div class="review-header" style="margin-bottom: 20px;">
                            <h4 id="modalName" style="color: #fff; font-size: 20px; margin: 0;"></h4>
                            <div id="modalStars" style="color: #CBA35C; letter-spacing: 2px;">★★★★★</div>
                        </div>
                        <p id="modalText" style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0;"></p>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalTemplate);
    }

    // 4. Логика кнопки "Залишити відгук"
    if (leaveBtn) {
        leaveBtn.onclick = openReviewForm;
    }
}

// Открытие модалки для чтения
window.openModal = function(name, text) {
    const modal = document.getElementById('modalOverlay');
    const track = document.getElementById('reviews-track');
    
    // Сначала сбрасываем контент к виду "Просмотр"
    document.getElementById('modalName').innerText = name;
    document.getElementById('modalText').innerText = text;
    document.getElementById('modalStars').style.display = 'block';

    modal.classList.add('active');
    track.style.animationPlayState = 'paused';
};

// Открытие формы отзыва
window.openReviewForm = function() {
    const modal = document.getElementById('modalOverlay');
    const track = document.getElementById('reviews-track');
    
    document.getElementById('modalName').innerText = "Залишити відгук";
    document.getElementById('modalStars').style.display = 'none';
    
    const formHtml = `
        <form class="review-form" id="actualReviewForm" style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
            <input type="text" id="revName" placeholder="Ваше ім'я" required style="background: #050505; border: 1px solid #222; padding: 12px; color: #fff; border-radius: 8px;">
            <textarea id="revText" placeholder="Ваш відгук" required style="background: #050505; border: 1px solid #222; padding: 12px; color: #fff; border-radius: 8px; height: 100px; resize: none;"></textarea>
            <button type="submit" class="submit-btn" style="background: #CBA35C; color: #000; border: none; padding: 15px; border-radius: 8px; font-weight: 700; cursor: pointer;">
                Надіслати відгук
            </button>
        </form>
    `;
    
    document.getElementById('modalText').innerHTML = formHtml;
    modal.classList.add('active');
    track.style.animationPlayState = 'paused';

    document.getElementById('actualReviewForm').onsubmit = async function(e) {
        e.preventDefault();
        const btn = this.querySelector('button');
        btn.innerText = "Надсилаємо..."; // Тут тоже поменял статус
        btn.disabled = true;

        const data = {
            name: document.getElementById('revName').value,
            text: document.getElementById('revText').value
        };

        try {
            await fetch('ТВОЙ_WEBHOOK_URL_N8N', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            // Финальное сообщение без упоминания аудитора
            document.getElementById('modalBody').innerHTML = `
                <div style='text-align:center; padding:20px;'>
                    <h3 style='color:#CBA35C'>Дякуємо!</h3>
                    <p style='color:#fff'>Ваш відгук успішно надіслано.</p>
                </div>`;
            setTimeout(closeModal, 2500);
        } catch (err) {
            alert("Помилка відправки.");
            btn.innerText = "Надіслати відгук";
            btn.disabled = false;
        }
    };
};

window.closeModal = function() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('reviews-track').style.animationPlayState = 'running';
    // Небольшая задержка, чтобы очистить контент после закрытия анимации
    setTimeout(() => {
        document.getElementById('modalBody').innerHTML = `
            <div class="review-header" style="margin-bottom: 20px;">
                <h4 id="modalName" style="color: #fff; font-size: 20px; margin: 0;"></h4>
                <div id="modalStars" style="color: #CBA35C; letter-spacing: 2px;">★★★★★</div>
            </div>
            <p id="modalText" style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0;"></p>
        `;
    }, 300);
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

document.addEventListener('DOMContentLoaded', initReviews);