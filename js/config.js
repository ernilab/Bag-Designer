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

// Обязательные наклейки (ID)
const REQUIRED_STICKERS = [5, 2, 13];

// Конфигурация размеров наклеек (в миллиметрах)
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
  13: { width: 300, height: 75, type: 'square_xl', name: 'Большой логотип' },
  14: { width: 70, height: 80, type: 'square_xl', name: 'Большой логотип' }
};

// Типы наклеек для категоризации
const STICKER_TYPES = {
  square_large: '10×10 см',
  square_medium: '8×8 см',
  square_small: '6×6 см',
  square_xl: '12×12 см',
  rectangle_wide: '24×9 см',
  rectangle_medium: '15×5 см',
  rectangle_long: '20×6 см',
  rectangle_thin: '18×4 см',
  rectangle_tall: '7×14 см',
  custom: 'Особый размер'
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
    stickerInfo: 'Size:',
    warningTitle: 'Required Stickers Missing!',
    missingStickersText: 'Please add the following required stickers to your design:',
    okText: 'OK',
    requiredStickerName5: 'Delivery Banner',
    requiredStickerName2: 'QR Code',
    stickerCountText: 'Stickers: {0} (min {1} - max {2})',
    tooManyStickerWarning: 'You can place maximum 5 stickers!',
    tooFewStickersWarning: 'Please place at least 2 stickers.',
    requiredStickerName13: 'Large Logo'
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
    stickerInfo: 'Rozmiar:',
    okText: 'OK',
    requiredStickerName5: 'Banner Dostawy',
    requiredStickerName2: 'Kod QR',
    warningTitle: 'Brakuje Wymaganej Naklejki!',
    missingStickersText: 'Dodaj przynajmniej JEDNĄ z tych wymaganych naklejek do swojego projektu:',
    stickerCountText: 'Naklejki: {0} (min {1} - max {2})',
    tooManyStickerWarning: 'Możesz umieścić maksymalnie 5 naklejek!',
    tooFewStickersWarning: 'Umieść co najmniej 2 naklejki.',
    requiredStickerName13: 'Duże Logo'
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
    stickerInfo: 'Размер:',
    warningTitle: 'Отсутствует Обязательная Наклейка!',
    missingStickersText: 'Добавьте хотя бы ОДНУ из этих обязательных наклеек в ваш дизайн:',
    okText: 'OK',
    requiredStickerName5: 'Баннер Доставки',
    requiredStickerName2: 'QR Код',
    stickerCountText: 'Наклейки: {0} (мин {1} - макс {2})',
    tooManyStickerWarning: 'Вы можете разместить максимум 5 наклеек!',
    tooFewStickersWarning: 'Пожалуйста, разместите минимум 2 наклейки.',
    requiredStickerName13: 'Большой Логотип'
  }
};

// Настройки приложения
const APP_CONFIG = {
  MAX_STICKERS: 20,
  CANVAS_QUALITY: 2, // Множитель для финального изображения
  AUTO_SAVE: false,
  DEBUG: false
};

// Функция для получения конфигурации наклейки
function getStickerConfig(stickerId) {
  return STICKER_CONFIGS[stickerId] || {
    width: 100,
    height: 100,
    type: 'default',
    name: `Наклейка ${stickerId}`
  };
}

// Функция для получения пути к изображению наклейки
function getStickerImagePath(stickerId) {
  return `${IMAGE_PATHS.STICKERS_DIR}${stickerId}${IMAGE_PATHS.STICKER_EXTENSION}`;
}

// Функция для получения пути к изображению сумки
function getBagImagePath() {
  return IMAGE_PATHS.BAG;
}

// Функция для проверки, является ли наклейка обязательной
function isRequiredSticker(stickerId) {
  return REQUIRED_STICKERS.includes(Number(stickerId));
}

// Получить имя обязательной наклейки
function getRequiredStickerName(stickerId) {
  const key = `requiredStickerName${stickerId}`;
  return translations[currentLanguage][key] ||
    STICKER_CONFIGS[stickerId]?.name ||
    `Required Sticker ${stickerId}`;
}