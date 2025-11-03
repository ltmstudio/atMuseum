// Главный JavaScript файл

document.addEventListener('DOMContentLoaded', function () {
    initializeIntroScreen();
    initializeVideo();
    initializeNavigation();
    initializeHorseSlider();
    initializeBedewlerDetails();
    initializeIdleScreen();
});

function initializeVideo() {
    const video = document.getElementById('mainVideo');
    if (!video) return;
    video.play().catch(() => { });
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
    let suppressClickUntil = 0; // защита от клика сразу после свайпа

    // Восстанавливаем позицию слайда при возврате со страницы деталей
    const savedIndex = sessionStorage.getItem('bedewler_last_slide_index');
    if (savedIndex !== null) {
        index = parseInt(savedIndex, 10);
        if (isNaN(index) || index < 0 || index >= N) {
            index = 0;
        }
    }

    function layout() {
        items.forEach((el, i) => {
            const angle = step * i;
            // базовая позиция на кольце + возможный корректирующий поворот и масштаб для центра
            el.style.transform = `rotateY(${angle}deg) translateZ(620px) rotateY(var(--fix, 0deg)) scale(var(--scale, 1))`;
        });
        setNeighborCounters(index);
        ring.style.transform = `rotateY(${-index * step}deg)`;
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
    function setNeighborCounters(targetIndex) {
        items.forEach((el, i) => {
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

    // клики по слайдам → переход на страницу деталей с id из alt
    items.forEach((el) => {
        el.addEventListener('click', () => {
            if (Date.now() < suppressClickUntil) return; // игнорировать после свайпа
            // Используем центральный элемент вместо кликнутого
            const centerItem = items[index];
            const img = centerItem.querySelector('img');
            const id = img && img.alt ? encodeURIComponent(img.alt.trim()) : '';
            console.log('Navigating to bedewler-details.html with id:', id);
            // Сохраняем текущий слайд для возврата
            sessionStorage.setItem('bedewler_last_slide_index', index);
            window.location.href = `bedewler-details.html?id=${id}`;
        });
    });

    // перетаскивание мышкой и свайп
    let isDragging = false;
    let startX = null;
    let startIndex = null;
    let currentRotation = 0;
    // Пикселей для перехода на один слайд (чем больше — тем медленнее)
    const pixelsPerSlide = 260;
    // Сглаживание анимации во время перетаскивания
    let targetRotation = 0;
    let displayRotation = 0;
    let rafId = null;

    function rafTick(){
        displayRotation += (targetRotation - displayRotation) * 0.12; // плавное приближение
        ring.style.transform = `rotateY(${displayRotation}deg)`;
        if (Math.abs(targetRotation - displayRotation) > 0.05) {
            rafId = requestAnimationFrame(rafTick);
        } else {
            rafId = null;
        }
    }

    function startDrag(e) {
        if (e.button !== undefined && e.button !== 0 && e.type !== 'pointerdown') return; // только ЛКМ
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
        isDragging = true;
        startX = e.clientX;
        startIndex = index;
        currentRotation = -index * step;
        targetRotation = currentRotation;
        displayRotation = currentRotation;
        ring.style.transition = 'none';
        container.style.cursor = 'grabbing';
        if (!rafId) rafId = requestAnimationFrame(rafTick);
        e.preventDefault();
    }

    function handleDrag(e) {
        if (!isDragging || startX === null) return;
        const dx = e.clientX - startX;
        const deltaSlides = dx / pixelsPerSlide; // сколько «слайдов» по горизонтали протащили
        const deltaAngle = deltaSlides * step;   // переводим в градусы
        targetRotation = currentRotation + deltaAngle;
        if (!rafId) rafId = requestAnimationFrame(rafTick);
        e.preventDefault();
    }

    function endDrag(e) {
        if (!isDragging) return;
        isDragging = false;
        ring.style.transition = ''; // вернуть CSS-анимацию для снапа
        container.style.cursor = '';

        // Находим ближайший слайд на основе текущего угла поворота
        // Используем displayRotation (реальный текущий угол) вместо targetRotation
        // Индекс вычисляется: rotation = -index * step, значит index = -rotation / step
        let currentAngle = displayRotation;
        let closestIndex = Math.round(-currentAngle / step);
        // Нормализуем индекс в диапазон 0..N-1
        closestIndex = ((closestIndex % N) + N) % N;
        
        // Обновляем индекс только если он действительно изменился
        if (closestIndex !== index) {
            index = closestIndex;
            setNeighborCounters(index);
        }
        
        // Плавно анимируем к позиции выбранного слайда
        const finalRotation = -index * step;
        ring.style.transform = `rotateY(${finalRotation}deg)`;
        clearTimeout(go.t);
        go.t = setTimeout(updateDepth, 820);
        
        const dx = startX !== null ? e.clientX - startX : 0;
        if (Math.abs(dx) > 30) suppressClickUntil = Date.now() + 250;

        startX = null;
        startIndex = null;
        currentRotation = finalRotation;
        targetRotation = finalRotation;
        displayRotation = finalRotation;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        // вернуть авто-прокрутку
        if (!autoTimer) autoTimer = setInterval(() => go(1), 3000);
    }

    // Для мыши
    ring.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', endDrag);

    // Для touch и pointer (сохраняем существующий функционал)
    let sx = null;
    ring.addEventListener('pointerdown', (e) => {
        startDrag(e);
        sx = e.clientX;
    });
    window.addEventListener('pointermove', handleDrag);
    window.addEventListener('pointerup', (e) => {
        endDrag(e);
        if (sx == null) return;
        const dx = e.clientX - sx;
        if (Math.abs(dx) > 30 && !isDragging) {
            go(dx < 0 ? 1 : -1);
            suppressClickUntil = Date.now() + 250;
        }
        sx = null;
    });

    layout();
    autoTimer = setInterval(() => go(1), 3000);
}

// Инициализация страницы деталей Bedewler: загружаем контент по id из query
function initializeBedewlerDetails() {
    const headerWrap = document.querySelector('.details-header .item-caption');
    const titleFill = document.querySelector('.details-header .item-caption .caption-fill');
    const titleShadow = document.querySelector('.details-header .item-caption .caption-shadow');
    const textEl = document.querySelector('.details-text .details-text-content');
    const imgEl = document.querySelector('.details-figure .figure-img');
    if (!headerWrap || !titleFill || !titleShadow || !textEl || !imgEl) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || 'ÝANARDAG';
    const slug = id.trim();
    console.log('Loading bedewler details for id:', id, 'slug:', slug);
    const url = `../content/bedewler/${encodeURIComponent(slug)}.json`;

    // Локальный словарь вынесен в отдельный файл content/bedewler/content.js
    const local = (window.BEDEWLER_CONTENT && window.BEDEWLER_CONTENT[slug]) || null;
    console.log('Found local content:', local ? 'YES' : 'NO');
    if (local) {
        titleFill.textContent = local.title;
        titleShadow.textContent = local.title;
        headerWrap.setAttribute('data-text', local.title);
        textEl.textContent = local.text;
        imgEl.src = `../assets/images/bedewler/${local.image}`;
        imgEl.alt = local.title;
        return; // не делаем fetch, всё уже подставили
    }

    fetch(url)
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Not found')))
        .then(data => {
            const title = data.title || slug;
            const text = data.text || '';
            const imageFile = data.image || '';
            titleFill.textContent = title;
            titleShadow.textContent = title;
            headerWrap.setAttribute('data-text', title);
            textEl.textContent = text;
            if (imageFile) {
                // Если указан относительный путь c папкой — используем как есть, иначе берём из assets/images/bedewler/atlar_png
                const isDirectPath = /[\\/]/.test(imageFile);
                imgEl.src = isDirectPath ? imageFile : `../assets/images/bedewler/atlar_png/${imageFile}`;
                imgEl.alt = title;
            }
        })
        .catch(() => {
            // Фоллбек: заполняем из id, оставляем текущую картинку
            titleFill.textContent = slug;
            titleShadow.textContent = slug;
            headerWrap.setAttribute('data-text', slug);
        });
}

// Экран-заглушка при бездействии (5 минут)
function initializeIdleScreen() {
    const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 минут в миллисекундах
    let idleTimer = null;
    let idleScreen = null;
    let idleVideo = null;

    function createIdleScreen() {
        if (idleScreen) return idleScreen;
        
        // Определяем путь к видео в зависимости от текущей страницы
        const currentPath = window.location.pathname || window.location.href;
        const isInPages = currentPath.includes('/pages/') || currentPath.includes('\\pages\\');
        const videoPath = isInPages ? '../assets/videos/pano.mp4' : 'assets/videos/pano.mp4';
        
        idleScreen = document.createElement('div');
        idleScreen.className = 'idle-screen';
        idleScreen.innerHTML = `<video id="idleVideo" autoplay muted loop playsinline><source src="${videoPath}" type="video/mp4">Ваш браузер не поддерживает видео.</video>`;
        document.body.appendChild(idleScreen);
        idleVideo = document.getElementById('idleVideo');
        
        if (idleVideo) {
            idleVideo.addEventListener('loadeddata', () => {
                idleVideo.play().catch(err => console.log('Ошибка воспроизведения:', err));
            });
            idleVideo.addEventListener('error', (e) => {
                console.log('Ошибка загрузки видео:', videoPath, e);
            });
            idleVideo.load(); // Принудительно загружаем видео
        }
        return idleScreen;
    }

    function showIdleScreen() {
        const screen = createIdleScreen();
        screen.classList.add('active');
        if (idleVideo) {
            idleVideo.currentTime = 0; // Сбрасываем на начало
            idleVideo.play().catch(err => console.log('Ошибка воспроизведения при показе:', err));
        }
    }

    function hideIdleScreen() {
        if (idleScreen && idleScreen.classList.contains('active')) {
            idleScreen.classList.remove('active');
            if (idleVideo) {
                idleVideo.pause();
            }
        }
    }

    let lastActivityTime = Date.now();
    let throttled = false;

    function resetIdleTimer() {
        // Throttle для предотвращения слишком частых сбросов
        const now = Date.now();
        if (throttled && (now - lastActivityTime) < 1000) {
            return; // Пропускаем, если сброс был меньше секунды назад
        }
        throttled = true;
        setTimeout(() => { throttled = false; }, 1000);
        
        lastActivityTime = now;
        
        if (idleTimer) {
            clearTimeout(idleTimer);
        }
        hideIdleScreen(); // скрываем экран при активности
        
        // Запускаем таймер заново
        idleTimer = setTimeout(() => {
            console.log('Показываем экран-заглушку после 5 минут бездействия');
            showIdleScreen();
        }, IDLE_TIMEOUT);
        
        console.log('Таймер бездействия сброшен, следующий показ через 5 минут');
    }

    // Отслеживание активности пользователя (убрали mousemove - он срабатывает слишком часто)
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'pointerdown', 'wheel'];
    
    // Для mousemove делаем специальную обработку с большим throttle
    let mouseMoveThrottle = null;
    document.addEventListener('mousemove', () => {
        if (!mouseMoveThrottle) {
            mouseMoveThrottle = setTimeout(() => {
                resetIdleTimer();
                mouseMoveThrottle = null;
            }, 2000); // Сбрасываем таймер только раз в 2 секунды при движении мыши
        }
    }, { passive: true });

    activityEvents.forEach(event => {
        document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Запускаем таймер при загрузке страницы
    console.log('Экран-заглушка инициализирован, таймер запущен на 5 минут');
    resetIdleTimer();
}

// Экран-интро при первом открытии страницы
function initializeIntroScreen() {
    const introScreen = document.querySelector('.intro-screen');
    if (!introScreen) return;
    
    const introVideo = introScreen.querySelector('video');
    if (!introVideo) return;
    
    // Используем уникальное имя для каждой страницы
    const pageKey = 'introShown_' + window.location.pathname;
    let hasShown = sessionStorage.getItem(pageKey);
    
    // Если интро уже показывалось в этой сессии, скрываем сразу
    if (hasShown === 'true') {
        // Уже скрыто по умолчанию в HTML
        return;
    }
    
    // Первый раз - показываем интро
    introScreen.classList.remove('hidden');
    
    // Отслеживание активности для скрытия интро
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'pointerdown', 'wheel', 'mousemove'];
    let hidden = false;
    
    function hideIntro() {
        if (hidden) return;
        hidden = true;
        introScreen.classList.add('hidden');
        sessionStorage.setItem(pageKey, 'true');
        
        // Удаляем обработчики событий
        activityEvents.forEach(event => {
            document.removeEventListener(event, hideIntro, { passive: true });
        });
    }
    
    // Добавляем обработчики с небольшой задержкой, чтобы избежать случайных событий при загрузке
    setTimeout(() => {
        activityEvents.forEach(event => {
            document.addEventListener(event, hideIntro, { passive: true });
        });
    }, 100);
    
    console.log('Экран-интро инициализирован');
}

