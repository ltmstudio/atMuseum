# Проект музея

Интерактивный проект музея с видео-фоном и навигацией по разделам.

## Структура проекта

```
museum/
├── index.html              # Главная страница с навигацией
├── pages/                  # Страницы разделов
│   ├── bedewler.html      # Bedewler barada?
│   ├── kitaplar.html      # Kitaplar
│   ├── taryhy.html        # Taryhy
│   ├── medeniyeti.html    # Medeniyeti
│   ├── sygyrlar.html      # Sygyrlar
│   └── binalar.html       # Binalar
├── css/
│   ├── bootstrap.min.css  # Bootstrap CSS (нужно скачать)
│   └── style.css          # Свои стили
├── js/
│   ├── bootstrap.bundle.min.js  # Bootstrap JS (нужно скачать)
│   └── main.js            # Основной JavaScript
├── videos/                # Видео файлы
│   └── main-video.mp4     # Главное видео для фона
└── images/                # Изображения (опционально)
```

## Установка

1. Скачайте Bootstrap 5 (или последнюю версию) с официального сайта:
   - Перейдите на https://getbootstrap.com/docs/5.3/getting-started/download/
   - Скачайте "Compiled CSS and JS"
   - Распакуйте и скопируйте:
     - `bootstrap.min.css` → `css/bootstrap.min.css`
     - `bootstrap.bundle.min.js` → `js/bootstrap.bundle.min.js`

2. Добавьте видео:
   - Поместите ваше главное видео в папку `videos/` с именем `main-video.mp4`
   - Или измените путь к видео в `index.html`

3. Откройте `index.html` в браузере

## Использование

- Главная страница содержит 6 кнопок навигации поверх видео-фона
- Каждая кнопка ведет на соответствующую страницу раздела
- На страницах разделов есть кнопка "Назад на главную"
- Все работает локально, без интернета

## Настройка

### Изменение видео
Отредактируйте путь к видео в `index.html`:
```html
<source src="videos/main-video.mp4" type="video/mp4">
```

### Добавление интерактивных элементов на видео
В будущем можно добавить элементы поверх видео, используя функцию `createHotspot()` в `js/main.js`.

### Настройка стилей
Все стили находятся в `css/style.css`. Можно изменить:
- Цвета кнопок
- Размеры и отступы
- Эффекты при наведении
- Адаптивность

## Технологии

- HTML5
- CSS3
- JavaScript (Vanilla)
- Bootstrap 5

## Поддержка браузеров

Проект поддерживает все современные браузеры:
- Chrome
- Firefox
- Safari
- Edge

