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
    5: { width: 100, height: 100, type: 'rectangle_wide', name: 'Call Us' },
    6: { width: 100, height: 100, type: 'rectangle_wide', name: 'Become a courier with Eternis' },
    
    // Прямоугольные наклейки 24x9 см
    7: { width: 100, height: 50, type: 'rectangle_wide', name: 'Слоган' },
    8: { width: 100, height: 50, type: 'rectangle_wide', name: 'Инструкции' },
    9: { width: 100, height: 50, type: 'rectangle_medium', name: 'Средний текст' },
    // Дополнительные размеры

    10: { width: 140, height: 45, type: 'square_medium', name: 'Средний логотип' },
    11: { width: 100, height: 75, type: 'square_small', name: 'Маленькая иконка' },
    12: { width: 240, height: 90, type: 'rectangle_long', name: 'Длинный текст' },
    13: { width: 340, height: 85, type: 'square_xl', name: 'Большой логотип' },
    14: { width: 70, height: 80, type: 'square_xl', name: 'Большой логотип' }

// Переводы
const translations = {
    en: {
        title: 'Design your unique bag',
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
        title: 'Zaprojektuj swoją unikalną torbę',
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
        title: 'Твой уникальный дизайн сумки',
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
