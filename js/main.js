// Главный JavaScript файл

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeVideo();
    initializeNavigation();
});

// Инициализация видео
function initializeVideo() {
    const video = document.getElementById('mainVideo');
    if (video) {
        // Попытка воспроизвести видео
        video.play().catch(function(error) {
            console.log('Автоматическое воспроизведение заблокировано:', error);
            // Можно добавить обработчик клика для запуска видео
        });
    }
}

// Инициализация навигации
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            // Добавляем эффект нажатия
            this.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// Функция для создания интерактивных элементов поверх видео (для будущего использования)
function createHotspot(x, y, callback) {
    const hotspot = document.createElement('div');
    hotspot.className = 'interactive-hotspot';
    hotspot.style.left = x + '%';
    hotspot.style.top = y + '%';
    
    if (callback) {
        hotspot.addEventListener('click', callback);
    }
    
    return hotspot;
}

// Утилита для получения параметров из URL
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Плавная прокрутка
function smoothScrollTo(element) {
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

