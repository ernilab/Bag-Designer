/**
 * Конфигурация Uber Bag Designer
 */

// Пути к изображениям в репозитории
const IMAGE_PATHS = {
    BAG: 'assets/images/bag/TorbaUber.png',
    STICKERS_DIR: 'assets/images/stickers/',
    STICKER_EXTENSION: '.png'
};

// Реальные размеры сумки
const REAL_BAG_SIZE = {
    width: 430,  // 43 см в мм
    height: 480  // 48 см в мм
};

// Конфигурация размеров наклеек
const STICKER_CONFIGS = {
    // Квадратные наклейки 10x10 см
    1: { width: 100, height: 100, type: 'square_large', name: 'Логотип Uber' },
    2: { width: 100, height: 100, type: 'square_large', name: 'QR код' },
    3: { width: 100, height: 100, type: 'square_large', name: 'Рейтинг' },
    4: { width: 100, height: 100, type: 'square_large', name: 'Иконка доставки' },
    
    // Прямоугольные наклейки 24x9 см
    5: { width: 240, height: 90, type: 'rectangle_wide', name: 'UBER DELIVERY' },
    6: { width: 240, height: 90, type: 'rectangle_wide', name: 'Номер телефона' },
    7: { width: 240, height: 90, type: 'rectangle_wide', name: 'Слоган' },
    8: { width: 240, height: 90, type: 'rectangle_wide', name: 'Инструкции' },
    
    // Дополнительные размеры
    9: { width: 150, height: 50, type: 'rectangle_medium', name: 'Средний текст' },
    10: { width: 80, height: 80, type: 'square_medium', name: 'Средний логотип' },
    11: { width: 60, height: 60, type: 'square_small', name: 'Маленькая иконка' },
    12: { width: 200, height: 60, type: 'rectangle_long', name: 'Длинный текст' },
    13: { width: 120, height: 120, type: 'square_xl', name: 'Большой логотип' },
    14: { width: 180, height: 40, type: 'rectangle_thin', name: 'Тонкая полоска' },
    15: { width: 70, height: 140, type: 'rectangle_tall', name: 'Вертикальный текст' },
    16: { width: 100, height: 100, type: 'square_large', name: 'Наклейка 16' },
    17: { width: 240, height: 90, type: 'rectangle_wide', name: 'Наклейка 17' },
    18: { width: 100, height: 100, type: 'square_large', name: 'Наклейка 18' },
    19: { width: 240, height: 90, type: 'rectangle_wide', name: 'Наклейка 19' },
    20: { width: 100, height: 100, type: 'square_large', name: 'Наклейка 20' }
};

// Переводы
const translations = {
    en: {
        title: 'Uber Bag Designer',
        back: 'Back',
        stickersTitle: 'Choose Stickers',
        saveText: 'Save Design',
        successTitle: 'Design Saved!',
        instructionText: 'Please send this image to the Eternis manager:',
        downloadText: 'Download Image',
        closeText: 'Close',
        loadingBag: 'Loading bag...',
        loadingStickers: 'Loading stickers...',
        controlTitle: 'Sticker Controls',
        rotateLabel: 'Rotate:',
        deleteText: 'Delete',
        deselectText: 'Deselect',
        stickerInfo: 'Size:'
    },
    pl: {
        title: 'Projektant Torby Uber',
        back: 'Wstecz',
        stickersTitle: 'Wybierz Naklejki',
        saveText: 'Zapisz Projekt',
        successTitle: 'Projekt Zapisany!',
        instructionText: 'Wyślij ten obraz do menedżera Eternis:',
        downloadText: 'Pobierz Obraz',
        closeText: 'Zamknij',
        loadingBag: 'Ładowanie torby...',
        loadingStickers: 'Ładowanie naklejek...',
        controlTitle: 'Kontrola Naklejek',
        rotateLabel: 'Obrót:',
        deleteText: 'Usuń',
        deselectText: 'Odznacz',
        stickerInfo: 'Rozmiar:'
    },
    ru: {
        title: 'Дизайнер Сумки Uber',
        back: 'Назад',
        stickersTitle: 'Выберите Наклейки',
        saveText: 'Сохранить Дизайн',
        successTitle: 'Дизайн Сохранен!',
        instructionText: 'Отправьте это изображение менеджеру Eternis:',
        downloadText: 'Скачать Изображение',
        closeText: 'Закрыть',
        loadingBag: 'Загрузка сумки...',
        loadingStickers: 'Загрузка наклеек...',
        controlTitle: 'Управление Наклейками',
        rotateLabel: 'Поворот:',
        deleteText: 'Удалить',
        deselectText: 'Отменить выбор',
        stickerInfo: 'Размер:'
    }
};

// Настройки приложения
const APP_CONFIG = {
    MAX_STICKERS: 20,
    CANVAS_QUALITY: 2, // Множитель для финального изображения
    AUTO_SAVE: false,
    DEBUG: false
};

// Функции для работы с конфигурацией
function getStickerConfig(stickerId) {
    return STICKER_CONFIGS[stickerId] || {
        width: 100,
        height: 100,
        type: 'default',
        name: `Наклейка ${stickerId}`
    };
}

function getStickerImagePath(stickerId) {
    return `${IMAGE_PATHS.STICKERS_DIR}${stickerId}${IMAGE_PATHS.STICKER_EXTENSION}`;
}

function getBagImagePath() {
    return IMAGE_PATHS.BAG;
}