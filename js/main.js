// Главный JavaScript файл

document.addEventListener('DOMContentLoaded', function () {
    initializeVideo();
    initializeNavigation();
    initializeHorseSlider();
});

function initializeVideo() {
    const video = document.getElementById('mainVideo');
    if (!video) return;
    video.play().catch(() => {});
}

function initializeNavigation() {
    document.querySelectorAll('.nav-btn').forEach((btn) => {
        btn.addEventListener('click', function () {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => (this.style.transform = ''), 150);
        });
    });
}


function initializeHorseSlider() {
    const container = document.getElementById('ringCarouselContainer');
    const ring = document.getElementById('ringCarousel');
    if (!container || !ring) return;

    const items = Array.from(ring.children);
    // Подписи: создаём/обновляем элемент и дублируем текст в data-text для псевдоэлементов
    items.forEach((el) => {
        const img = el.querySelector('img');
        const title = img && img.alt ? img.alt.trim() : '';
        let cap = el.querySelector('.item-caption');
        if (!cap) {
            cap = document.createElement('div');
            cap.className = 'item-caption';
            // два слоя: градиентная тень и белый текст
            const shadow = document.createElement('span');
            shadow.className = 'caption-shadow';
            const fill = document.createElement('span');
            fill.className = 'caption-fill';
            cap.appendChild(shadow);
            cap.appendChild(fill);
            el.appendChild(cap);
        }
        const shadowEl = cap.querySelector('.caption-shadow');
        const fillEl = cap.querySelector('.caption-fill');
        if (shadowEl) {
            shadowEl.textContent = title;
        }
        if (fillEl) {
            fillEl.textContent = title;
        }
        cap.setAttribute('data-text', title);
    });

    const N = items.length;
    const step = 360 / N;
    let index = 0;
    let autoTimer = null;

    function layout() {
        items.forEach((el, i) => {
            const angle = step * i;
            // базовая позиция на кольце + возможный корректирующий поворот и масштаб для центра
            el.style.transform = `rotateY(${angle}deg) translateZ(620px) rotateY(var(--fix, 0deg)) scale(var(--scale, 1))`;
        });
        setNeighborCounters(index);
        updateDepth();
    }

    function updateDepth() {
        items.forEach((el, i) => {
            const rel360 = ((i - index) * step % 360 + 360) % 360; // 0..360
            const depth = rel360 > 140 && rel360 < 220 ? 'back' : (rel360 > 100 && rel360 < 140) || (rel360 > 220 && rel360 < 260) ? 'mid' : 'front';
            el.dataset.depth = depth;
        });
    }

    // Выставляет контр‑поворот и лёгкое выдвижение соседей слева/справа от текущего индекса
    function setNeighborCounters(targetIndex){
        items.forEach((el,i)=>{
            const rel360 = ((i - targetIndex) * step % 360 + 360) % 360;
            const signed = rel360 > 180 ? rel360 - 360 : rel360; // -180..180
            const isFrontTrio = Math.abs(signed) <= step + 0.1; // центр и два соседа
            // Делает три фронтальных элемента прямыми (без наклона)
            el.style.setProperty('--counter', isFrontTrio ? `${-signed}deg` : '0deg');
            // Без дополнительного выдвижения для фронтальной тройки
            el.style.setProperty('--zfix', '0px');
            // Доп. фиксация поворота самого элемента (а не только картинки)
            el.style.setProperty('--fix', isFrontTrio ? `${-signed}deg` : '0deg');
            // Увеличиваем центральный элемент
            const isCenter = Math.abs(signed) < 0.01;
            el.style.setProperty('--scale', isCenter ? '1.25' : '1');
        });
    }

    function go(dir = 1) {
        index = (index + dir + N) % N;
        // сразу объявляем новые контр‑повороты, чтобы соседние элементы оставались прямыми во время анимации
        setNeighborCounters(index);
        ring.style.transform = `rotateY(${-index * step}deg)`;
        clearTimeout(go.t);
        go.t = setTimeout(updateDepth, 820);
    }

    const prevBtn = container.querySelector('.slider-btn.prev');
    const nextBtn = container.querySelector('.slider-btn.next');
    if (prevBtn) prevBtn.addEventListener('click', () => go(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => go(1));

    container.addEventListener('mouseenter', () => {
        if (autoTimer) {
            clearInterval(autoTimer);
            autoTimer = null;
        }
    });
    container.addEventListener('mouseleave', () => {
        if (!autoTimer) autoTimer = setInterval(() => go(1), 3000);
    });

    // свайп
    let sx = null;
    ring.addEventListener('pointerdown', (e) => {
        sx = e.clientX;
    });
    window.addEventListener('pointerup', (e) => {
        if (sx == null) return;
        const dx = e.clientX - sx;
        if (Math.abs(dx) > 30) go(dx < 0 ? 1 : -1);
        sx = null;
    });

    layout();
    autoTimer = setInterval(() => go(1), 3000);
}

